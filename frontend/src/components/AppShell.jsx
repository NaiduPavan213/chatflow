import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Hash, LogOut, Menu, Plus, Search, X } from 'lucide-react';
import api, { WS_URL, getErrorMessage } from '../api/axios';
import { useAuth } from '../context/auth';
import Avatar from './Avatar';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const ONLINE = { label: 'Online', ok: true };

function RoomSkeleton() {
    return (
        <div className="space-y-1 px-2" aria-hidden="true">
            {[60, 45, 70, 50].map((w) => (
                <div key={w} className="flex items-center gap-2.5 px-2.5 py-2">
                    <div className="size-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" style={{ width: `${w}%` }} />
                </div>
            ))}
        </div>
    );
}

/**
 * App layout: room sidebar (a slide-out drawer on mobile) plus a main column
 * with a header bar. On /rooms the drawer starts open on mobile so the list is visible.
 */
export default function AppShell({ activeRoomId, header, status = ONLINE, children }) {
    const navigate = useNavigate();
    const { username, token, logout } = useAuth();
    const [rooms, setRooms] = useState(null);
    const [unread, setUnread] = useState({}); // roomId -> unread count
    const [loadError, setLoadError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(!activeRoomId);
    const [query, setQuery] = useState('');
    const [creating, setCreating] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [createError, setCreateError] = useState('');

    useEffect(() => {
        let cancelled = false;
        api.get('/rooms')
            .then((res) => {
                if (cancelled) return;
                setRooms(res.data);
                setUnread(Object.fromEntries(res.data.map((r) => [r.id, r.unreadCount ?? 0])));
            })
            .catch((err) => {
                if (cancelled) return;
                setRooms([]);
                setLoadError(getErrorMessage(err, 'Could not load rooms'));
            });
        return () => { cancelled = true; };
    }, []);

    // Live feed of activity in all rooms: new rooms appear, and badges count up for rooms you're not in
    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            debug: () => {},
            onConnect: () => {
                client.subscribe('/topic/rooms/activity', (frame) => {
                    const event = JSON.parse(frame.body);
                    if (event.type === 'room') {
                        setRooms((prev) => (prev && !prev.some((r) => r.id === event.room.id) ? [...prev, event.room] : prev));
                    } else if (event.type === 'message' && event.sender !== username) {
                        setUnread((prev) => ({ ...prev, [event.roomId]: (prev[event.roomId] ?? 0) + 1 }));
                    }
                });
            },
        });
        client.activate();
        return () => { client.deactivate(); };
    }, [token, username]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const activeId = activeRoomId ? Number(activeRoomId) : null;
    const filtered = (rooms ?? []).filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));
    // The room you're looking at is never "unread"
    const unreadFor = (room) => (room.id === activeId ? 0 : unread[room.id] ?? 0);
    const totalUnread = (rooms ?? []).reduce((sum, room) => sum + unreadFor(room), 0);

    useEffect(() => {
        document.title = totalUnread > 0 ? `(${totalUnread > 99 ? '99+' : totalUnread}) ChatFlow` : 'ChatFlow';
    }, [totalUnread]);

    const openRoom = (id) => {
        setDrawerOpen(false);
        navigate(`/chat/${id}`);
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        const name = roomName.trim();
        if (!name) return;
        setCreateError('');
        try {
            const res = await api.post('/rooms', { name });
            setRooms((prev) => [...(prev ?? []), res.data]);
            setRoomName('');
            setCreating(false);
            openRoom(res.data.id);
        } catch (err) {
            setCreateError(getErrorMessage(err, 'Failed to create room'));
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebar = (
        <div className="flex h-full flex-col bg-white dark:bg-zinc-900">
            {/* Brand */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
                <button type="button" onClick={() => { setDrawerOpen(false); navigate('/rooms'); }} aria-label="All rooms">
                    <Logo />
                </button>
                <div className="flex items-center">
                    <ThemeToggle />
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(false)}
                        aria-label="Close menu"
                        className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden dark:hover:bg-zinc-800"
                    >
                        <X className="size-5" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-3 pt-4">
                <label className="relative block">
                    <span className="sr-only">Search rooms</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search rooms"
                        className="w-full rounded-lg border border-transparent bg-zinc-100 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-500 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15 dark:bg-zinc-800 dark:focus:bg-zinc-900"
                    />
                </label>
            </div>

            {/* Rooms */}
            <div className="flex items-center justify-between px-5 pb-1 pt-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Rooms {rooms && <span className="font-normal normal-case tracking-normal">· {rooms.length}</span>}
                </span>
                <button
                    type="button"
                    onClick={() => { setCreating(!creating); setCreateError(''); }}
                    title="Create room"
                    aria-label="Create room"
                    className="inline-flex size-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                    <Plus className="size-4" />
                </button>
            </div>

            {creating && (
                <form onSubmit={handleCreateRoom} className="px-3 pb-2">
                    <div className="flex items-center gap-2 rounded-lg border border-brand-500 bg-white px-2.5 ring-4 ring-brand-500/15 dark:bg-zinc-900">
                        <Hash className="size-4 shrink-0 text-zinc-400" />
                        <input
                            autoFocus
                            value={roomName}
                            onChange={(e) => { setRoomName(e.target.value); setCreateError(''); }}
                            placeholder="new-room-name"
                            maxLength={50}
                            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
                        />
                        <button type="submit" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                            Create
                        </button>
                    </div>
                    {createError && <p className="mt-1.5 px-1 text-xs text-red-600 dark:text-red-400">{createError}</p>}
                </form>
            )}

            <nav className="scrollbar-thin flex-1 overflow-y-auto pb-3">
                {rooms === null && <RoomSkeleton />}
                {loadError && <p className="px-5 py-2 text-sm text-red-600 dark:text-red-400">{loadError}</p>}
                {rooms !== null && !loadError && filtered.length === 0 && (
                    <p className="px-5 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                        {rooms.length === 0 ? 'No rooms yet. Create the first one with +' : 'No rooms match your search.'}
                    </p>
                )}
                <ul className="space-y-0.5 px-2">
                    {filtered.map((room) => {
                        const active = room.id === activeId;
                        const count = unreadFor(room);
                        return (
                            <li key={room.id}>
                                <button
                                    type="button"
                                    onClick={() => openRoom(room.id)}
                                    aria-current={active ? 'page' : undefined}
                                    aria-label={count > 0 ? `${room.name}, ${count} unread` : room.name}
                                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                                        active
                                            ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                                            : count > 0
                                                ? 'font-semibold text-zinc-900 hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-800'
                                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                                    }`}
                                >
                                    <Hash className={`size-4 shrink-0 ${active || count > 0 ? '' : 'text-zinc-400 dark:text-zinc-500'}`} />
                                    <span className="truncate">{room.name}</span>
                                    {count > 0 && (
                                        <span className="ml-auto min-w-5 shrink-0 rounded-full bg-brand-600 px-1.5 text-center text-[11px] font-semibold leading-5 text-white">
                                            {count > 99 ? '99+' : count}
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User */}
            <div className="flex items-center gap-3 border-t border-zinc-200 p-3 dark:border-zinc-800">
                <div className="relative">
                    <Avatar name={username} />
                    <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white dark:ring-zinc-900 ${status.ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{username}</p>
                    <p className={`text-xs ${status.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{status.label}</p>
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    title="Log out"
                    aria-label="Log out"
                    className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                >
                    <LogOut className="size-[18px]" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-dvh overflow-hidden">
            {/* Desktop sidebar */}
            <aside className="hidden w-72 shrink-0 border-r border-zinc-200 lg:block dark:border-zinc-800">{sidebar}</aside>

            {/* Mobile drawer */}
            <div className={`fixed inset-0 z-40 lg:hidden ${drawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!drawerOpen}>
                <div
                    onClick={() => setDrawerOpen(false)}
                    className={`absolute inset-0 bg-zinc-950/50 backdrop-blur-sm transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
                />
                <aside className={`absolute inset-y-0 left-0 w-[85%] max-w-xs shadow-xl transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {sidebar}
                </aside>
            </div>

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white/80 px-3 backdrop-blur sm:px-5 dark:border-zinc-800 dark:bg-zinc-900/80">
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        aria-label={totalUnread > 0 ? `Open menu, ${totalUnread} unread` : 'Open menu'}
                        className="relative inline-flex size-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        <Menu className="size-5" />
                        {totalUnread > 0 && (
                            <span className="absolute right-1 top-1 size-2.5 rounded-full bg-brand-500 ring-2 ring-white dark:ring-zinc-900" />
                        )}
                    </button>
                    <div className="min-w-0 flex-1">{header}</div>
                </header>
                {children}
            </div>
        </div>
    );
}
