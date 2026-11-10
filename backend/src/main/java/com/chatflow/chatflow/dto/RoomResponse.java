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
}
