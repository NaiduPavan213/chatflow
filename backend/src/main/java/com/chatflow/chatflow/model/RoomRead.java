package com.chatflow.chatflow.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** The newest message a user has seen in a room. Messages after it (from others) are unread. */
@Entity
@Table(name = "room_reads", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "room_id"}))
@Getter
@Setter
@NoArgsConstructor
public class RoomRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id")
    private Room room;

    @Column(nullable = false)
    private Long lastReadMessageId;

    public RoomRead(User user, Room room, Long lastReadMessageId) {
        this.user = user;
        this.room = room;
        this.lastReadMessageId = lastReadMessageId;
    }
}
