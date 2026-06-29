package com.chatflow.chatflow.service;

import com.chatflow.chatflow.dto.RoomRequest;
import com.chatflow.chatflow.dto.RoomResponse;
import com.chatflow.chatflow.model.Room;
import com.chatflow.chatflow.model.User;
import com.chatflow.chatflow.repository.RoomRepository;
import com.chatflow.chatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public RoomResponse createRoom(RoomRequest request, String email) {
        if (roomRepository.existsByName(request.getName())) {
            throw new RuntimeException("Room already exists");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Room room = new Room();
        room.setName(request.getName());
        room.setCreatedBy(user);

        Room saved = roomRepository.save(room);
        return toResponse(saved);
    }

    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public RoomResponse getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        return toResponse(room);
    }

    private RoomResponse toResponse(Room room) {
        return new RoomResponse(
                room.getId(),
                room.getName(),
                room.getCreatedBy().getUsername(),
                room.getCreatedAt()
        );
    }
}