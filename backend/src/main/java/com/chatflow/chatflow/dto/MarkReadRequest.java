package com.chatflow.chatflow.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class MarkReadRequest {
    /** Id of the newest message the user has now seen in the room. */
    @NotNull
    @Positive
    private Long lastMessageId;
}
