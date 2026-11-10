import { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import api, { WS_URL, getErrorMessage } from '../api/axios';
import { useAuth } from '../context/auth';
import AppShell from '../components/AppShell';

const MAX_LENGTH = 2000;
const COLORS = ['#e67e22', '#e74c3c', '#9b59b6', '#1abc9c', '#3498db', '#e91e63', '#ff5722'];

function getColor(name = '') {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return COLORS[hash % COLORS.length];
}

function formatTime(sentAt) {
    if (!sentAt) return '';
    return new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Union of two message lists, de-duplicated by id and ordered oldest first. */
function mergeMessages(a, b) {
    const byId = new Map();
    for (const m of [...a, ...b]) byId.set(m.id, m);
    return [...byId.values()].sort((x, y) => x.id - y.id);
}

export default function ChatRoom({ roomId }) {
    const { token, username } = useAuth();
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [roomName, setRoomName] = useState('');
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState('');
    const clientRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const loadHistory = () =>
            api.get(`/rooms/${roomId}/messages`)
                .then((res) => { if (!cancelled) setMessages((prev) => mergeMessages(prev, res.data)); })
                .catch((err) => { if (!cancelled) setError(getErrorMessage(err, 'Could not load messages')); });

        api.get(`/rooms/${roomId}`)
            .then((res) => { if (!cancelled) setRoomName(res.data.name); })
            .catch((err) => { if (!cancelled) setError(getErrorMessage(err, 'Room not found')); });

        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            debug: () => {},
            onConnect: () => {
                setConnected(true);
                client.subscribe(`/topic/room/${roomId}`, (frame) => {
                    const msg = JSON.parse(frame.body);
                    setMessages((prev) => mergeMessages(prev, [msg]));
                });
                client.subscribe('/user/queue/errors', (frame) => {
                    setError(JSON.parse(frame.body).message);
                });
                // Initial load, and catch up on anything missed while disconnected
                loadHistory();
            },
            onStompError: (frame) => {
                setConnected(false);
                setError(frame.headers.message || 'Chat connection error');
            },
            onWebSocketClose: () => setConnected(false),
        });
        client.activate();
        clientRef.current = client;

        return () => {
            cancelled = true;
            client.deactivate();
        };
    }, [roomId, token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        const text = content.trim();
        if (!text || !connected) return;
        clientRef.current.publish({
            destination: `/app/chat/${roomId}`,
            body: JSON.stringify({ content: text }),
        });
        setContent('');
        setError('');
    };

    return (
        <AppShell
            activeRoomId={roomId}
            status={connected ? { label: 'Online', ok: true } : { label: 'Connecting…', ok: false }}
        >
            {/* Header */}
            <div style={{
                padding: '12px 20px', borderBottom: '0.5px solid #1e1f22',
                display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0
            }}>
                <span style={{ color: '#80848e', fontSize: '24px', fontWeight: '300' }}>#</span>
                <span style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>{roomName}</span>
                <div style={{ width: '1px', height: '20px', background: '#3f4147', margin: '0 8px' }} />
                <span style={{ color: '#80848e', fontSize: '13px' }}>{messages.length} messages</span>
            </div>

            {/* Messages. The spacer pushes short conversations to the bottom without
                breaking scroll-up the way justify-content: flex-end does. */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginTop: 'auto' }} />
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#80848e', marginBottom: '80px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>#</div>
                        <div style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                            Welcome to #{roomName}!
                        </div>
                        <div style={{ fontSize: '14px' }}>This is the start of the channel.</div>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    const isMe = msg.sender === username;
                    const isGrouped = idx > 0 && messages[idx - 1].sender === msg.sender;
                    return (
                        <div
                            key={msg.id}
                            style={{
                                display: 'flex',
                                flexDirection: isMe ? 'row-reverse' : 'row',
                                gap: '12px',
                                padding: '4px 0',
                                alignItems: 'flex-end',
                            }}
                        >
                            {/* Avatar only on the first message of a group */}
                            {!isGrouped ? (
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '50%',
                                    background: getColor(msg.sender),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: '15px', fontWeight: '600', flexShrink: 0
                                }}>
                                    {msg.sender?.charAt(0).toUpperCase()}
                                </div>
                            ) : (
                                <div style={{ width: '38px', flexShrink: 0 }} />
                            )}

                            <div style={{ maxWidth: '60%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                {!isGrouped && (
                                    <div style={{
                                        display: 'flex', gap: '8px', marginBottom: '4px',
                                        flexDirection: isMe ? 'row-reverse' : 'row',
                                        alignItems: 'baseline'
                                    }}>
                                        <span style={{ color: isMe ? '#5865f2' : 'white', fontSize: '13px', fontWeight: '600' }}>
                                            {isMe ? 'You' : msg.sender}
                                        </span>
                                        <span style={{ color: '#80848e', fontSize: '11px' }}>{formatTime(msg.sentAt)}</span>
                                    </div>
                                )}
                                <div style={{
                                    background: isMe ? '#5865f2' : '#383a40',
                                    color: 'white',
                                    padding: '10px 14px',
                                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    fontSize: '15px',
                                    lineHeight: '1.4',
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} style={{ height: '20px', flexShrink: 0 }} />
            </div>

            {/* Input */}
            <div style={{ padding: '0 16px 20px', flexShrink: 0 }}>
                {error && (
                    <div style={{
                        color: '#f04747', fontSize: '13px', padding: '0 4px 8px',
                        display: 'flex', justifyContent: 'space-between', gap: '8px'
                    }}>
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => setError('')}
                            style={{ color: '#80848e', background: 'none', border: 'none', cursor: 'pointer' }}
                        >✕</button>
                    </div>
                )}
                <form onSubmit={handleSend}>
                    <div style={{
                        background: '#383a40', borderRadius: '10px',
                        padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                        <input
                            type="text"
                            placeholder={connected ? `Message #${roomName}` : 'Connecting to chat…'}
                            value={content}
                            maxLength={MAX_LENGTH}
                            onChange={(e) => setContent(e.target.value)}
                            style={{
                                flex: 1, background: 'transparent', border: 'none',
                                color: 'white', fontSize: '16px', outline: 'none',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!connected || !content.trim()}
                            style={{
                                background: connected ? '#5865f2' : '#4e505880',
                                border: 'none', borderRadius: '6px',
                                padding: '6px 14px', color: 'white',
                                fontSize: '14px', cursor: connected ? 'pointer' : 'not-allowed',
                                fontWeight: '500'
                            }}
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </AppShell>
    );
}
