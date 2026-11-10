package com.chatflow.chatflow.dto;

/**
 * "Someone is typing" signal. Clients send {"typing": true|false}; the server fills in the
 * username from the authenticated session before broadcasting, so it cannot be spoofed.
 */
public record TypingEvent(String username, boolean typing) {
}
