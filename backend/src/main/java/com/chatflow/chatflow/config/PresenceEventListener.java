package com.chatflow.chatflow.config;

import com.chatflow.chatflow.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import java.security.Principal;
import java.util.Map;

/**
 * Keeps PresenceService in sync with STOMP subscriptions and broadcasts each room's
 * online list to /topic/room/{id}/presence whenever it may have changed.
 */
@Component
@RequiredArgsConstructor
public class PresenceEventListener {

    private final PresenceService presence;
    private final SimpMessagingTemplate messaging;

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        Principal user = event.getUser();
        if (user == null) {
            return;
        }
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        presence.subscribe(headers.getSessionId(), headers.getSubscriptionId(),
                        headers.getDestination(), presence.usernameFor(user.getName()))
                .ifPresent(this::broadcast);
    }

    @EventListener
    public void onUnsubscribe(SessionUnsubscribeEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        presence.unsubscribe(headers.getSessionId(), headers.getSubscriptionId())
                .ifPresent(this::broadcast);
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        presence.disconnect(event.getSessionId()).forEach(this::broadcast);
    }

    private void broadcast(long roomId) {
        messaging.convertAndSend("/topic/room/" + roomId + "/presence",
                Map.of("online", presence.onlineIn(roomId)));
    }
}
