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
    /** ISO-8601 UTC timestamp of the last edit, or null. */
    private String editedAt;
    /** True if the sender deleted the message; content is then empty. */
    private boolean deleted;
}
