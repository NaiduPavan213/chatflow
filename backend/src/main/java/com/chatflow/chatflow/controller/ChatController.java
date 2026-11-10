package com.chatflow.chatflow.controller;

import com.chatflow.chatflow.dto.ChatMessage;
import com.chatflow.chatflow.exception.ApiException;
import com.chatflow.chatflow.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    /** The sender is the authenticated STOMP user (set from the JWT on CONNECT), never the payload. */
    @MessageMapping("/chat/{roomId}")
    public void sendMessage(@DestinationVariable Long roomId,
                            @Payload ChatMessage chatMessage,
                            Principal principal) {
        ChatMessage saved = chatService.saveMessage(roomId, principal.getName(), chatMessage.getContent());
        messagingTemplate.convertAndSend("/topic/room/" + roomId, saved);
    }

    /** Errors while handling a chat message go back to the sender only, on /user/queue/errors. */
    @MessageExceptionHandler
    @SendToUser(destinations = "/queue/errors", broadcast = false)
    public Map<String, String> handleMessageError(Exception e) {
        if (e instanceof ApiException) {
            return Map.of("message", e.getMessage());
        }
        log.error("Failed to handle chat message", e);
        return Map.of("message", "Message could not be sent");
    }

    @GetMapping("/api/rooms/{roomId}/messages")
    public List<ChatMessage> getHistory(@PathVariable Long roomId) {
        return chatService.getMessageHistory(roomId);
    }
}
