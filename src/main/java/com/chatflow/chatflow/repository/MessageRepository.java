package com.chatflow.chatflow.repository;

import com.chatflow.chatflow.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByRoomIdOrderBySentAtAsc(Long roomId);
}