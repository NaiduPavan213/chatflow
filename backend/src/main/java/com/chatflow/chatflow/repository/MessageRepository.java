package com.chatflow.chatflow.repository;

import com.chatflow.chatflow.model.Message;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Latest 100 messages, newest first, with senders loaded in the same query (no N+1). */
    @EntityGraph(attributePaths = "sender")
    List<Message> findTop100ByRoomIdOrderByIdDesc(Long roomId);
}
