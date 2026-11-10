import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth, isTokenExpired } from './context/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Rooms from './pages/Rooms';
import ChatRoom from './pages/ChatRoom';

function isLoggedIn(token) {
    return Boolean(token) && !isTokenExpired(token);
}

function ProtectedRoute({ children }) {
    const { token } = useAuth();
    return isLoggedIn(token) ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
    const { token } = useAuth();
    return isLoggedIn(token) ? <Navigate to="/rooms" replace /> : children;
}

/** Remount the chat when the room changes so each room starts with a clean state and socket. */
function ChatRoomRoute() {
    const { roomId } = useParams();
    return <ChatRoom key={roomId} roomId={roomId} />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
            <Route path="/chat/:roomId" element={<ProtectedRoute><ChatRoomRoute /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/rooms" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
