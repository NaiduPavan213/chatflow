package com.chatflow.chatflow.service;

import com.chatflow.chatflow.dto.RoomRequest;
import com.chatflow.chatflow.dto.RoomResponse;
import com.chatflow.chatflow.exception.ApiException;
import com.chatflow.chatflow.model.Room;
import com.chatflow.chatflow.model.User;
import com.chatflow.chatflow.repository.RoomRepository;
import com.chatflow.chatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    @Transactional
    public RoomResponse createRoom(RoomRequest request, String email) {
        String name = request.getName().trim();
        if (roomRepository.existsByNameIgnoreCase(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "Room already exists");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));

        Room room = new Room();
        room.setName(name);
        room.setCreatedBy(user);
        return toResponse(roomRepository.save(room));
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll(Sort.by("id"))
                .stream()
                .map(RoomService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomById(Long id) {
        return roomRepository.findById(id)
                .map(RoomService::toResponse)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Room not found"));
    }

    private static RoomResponse toResponse(Room room) {
        return new RoomResponse(
                room.getId(),
                room.getName(),
                room.getCreatedBy().getUsername(),
                room.getCreatedAt()
        );
    }
}
