import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { ArrowDown, Hash, LoaderCircle, SendHorizontal, WifiOff } from 'lucide-react';
import api, { WS_URL, getErrorMessage } from '../api/axios';
import { useAuth } from '../context/auth';
import AppShell from '../components/AppShell';
import Avatar from '../components/Avatar';
import Alert from '../components/Alert';

const MAX_LENGTH = 2000;
const GROUP_WINDOW_MS = 5 * 60 * 1000;

/** Union of two message lists, de-duplicated by id and ordered oldest first. */
function mergeMessages(a, b) {
    const byId = new Map();
    for (const m of [...a, ...b]) byId.set(m.id, m);
    return [...byId.values()].sort((x, y) => x.id - y.id);
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function dayLabel(date) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], {
        weekday: 'long', month: 'long', day: 'numeric',
        ...(date.getFullYear() !== today.getFullYear() && { year: 'numeric' }),
    });
}

/** Adds day separators and marks messages that continue the previous sender's group. */
function buildTimeline(messages) {
    const items = [];
    let prev = null;
    for (const msg of messages) {
        const date = new Date(msg.sentAt);
        const newDay = !prev || prev.date.toDateString() !== date.toDateString();
        if (newDay) items.push({ type: 'day', key: `day-${date.toDateString()}`, label: dayLabel(date) });
        const grouped = !newDay && prev.sender === msg.sender && date - prev.date < GROUP_WINDOW_MS;
        items.push({ type: 'message', key: msg.id, msg, date, grouped });
        prev = { sender: msg.sender, date };
    }
    return items;
}

function MessageSkeleton() {
    return (
        <div className="space-y-6 px-4 py-6 sm:px-6" aria-hidden="true">
            {[['w-48', 'w-64'], ['w-56'], ['w-40', 'w-72']].map((lines, i) => (
                <div key={i} className={`flex gap-3 ${i === 1 ? 'flex-row-reverse' : ''}`}>
                    <div className="size-9 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className={`flex flex-col gap-2 ${i === 1 ? 'items-end' : ''}`}>
                        <div className="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                        {lines.map((w) => (
                            <div key={w} className={`h-9 ${w} max-w-[60vw] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800`} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function MessageRow({ item, isMe }) {
    const { msg, date, grouped } = item;
    return (
        <div className={`group flex gap-3 ${isMe ? 'flex-row-reverse' : ''} ${grouped ? 'mt-0.5' : 'mt-4'}`}>
            {grouped ? <div className="w-9 shrink-0" /> : <Avatar name={msg.sender} />}
            <div className={`flex min-w-0 max-w-[80%] flex-col sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                {!grouped && (
                    <div className={`mb-1 flex items-baseline gap-2 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm font-semibold">{isMe ? 'You' : msg.sender}</span>
                        <time dateTime={msg.sentAt} className="text-xs text-zinc-500 dark:text-zinc-400">{formatTime(date)}</time>
                    </div>
                )}
                <div
                    title={formatTime(date)}
                    className={`whitespace-pre-wrap break-words px-3.5 py-2 text-[15px] leading-relaxed shadow-sm ${
                        isMe
                            ? 'rounded-2xl rounded-tr-md bg-brand-600 text-white'
                            : 'rounded-2xl rounded-tl-md bg-white text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700/60'
                    }`}
                >
                    {msg.content}
                </div>
            </div>
        </div>
    );
}

export default function ChatRoom({ roomId }) {
    const { token, username } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [content, setContent] = useState('');
    const [roomName, setRoomName] = useState('');
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState('');
    const [atBottom, setAtBottom] = useState(true);
    const clientRef = useRef(null);
    const scrollRef = useRef(null);
    const stickToBottomRef = useRef(true);
    const textareaRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const loadHistory = () =>
            api.get(`/rooms/${roomId}/messages`)
                .then((res) => { if (!cancelled) setMessages((prev) => mergeMessages(prev, res.data)); })
                .catch((err) => { if (!cancelled) setError(getErrorMessage(err, 'Could not load messages')); })
                .finally(() => { if (!cancelled) setLoaded(true); });

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

    // Follow new messages only when the reader is already at the bottom
    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (el && stickToBottomRef.current) el.scrollTop = el.scrollHeight;
    }, [messages, loaded]);

    const handleScroll = () => {
        const el = scrollRef.current;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        stickToBottomRef.current = nearBottom;
        setAtBottom(nearBottom);
    };

    const scrollToBottom = () => {
        const el = scrollRef.current;
        stickToBottomRef.current = true;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    };

    // Grow the message box with its content, up to a limit
    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [content]);

    const send = () => {
        const text = content.trim();
        if (!text || !connected) return;
        stickToBottomRef.current = true;
        clientRef.current.publish({
            destination: `/app/chat/${roomId}`,
            body: JSON.stringify({ content: text }),
        });
        setContent('');
        setError('');
    };

    const handleKeyDown = (e) => {
        // Enter sends; Shift+Enter adds a new line
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
        }
    };

    const timeline = buildTimeline(messages);
    const remaining = MAX_LENGTH - content.length;

    const header = (
        <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <Hash className="size-[18px]" />
            </div>
            <div className="min-w-0">
                <h1 className="truncate text-base font-semibold leading-tight">{roomName || '…'}</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </p>
            </div>
            {!connected && (
                <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                    <WifiOff className="size-3.5" /> Reconnecting…
                </span>
            )}
        </div>
    );

    return (
        <AppShell
            activeRoomId={roomId}
            header={header}
            status={connected ? { label: 'Online', ok: true } : { label: 'Connecting…', ok: false }}
        >
            <div className="relative flex min-h-0 flex-1 flex-col">
                <div ref={scrollRef} onScroll={handleScroll} className="scrollbar-thin flex-1 overflow-y-auto">
                    {!loaded ? (
                        <MessageSkeleton />
                    ) : (
                        <div className="mx-auto flex min-h-full max-w-4xl flex-col px-4 pb-4 sm:px-6">
                            <div className="mt-auto" />
                            {messages.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                                        <Hash className="size-7" />
                                    </div>
                                    <h2 className="mt-4 text-lg font-semibold">Welcome to #{roomName}</h2>
                                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">This is the very beginning. Say hello!</p>
                                </div>
                            ) : (
                                timeline.map((item) =>
                                    item.type === 'day' ? (
                                        <div key={item.key} className="my-5 flex items-center gap-3" role="separator">
                                            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.label}</span>
                                            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                        </div>
                                    ) : (
                                        <MessageRow key={item.key} item={item} isMe={item.msg.sender === username} />
                                    )
                                )
                            )}
                        </div>
                    )}
                </div>

                {!atBottom && (
                    <button
                        type="button"
                        onClick={scrollToBottom}
                        className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        <ArrowDown className="size-3.5" /> Jump to latest
                    </button>
                )}
            </div>

            {/* Composer */}
            <div className="shrink-0 border-t border-zinc-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto max-w-4xl">
                    {error && <div className="mb-2"><Alert onClose={() => setError('')}>{error}</Alert></div>}
                    <form
                        onSubmit={(e) => { e.preventDefault(); send(); }}
                        className="flex items-end gap-2 rounded-2xl border border-zinc-300 bg-zinc-50 p-1.5 pl-4 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
                    >
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={content}
                            maxLength={MAX_LENGTH}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={connected ? `Message #${roomName}` : 'Connecting to chat…'}
                            aria-label="Message"
                            className="scrollbar-thin max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-6 outline-none placeholder:text-zinc-400"
                        />
                        <button
                            type="submit"
                            disabled={!connected || !content.trim()}
                            aria-label="Send message"
                            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
                        >
                            {connected ? <SendHorizontal className="size-[18px]" /> : <LoaderCircle className="size-[18px] animate-spin" />}
                        </button>
                    </form>
                    <div className="mt-1.5 flex justify-between px-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                        <span className="hidden sm:inline"><kbd className="font-sans font-medium">Enter</kbd> to send · <kbd className="font-sans font-medium">Shift + Enter</kbd> for a new line</span>
                        {remaining <= 200 && (
                            <span className={`ml-auto ${remaining <= 20 ? 'text-red-500' : ''}`}>{remaining} characters left</span>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
