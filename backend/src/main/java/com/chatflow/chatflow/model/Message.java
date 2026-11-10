package com.chatflow.chatflow.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "messages", indexes = @Index(name = "idx_messages_room_id", columnList = "room_id, id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    public static final int MAX_LENGTH = 2000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = MAX_LENGTH)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @Builder.Default
    private Instant sentAt = Instant.now();

    /** When the sender last edited the message (null if never edited). */
    private Instant editedAt;

    /** When the sender deleted the message (null if not deleted). Content is cleared on delete. */
    private Instant deletedAt;
}
