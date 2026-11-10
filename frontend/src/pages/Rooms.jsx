import { MessagesSquare } from 'lucide-react';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/auth';

export default function Rooms() {
    const { username } = useAuth();
    return (
        <AppShell header={<h1 className="text-base font-semibold">Rooms</h1>}>
            <div className="flex flex-1 items-center justify-center p-6">
                <div className="max-w-sm text-center">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                        <MessagesSquare className="size-8" />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold tracking-tight">Hi {username}, pick a room</h2>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                        Choose a room from the list to start chatting, or create a new one with the + button.
                    </p>
                </div>
            </div>
        </AppShell>
    );
}
