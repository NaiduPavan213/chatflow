package com.chatflow.chatflow;

import com.chatflow.chatflow.dto.ChatMessage;
import com.chatflow.chatflow.service.ChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MessageEditTests {

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

    @Test
    void ownerCanEditAndDeleteOthersCannot() throws Exception {
        String dave = register("dave");
        String erin = register("erin");
        long roomId = createRoom(dave, "edits");
        ChatMessage msg = chatService.saveMessage(roomId, "dave@example.com", "helo");
        String url = "/api/rooms/" + roomId + "/messages/" + msg.getId();

        // Someone else can't edit or delete it
        mvc.perform(patch(url).header("Authorization", erin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"hacked\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You can only change your own messages"));
        mvc.perform(delete(url).header("Authorization", erin)).andExpect(status().isForbidden());

        // Blank edits are rejected
        mvc.perform(patch(url).header("Authorization", dave)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"  \"}"))
                .andExpect(status().isBadRequest());

        // Owner edits
        mvc.perform(patch(url).header("Authorization", dave)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"hello\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("hello"))
                .andExpect(jsonPath("$.editedAt").isNotEmpty())
                .andExpect(jsonPath("$.deleted").value(false));

        mvc.perform(get("/api/rooms/" + roomId + "/messages").header("Authorization", erin))
                .andExpect(jsonPath("$[0].content").value("hello"))
                .andExpect(jsonPath("$[0].editedAt").isNotEmpty());

        // Owner deletes: stays in history as a placeholder without its text
        mvc.perform(delete(url).header("Authorization", dave))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(true))
                .andExpect(jsonPath("$.content").value(""));

        mvc.perform(get("/api/rooms/" + roomId + "/messages").header("Authorization", erin))
                .andExpect(jsonPath("$[0].deleted").value(true))
                .andExpect(jsonPath("$[0].content").value(""));

        // A deleted message can't be edited
        mvc.perform(patch(url).header("Authorization", dave)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"back\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void messageMustBelongToTheRoomInTheUrl() throws Exception {
        String frank = register("frank");
        long roomA = createRoom(frank, "room-a");
        long roomB = createRoom(frank, "room-b");
        ChatMessage msg = chatService.saveMessage(roomA, "frank@example.com", "in room A");

        mvc.perform(delete("/api/rooms/" + roomB + "/messages/" + msg.getId()).header("Authorization", frank))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Message not found"));
    }
}
