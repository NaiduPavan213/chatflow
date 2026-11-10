import { MessageSquareText } from 'lucide-react';

export default function Logo({ inverted = false }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className={`flex size-9 items-center justify-center rounded-xl shadow-sm ${
                inverted ? 'bg-white/15 text-white ring-1 ring-white/25' : 'bg-gradient-to-br from-brand-500 to-brand-700 text-white'
            }`}>
                <MessageSquareText className="size-5" strokeWidth={2.2} />
            </div>
            <span className={`text-lg font-semibold tracking-tight ${inverted ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                ChatFlow
            </span>
        </div>
    );
}
