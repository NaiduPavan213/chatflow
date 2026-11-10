package com.chatflow.chatflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class RoomResponse {
    private Long id;
    private String name;
    private String createdBy;
    private Instant createdAt;
    /** Messages from others the current user hasn't seen yet. */
    private long unreadCount;
    /** Newest message id the current user has seen here, or null if they never opened the room. */
    private Long lastReadMessageId;
}
