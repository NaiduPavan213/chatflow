import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/auth';

const ONLINE = { label: 'Online', ok: true };

function RoomRow({ room, active, onClick }) {
    const [hover, setHover] = useState(false);
    const highlighted = active || hover;
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                padding: '8px 10px', borderRadius: '4px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '16px', transition: 'background 0.1s',
                background: active ? '#404249' : hover ? '#35373c' : 'transparent',
                color: highlighted ? (active ? 'white' : '#dcddde') : '#80848e',
            }}
        >
            <span style={{ fontSize: '18px', fontWeight: '300' }}>#</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</span>
        </div>
    );
}

/**
 * Shared layout for the rooms list and chat pages: server rail, room sidebar
 * (with "create room"), user footer with connection status and logout.
 */
export default function AppShell({ activeRoomId, status = ONLINE, children }) {
    const navigate = useNavigate();
    const { username, logout } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [showInput, setShowInput] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [createError, setCreateError] = useState('');

    useEffect(() => {
        let cancelled = false;
        api.get('/rooms')
            .then((res) => { if (!cancelled) setRooms(res.data); })
            .catch((err) => { if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load rooms')); });
        return () => { cancelled = true; };
    }, []);

    const activeId = activeRoomId ? Number(activeRoomId) : null;

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        const name = roomName.trim();
        if (!name) return;
        setCreateError('');
        try {
            const res = await api.post('/rooms', { name });
            setRooms((prev) => [...prev, res.data]);
            setRoomName('');
            setShowInput(false);
            navigate(`/chat/${res.data.id}`);
        } catch (err) {
            setCreateError(getErrorMessage(err, 'Failed to create room'));
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initial = username?.charAt(0).toUpperCase();

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif' }}>

            {/* Server rail */}
            <div style={{
                width: '72px', background: '#1e1f22',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '12px 0', gap: '8px', flexShrink: 0
            }}>
                <div
                    onClick={() => navigate('/rooms')}
                    title="All rooms"
                    style={{
                        width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer',
                        background: '#5865f2', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: '600'
                    }}
                >C</div>
                <div style={{ width: '32px', height: '1px', background: '#3f4147', margin: '4px 0' }} />
                {rooms.slice(0, 4).map((room) => {
                    const active = room.id === activeId;
                    return (
                        <div
                            key={room.id}
                            onClick={() => navigate(`/chat/${room.id}`)}
                            title={room.name}
                            style={{
                                width: '48px', height: '48px',
                                borderRadius: active ? '16px' : '50%',
                                background: active ? '#5865f2' : '#2b2d31',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: active ? 'white' : '#80848e',
                                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            #{room.name.slice(0, 2)}
                        </div>
                    );
                })}
                <div style={{ marginTop: 'auto' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: '#23a55a', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white', fontSize: '16px', fontWeight: '600'
                    }}>{initial}</div>
                </div>
            </div>

            {/* Room sidebar */}
            <div style={{ width: '280px', background: '#2b2d31', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '16px', borderBottom: '0.5px solid #1e1f22' }}>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>💬 ChatFlow</div>
                    <div style={{ color: '#80848e', fontSize: '12px', marginTop: '2px' }}>{rooms.length} rooms</div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                    <div style={{
                        color: '#80848e', fontSize: '11px', fontWeight: '600',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        padding: '8px 10px 4px', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        Text Rooms
                        <button
                            type="button"
                            onClick={() => { setShowInput(!showInput); setCreateError(''); }}
                            title="Add room"
                            style={{ fontSize: '18px', cursor: 'pointer', color: '#80848e', background: 'none', border: 'none', padding: 0 }}
                        >+</button>
                    </div>

                    {showInput && (
                        <form onSubmit={handleCreateRoom} style={{ padding: '4px 8px', marginBottom: '4px' }}>
                            <input
                                autoFocus
                                type="text"
                                placeholder="room-name"
                                maxLength={50}
                                value={roomName}
                                onChange={(e) => { setRoomName(e.target.value); setCreateError(''); }}
                                style={{
                                    width: '100%', background: '#1e1f22', border: '1px solid #5865f2',
                                    borderRadius: '4px', padding: '6px 10px', color: 'white',
                                    fontSize: '13px', outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                            {createError && <p style={{ color: '#f04747', fontSize: '11px', margin: '4px 0 0' }}>{createError}</p>}
                        </form>
                    )}

                    {loadError && <p style={{ color: '#f04747', fontSize: '12px', padding: '4px 10px' }}>{loadError}</p>}

                    {rooms.map((room) => (
                        <RoomRow
                            key={room.id}
                            room={room}
                            active={room.id === activeId}
                            onClick={() => navigate(`/chat/${room.id}`)}
                        />
                    ))}
                </div>

                {/* User footer */}
                <div style={{ background: '#232428', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: '#5865f2', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: '600'
                        }}>{initial}</div>
                        <div style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: status.ok ? '#23a55a' : '#f0b232', border: '2px solid #232428'
                        }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            color: 'white', fontSize: '14px', fontWeight: '500',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{username}</div>
                        <div style={{ color: status.ok ? '#23a55a' : '#f0b232', fontSize: '11px' }}>{status.label}</div>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Log out"
                        style={{ color: '#80848e', fontSize: '18px', cursor: 'pointer', background: 'none', border: 'none' }}
                    >⏻</button>
                </div>
            </div>

            {/* Main area */}
            <div style={{ flex: 1, background: '#313338', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {children}
            </div>
        </div>
    );
}
