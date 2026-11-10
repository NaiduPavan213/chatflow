package com.chatflow.chatflow.service;

import com.chatflow.chatflow.model.User;
import com.chatflow.chatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * In-memory record of who is currently viewing each room.
 *
 * A user is "online in a room" while at least one of their WebSocket sessions is subscribed to
 * that room's message topic (/topic/room/{id}). Several tabs of the same user count once.
 * State lives in this server's memory, which is fine for a single instance.
 */
@Service
@RequiredArgsConstructor
public class PresenceService {

    private static final Pattern ROOM_TOPIC = Pattern.compile("^/topic/room/(\\d+)$");
    private static final Comparator<String> BY_NAME =
            String.CASE_INSENSITIVE_ORDER.thenComparing(Comparator.naturalOrder());

    private final UserRepository userRepository;

    /** sessionId -> username */
    private final Map<String, String> sessionUsers = new HashMap<>();
    /** sessionId -> (subscriptionId -> roomId) */
    private final Map<String, Map<String, Long>> sessionRooms = new HashMap<>();
    /** email -> username, so we do not hit the database on every event */
    private final Map<String, String> usernameByEmail = new ConcurrentHashMap<>();

    /** Display name for an authenticated principal (the principal name is the user's email). */
    public String usernameFor(String email) {
        String cached = usernameByEmail.get(email);
        if (cached != null) {
            return cached;
        }
        return userRepository.findByEmail(email)
                .map(User::getUsername)
                .map(name -> {
                    usernameByEmail.put(email, name);
                    return name;
                })
                .orElse("Unknown user");
    }

    /**
     * Records a subscription. Returns the room id if the destination is a room's message topic,
     * which means that room's online list may have changed.
     */
    public synchronized Optional<Long> subscribe(String sessionId, String subscriptionId,
                                                 String destination, String username) {
        Matcher matcher = ROOM_TOPIC.matcher(destination == null ? "" : destination);
        if (sessionId == null || subscriptionId == null || !matcher.matches()) {
            return Optional.empty();
        }
        long roomId = Long.parseLong(matcher.group(1));
        sessionUsers.put(sessionId, username);
        sessionRooms.computeIfAbsent(sessionId, k -> new HashMap<>()).put(subscriptionId, roomId);
        return Optional.of(roomId);
    }

    /** Removes one subscription. Returns the affected room id, if it was a room subscription. */
    public synchronized Optional<Long> unsubscribe(String sessionId, String subscriptionId) {
        Map<String, Long> subscriptions = sessionRooms.get(sessionId);
        if (subscriptions == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(subscriptions.remove(subscriptionId));
    }

    /** Forgets a closed session. Returns the rooms whose online list may have changed. */
    public synchronized Set<Long> disconnect(String sessionId) {
        sessionUsers.remove(sessionId);
        Map<String, Long> subscriptions = sessionRooms.remove(sessionId);
        return subscriptions == null ? Set.of() : new HashSet<>(subscriptions.values());
    }

    /** Usernames currently in the room, sorted alphabetically, each listed once. */
    public synchronized List<String> onlineIn(long roomId) {
        SortedSet<String> names = new TreeSet<>(BY_NAME);
        sessionRooms.forEach((sessionId, subscriptions) -> {
            if (subscriptions.containsValue(roomId)) {
                String username = sessionUsers.get(sessionId);
                if (username != null) {
                    names.add(username);
                }
            }
        });
        return new ArrayList<>(names);
    }
}
