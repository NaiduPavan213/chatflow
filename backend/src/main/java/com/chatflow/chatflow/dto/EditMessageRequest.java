package com.chatflow.chatflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EditMessageRequest {
    @NotBlank
    @Size(max = 2000)
    private String content;
}
