import { X } from 'lucide-react';
import Avatar from './Avatar';

/**
 * People currently in the room. A side column on wide screens, a slide-over on smaller ones.
 */
export default function MembersPanel({ online, me, typingNames, onClose }) {
    return (
        <>
            <div onClick={onClose} className="fixed inset-0 z-30 bg-zinc-950/40 backdrop-blur-sm xl:hidden" aria-hidden="true" />
            <aside
                aria-label="People in this room"
                className="fixed inset-y-0 right-0 z-40 flex w-72 max-w-[85%] flex-col border-l border-zinc-200 bg-white shadow-xl xl:static xl:z-auto xl:w-64 xl:max-w-none xl:shadow-none dark:border-zinc-800 dark:bg-zinc-900"
            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-4 xl:h-14 dark:border-zinc-800">
                    <h2 className="text-sm font-semibold">
                        Online <span className="font-normal text-zinc-500 dark:text-zinc-400">· {online.length}</span>
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close people list"
                        className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <ul className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto p-2">
                    {online.map((name) => {
                        const isTyping = typingNames.includes(name);
                        return (
                            <li key={name} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                                <div className="relative">
                                    <Avatar name={name} size="sm" />
                                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {name}
                                        {name === me && <span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">(you)</span>}
                                    </p>
                                    {isTyping && <p className="text-xs text-brand-600 dark:text-brand-400">typing…</p>}
                                </div>
                            </li>
                        );
                    })}
                    {online.length <= 1 && (
                        <li className="px-2 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                            Nobody else is here right now. Share the room to invite people.
                        </li>
                    )}
                </ul>
            </aside>
        </>
    );
}
