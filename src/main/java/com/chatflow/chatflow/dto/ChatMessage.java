package com.chatflow.chatflow.dto;

import lombok.Data;

@Data
public class ChatMessage {
    private String content;
    private String sender;
    private Long roomId;
    private String sentAt;
}