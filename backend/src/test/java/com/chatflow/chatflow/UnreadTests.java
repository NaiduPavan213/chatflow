package com.chatflow.chatflow;

import com.chatflow.chatflow.dto.ChatMessage;
import com.chatflow.chatflow.service.ChatService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UnreadTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper mapper;

    @Autowired
    private ChatService chatService;

    private String register(String username) throws Exception {
        String body = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","email":"%s@example.com","password":"secret123"}
                                """.formatted(username, username)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + mapper.readTree(body).get("token").asText();
    }

    private long createRoom(String auth, String name) throws Exception {
        String body = mvc.perform(post("/api/rooms")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(body).get("id").asLong();
    }

    private JsonNode room(String auth, long roomId) throws Exception {
        String body = mvc.perform(get("/api/rooms/" + roomId).header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(body);
    }

    private void markRead(String auth, long roomId, long messageId) throws Exception {
        mvc.perform(post("/api/rooms/" + roomId + "/read")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lastMessageId\":" + messageId + "}"))
                .andExpect(status().isNoContent());
    }

    @Test
    void countsOthersMessagesAfterTheReadMarker() throws Exception {
        String uma = register("uma");
        String vic = register("vic");
        long roomId = createRoom(uma, "unread-room");

        ChatMessage first = chatService.saveMessage(roomId, "vic@example.com", "one");
        ChatMessage second = chatService.saveMessage(roomId, "vic@example.com", "two");
        chatService.saveMessage(roomId, "vic@example.com", "three");
        chatService.saveMessage(roomId, "uma@example.com", "my own message doesn't count");

        // Never opened: everything from others is unread, own messages are not
        JsonNode before = room(uma, roomId);
        assertThat(before.get("unreadCount").asLong()).isEqualTo(3);
        assertThat(before.get("lastReadMessageId").isNull()).isTrue();

        markRead(uma, roomId, second.getId());
        assertThat(room(uma, roomId).get("unreadCount").asLong()).isEqualTo(1);
        assertThat(room(uma, roomId).get("lastReadMessageId").asLong()).isEqualTo(second.getId());

        // The marker never moves backwards
        markRead(uma, roomId, first.getId());
        assertThat(room(uma, roomId).get("unreadCount").asLong()).isEqualTo(1);

        // A too-large id is clamped to the newest message, so future messages still count
        markRead(uma, roomId, 999_999);
        assertThat(room(uma, roomId).get("unreadCount").asLong()).isZero();
        ChatMessage later = chatService.saveMessage(roomId, "vic@example.com", "four");
        assertThat(room(uma, roomId).get("unreadCount").asLong()).isEqualTo(1);

        // Deleted messages don't count
        chatService.deleteMessage(roomId, later.getId(), "vic@example.com");
        assertThat(room(uma, roomId).get("unreadCount").asLong()).isZero();

        // Counts are per user: vic has read nothing of uma's single message
        mvc.perform(get("/api/rooms").header("Authorization", vic))
                .andExpect(jsonPath("$[?(@.name == 'unread-room')].unreadCount").value(1));
    }

    @Test
    void markReadValidatesInput() throws Exception {
        String wes = register("wes");
        createRoom(wes, "validate-room");

        mvc.perform(post("/api/rooms/999999/read").header("Authorization", wes)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"lastMessageId\":1}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/rooms/1/read").header("Authorization", wes)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"lastMessageId\":0}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/rooms/1/read")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"lastMessageId\":1}"))
                .andExpect(status().isUnauthorized());
    }
}
