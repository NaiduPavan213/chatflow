package com.chatflow.chatflow.repository;

import com.chatflow.chatflow.model.RoomRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface RoomReadRepository extends JpaRepository<RoomRead, Long> {

    List<RoomRead> findByUserId(Long userId);

    boolean existsByUserIdAndRoomId(Long userId, Long roomId);

    /** Moves the read marker forward only (never backwards). Returns the number of rows changed. */
    @Modifying
    @Transactional
    @Query("""
            update RoomRead r set r.lastReadMessageId = :messageId
            where r.user.id = :userId and r.room.id = :roomId and r.lastReadMessageId < :messageId
            """)
    int advance(@Param("userId") Long userId, @Param("roomId") Long roomId, @Param("messageId") Long messageId);
}
