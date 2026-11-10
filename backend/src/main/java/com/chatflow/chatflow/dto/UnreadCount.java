package com.chatflow.chatflow.dto;

/** Number of unread messages in one room, as returned by MessageRepository.countUnreadByRoom. */
public record UnreadCount(Long roomId, Long count) {
}
