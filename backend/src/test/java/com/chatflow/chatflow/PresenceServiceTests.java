package com.chatflow.chatflow;

import com.chatflow.chatflow.repository.UserRepository;
import com.chatflow.chatflow.service.PresenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class PresenceServiceTests {

    private PresenceService presence;

    @BeforeEach
    void setUp() {
        presence = new PresenceService(mock(UserRepository.class));
    }

    @Test
    void tracksUsersPerRoomAndIgnoresOtherDestinations() {
        assertThat(presence.subscribe("s1", "sub-0", "/topic/room/1", "bob")).contains(1L);
        assertThat(presence.subscribe("s2", "sub-0", "/topic/room/1", "alice")).contains(1L);
        assertThat(presence.subscribe("s3", "sub-0", "/topic/room/2", "carol")).contains(2L);
        // Presence/typing topics and user queues are not room memberships
        assertThat(presence.subscribe("s1", "sub-1", "/topic/room/1/typing", "bob")).isEmpty();
        assertThat(presence.subscribe("s1", "sub-2", "/user/queue/errors", "bob")).isEmpty();

        assertThat(presence.onlineIn(1)).containsExactly("alice", "bob");
        assertThat(presence.onlineIn(2)).containsExactly("carol");
        assertThat(presence.onlineIn(3)).isEmpty();
    }

    @Test
    void sameUserInTwoTabsIsListedOnceUntilBothLeave() {
        presence.subscribe("tab1", "sub-0", "/topic/room/1", "alice");
        presence.subscribe("tab2", "sub-0", "/topic/room/1", "alice");
        assertThat(presence.onlineIn(1)).containsExactly("alice");

        assertThat(presence.disconnect("tab1")).containsExactly(1L);
        assertThat(presence.onlineIn(1)).containsExactly("alice");

        presence.disconnect("tab2");
        assertThat(presence.onlineIn(1)).isEmpty();
    }

    @Test
    void unsubscribeAndDisconnectReportAffectedRooms() {
        presence.subscribe("s1", "sub-0", "/topic/room/1", "bob");
        presence.subscribe("s1", "sub-1", "/topic/room/2", "bob");

        assertThat(presence.unsubscribe("s1", "sub-0")).isEqualTo(Optional.of(1L));
        assertThat(presence.onlineIn(1)).isEmpty();
        assertThat(presence.onlineIn(2)).containsExactly("bob");

        assertThat(presence.unsubscribe("s1", "unknown")).isEmpty();
        assertThat(presence.disconnect("s1")).isEqualTo(Set.of(2L));
        assertThat(presence.disconnect("s1")).isEmpty();
        assertThat(presence.onlineIn(2)).isEqualTo(List.of());
    }
}
