package com.chatflow.chatflow.controller;

import com.chatflow.chatflow.dto.MarkReadRequest;
import com.chatflow.chatflow.dto.RoomRequest;
import com.chatflow.chatflow.dto.RoomResponse;
import com.chatflow.chatflow.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @Valid @RequestBody RoomRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        RoomResponse room = roomService.createRoom(request, userDetails.getUsername());
        // Let every open sidebar show the new room right away
        messagingTemplate.convertAndSend("/topic/rooms/activity", Map.of("type", "room", "room", room));
        return ResponseEntity.ok(room);
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getAllRooms(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(roomService.getAllRooms(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> getRoomById(@PathVariable Long id,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(roomService.getRoomById(id, userDetails.getUsername()));
    }

    /** Marks messages up to lastMessageId as read for the current user. */
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id,
                                         @Valid @RequestBody MarkReadRequest request,
                                         @AuthenticationPrincipal UserDetails userDetails) {
        roomService.markRead(id, userDetails.getUsername(), request.getLastMessageId());
        return ResponseEntity.noContent().build();
    }
}
