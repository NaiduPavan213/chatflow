package com.chatflow.chatflow.dto;

import lombok.Data;

@Data
public class ChatMessage {
    private Long id;
    private String content;
    /** Username of the sender (set by the server; ignored if a client sends it). */
    private String sender;
    private Long roomId;
    /** ISO-8601 UTC timestamp, e.g. 2026-11-10T09:30:00Z */
    private String sentAt;
}
