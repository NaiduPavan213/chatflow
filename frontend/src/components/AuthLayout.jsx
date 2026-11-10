import { Lock, MessagesSquare, Zap } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const FEATURES = [
    { icon: Zap, title: 'Real-time', text: 'Messages appear instantly for everyone in the room.' },
    { icon: MessagesSquare, title: 'Rooms for every topic', text: 'Create a room in one click and invite anyone.' },
    { icon: Lock, title: 'Secure by default', text: 'Every connection is authenticated with your account.' },
];

/** Two-column layout for login/register: brand panel on desktop, form card everywhere. */
export default function AuthLayout({ title, subtitle, children, footer }) {
    return (
        <div className="flex min-h-dvh">
            {/* Brand panel (desktop only) */}
            <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 text-white lg:flex">
                <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-brand-300/20 blur-3xl" />

                <Logo inverted />

                <div className="relative">
                    <h2 className="text-4xl font-semibold leading-tight tracking-tight">
                        Conversations that keep flowing.
                    </h2>
                    <p className="mt-4 max-w-sm text-brand-100">
                        Join a room, say hello, and chat with everyone in real time.
                    </p>
                    <ul className="mt-10 space-y-6">
                        {FEATURES.map(({ icon: Icon, title: featureTitle, text }) => (
                            <li key={featureTitle} className="flex gap-4">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                                    <Icon className="size-5" />
                                </div>
                                <div>
                                    <p className="font-medium">{featureTitle}</p>
                                    <p className="text-sm text-brand-100">{text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-sm text-brand-200">Built with Spring Boot, WebSocket and React.</p>
            </aside>

            {/* Form side */}
            <main className="flex flex-1 flex-col px-4 py-6 sm:px-8">
                <div className="flex items-center justify-between">
                    <div className="lg:invisible"><Logo /></div>
                    <ThemeToggle />
                </div>

                <div className="flex flex-1 items-center justify-center py-10">
                    <div className="w-full max-w-sm">
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
                        <div className="mt-8">{children}</div>
                        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">{footer}</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
