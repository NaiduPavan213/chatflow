package com.chatflow.chatflow.config;

import com.chatflow.chatflow.repository.UserRepository;
import com.chatflow.chatflow.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;

/**
 * Authenticates STOMP connections. The client sends "Authorization: Bearer <jwt>" in the
 * CONNECT frame; the user's email becomes the session Principal. SEND and SUBSCRIBE frames
 * are rejected on unauthenticated sessions.
 */
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (StompCommand.CONNECT.equals(command)) {
            String header = accessor.getFirstNativeHeader("Authorization");
            if (header == null || !header.startsWith("Bearer ")) {
                throw new MessagingException("Missing authentication token");
            }
            String token = header.substring(7);
            if (!jwtUtil.isTokenValid(token)) {
                throw new MessagingException("Invalid or expired token");
            }
            String email = jwtUtil.extractEmail(token);
            if (!userRepository.existsByEmail(email)) {
                throw new MessagingException("User no longer exists");
            }
            accessor.setUser(new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList()));
        } else if ((StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command))
                && accessor.getUser() == null) {
            throw new MessagingException("Not authenticated");
        }
        return message;
    }
}
