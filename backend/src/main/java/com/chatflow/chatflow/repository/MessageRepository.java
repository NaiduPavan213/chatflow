package com.chatflow.chatflow.repository;

import com.chatflow.chatflow.dto.UnreadCount;
import com.chatflow.chatflow.model.Message;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Latest 100 messages, newest first, with senders loaded in the same query (no N+1). */
    @EntityGraph(attributePaths = "sender")
    List<Message> findTop100ByRoomIdOrderByIdDesc(Long roomId);

    /** A message only if it belongs to the given room, with its sender loaded. */
    @EntityGraph(attributePaths = "sender")
    Optional<Message> findByIdAndRoomId(Long id, Long roomId);

    @Query("select max(m.id) from Message m where m.room.id = :roomId")
    Long findMaxIdByRoomId(@Param("roomId") Long roomId);

    /**
     * Unread messages per room for one user, in a single query: messages from other people,
     * not deleted, newer than the user's read marker (or all of them if the user never opened the room).
     * Rooms with nothing unread are left out.
     */
    @Query("""
            select new com.chatflow.chatflow.dto.UnreadCount(m.room.id, count(m))
            from Message m
            left join RoomRead r on r.room = m.room and r.user.id = :userId
            where m.sender.id <> :userId
              and m.deletedAt is null
              and (r.id is null or m.id > r.lastReadMessageId)
            group by m.room.id
            """)
    List<UnreadCount> countUnreadByRoom(@Param("userId") Long userId);
}
