package com.chatflow.chatflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RoomRequest {
    @NotBlank
    @Size(max = 50)
    private String name;
}
