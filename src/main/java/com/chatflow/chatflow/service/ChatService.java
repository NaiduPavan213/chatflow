package com.chatflow.chatflow.service;

import com.chatflow.chatflow.dto.ChatMessage;
import com.chatflow.chatflow.model.Message;
import com.chatflow.chatflow.model.Room;
import com.chatflow.chatflow.model.User;
import com.chatflow.chatflow.repository.MessageRepository;
import com.chatflow.chatflow.repository.RoomRepository;
import com.chatflow.chatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public ChatMessage saveMessage(Long roomId, String email, String content) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        Message message = new Message();
        message.setContent(content);
        message.setSender(user);
        message.setRoom(room);
        message.setSentAt(LocalDateTime.now());

        messageRepository.save(message);

        ChatMessage response = new ChatMessage();
        response.setContent(content);
        response.setSender(user.getUsername());
        response.setRoomId(roomId);
        response.setSentAt(message.getSentAt().toString());
        return response;
    }

    public List<ChatMessage> getMessageHistory(Long roomId) {
        return messageRepository.findByRoomIdOrderBySentAtAsc(roomId)
                .stream()
                .map(msg -> {
                    ChatMessage cm = new ChatMessage();
                    cm.setContent(msg.getContent());
                    cm.setSender(msg.getSender().getUsername());
                    cm.setRoomId(roomId);
                    cm.setSentAt(msg.getSentAt().toString());
                    return cm;
                })
                .collect(Collectors.toList());
    }
}