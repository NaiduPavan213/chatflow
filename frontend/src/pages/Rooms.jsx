import AppShell from '../components/AppShell';

export default function Rooms() {
    return (
        <AppShell>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#80848e' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
                    <div style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                        Select a room
                    </div>
                    <div style={{ fontSize: '14px' }}>
                        Choose a room from the sidebar, or create one with +
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
