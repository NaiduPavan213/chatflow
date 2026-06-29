package com.chatflow.chatflow.controller;

import com.chatflow.chatflow.dto.ChatMessage;
import com.chatflow.chatflow.service.ChatService;
import com.chatflow.chatflow.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final JwtUtil jwtUtil;

    @MessageMapping("/chat/{roomId}")
    public void sendMessage(@DestinationVariable Long roomId,@Payload ChatMessage chatMessage) {
        // Extract email from JWT token sent in sender field
        String email = jwtUtil.extractEmail(chatMessage.getSender());
        
        ChatMessage saved = chatService.saveMessage(
                roomId,
                email,
                chatMessage.getContent()
        );
        messagingTemplate.convertAndSend("/topic/room/" + roomId, saved);
    }

    @GetMapping("/api/rooms/{roomId}/messages")
    public List<ChatMessage> getHistory(@PathVariable Long roomId) {
        return chatService.getMessageHistory(roomId);
    }
}