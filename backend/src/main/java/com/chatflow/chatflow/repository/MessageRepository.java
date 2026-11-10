package com.chatflow.chatflow.repository;

import com.chatflow.chatflow.model.Message;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Latest 100 messages, newest first, with senders loaded in the same query (no N+1). */
    @EntityGraph(attributePaths = "sender")
    List<Message> findTop100ByRoomIdOrderByIdDesc(Long roomId);

    /** A message only if it belongs to the given room, with its sender loaded. */
    @EntityGraph(attributePaths = "sender")
    Optional<Message> findByIdAndRoomId(Long id, Long roomId);
}
