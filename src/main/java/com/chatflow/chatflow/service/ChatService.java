package com.chatflow.chatflow.service;

import com.chatflow.chatflow.dto.ChatMessage;
import com.chatflow.chatflow.exception.ApiException;
import com.chatflow.chatflow.model.Message;
import com.chatflow.chatflow.model.Room;
import com.chatflow.chatflow.model.User;
import com.chatflow.chatflow.repository.MessageRepository;
import com.chatflow.chatflow.repository.RoomRepository;
import com.chatflow.chatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatMessage saveMessage(Long roomId, String email, String content) {
        String text = content == null ? "" : content.trim();
        if (text.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Message cannot be empty");
        }
        if (text.length() > Message.MAX_LENGTH) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Message is too long (max " + Message.MAX_LENGTH + " characters)");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Room not found"));

        Message message = new Message();
        message.setContent(text);
        message.setSender(user);
        message.setRoom(room);
        message.setSentAt(Instant.now());

        return toDto(messageRepository.save(message), roomId);
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getMessageHistory(Long roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Room not found");
        }
        // Repository returns newest first; the UI wants oldest first
        List<Message> latest = new ArrayList<>(messageRepository.findTop100ByRoomIdOrderByIdDesc(roomId));
        Collections.reverse(latest);
        return latest.stream()
                .map(msg -> toDto(msg, roomId))
                .toList();
    }

    private static ChatMessage toDto(Message msg, Long roomId) {
        ChatMessage dto = new ChatMessage();
        dto.setId(msg.getId());
        dto.setContent(msg.getContent());
        dto.setSender(msg.getSender().getUsername());
        dto.setRoomId(roomId);
        dto.setSentAt(msg.getSentAt().toString());
        return dto;
    }
}
