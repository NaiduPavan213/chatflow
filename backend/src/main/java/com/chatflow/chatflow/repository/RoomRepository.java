package com.chatflow.chatflow.repository;

import com.chatflow.chatflow.model.Room;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    boolean existsByNameIgnoreCase(String name);

    @Override
    @EntityGraph(attributePaths = "createdBy")
    List<Room> findAll(Sort sort);

    @Override
    @EntityGraph(attributePaths = "createdBy")
    Optional<Room> findById(Long id);
}
