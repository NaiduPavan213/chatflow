package com.chatflow.chatflow.service;

import com.chatflow.chatflow.dto.RoomRequest;
import com.chatflow.chatflow.dto.RoomResponse;
import com.chatflow.chatflow.dto.UnreadCount;
import com.chatflow.chatflow.exception.ApiException;
import com.chatflow.chatflow.model.Room;
import com.chatflow.chatflow.model.RoomRead;
import com.chatflow.chatflow.model.User;
import com.chatflow.chatflow.repository.MessageRepository;
import com.chatflow.chatflow.repository.RoomReadRepository;
import com.chatflow.chatflow.repository.RoomRepository;
import com.chatflow.chatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final RoomReadRepository roomReadRepository;

    @Transactional
    public RoomResponse createRoom(RoomRequest request, String email) {
        String name = request.getName().trim();
        if (roomRepository.existsByNameIgnoreCase(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "Room already exists");
        }

        User user = currentUser(email);
        Room room = new Room();
        room.setName(name);
        room.setCreatedBy(user);
        return toResponse(roomRepository.save(room), 0, null);
    }

    /** All rooms, each with the caller's unread count and read marker. */
    @Transactional(readOnly = true)
    public List<RoomResponse> getAllRooms(String email) {
        User user = currentUser(email);
        Map<Long, Long> unread = unreadByRoom(user.getId());
        Map<Long, Long> lastRead = lastReadByRoom(user.getId());
        return roomRepository.findAll(Sort.by("id"))
                .stream()
                .map(room -> toResponse(room, unread.getOrDefault(room.getId(), 0L), lastRead.get(room.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomById(Long id, String email) {
        User user = currentUser(email);
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Room not found"));
        return toResponse(room,
                unreadByRoom(user.getId()).getOrDefault(id, 0L),
                lastReadByRoom(user.getId()).get(id));
    }

    /**
     * Records that the caller has seen messages up to {@code messageId} in the room.
     * The marker only moves forward and never past the room's newest message.
     * Not transactional on purpose: each repository call commits on its own, so a duplicate
     * insert from two simultaneous requests can be recovered from.
     */
    public void markRead(Long roomId, String email, Long messageId) {
        User user = currentUser(email);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Room not found"));
        Long newest = messageRepository.findMaxIdByRoomId(roomId);
        if (newest == null) {
            return; // empty room: nothing to mark
        }
        long target = Math.min(messageId, newest);

        if (roomReadRepository.advance(user.getId(), roomId, target) > 0
                || roomReadRepository.existsByUserIdAndRoomId(user.getId(), roomId)) {
            return;
        }
        try {
            roomReadRepository.saveAndFlush(new RoomRead(user, room, target));
        } catch (DataIntegrityViolationException alreadyCreated) {
            // Another request created the row first: just move it forward
            roomReadRepository.advance(user.getId(), roomId, target);
        }
    }

    private User currentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Map<Long, Long> unreadByRoom(Long userId) {
        return messageRepository.countUnreadByRoom(userId).stream()
                .collect(Collectors.toMap(UnreadCount::roomId, UnreadCount::count));
    }

    private Map<Long, Long> lastReadByRoom(Long userId) {
        return roomReadRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(r -> r.getRoom().getId(), RoomRead::getLastReadMessageId));
    }

    private static RoomResponse toResponse(Room room, long unreadCount, Long lastReadMessageId) {
        return new RoomResponse(
                room.getId(),
                room.getName(),
                room.getCreatedBy().getUsername(),
                room.getCreatedAt(),
                unreadCount,
                lastReadMessageId
        );
    }
}
