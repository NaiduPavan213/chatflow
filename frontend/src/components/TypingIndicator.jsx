function describe(names) {
    if (names.length === 1) return <><strong className="font-semibold">{names[0]}</strong> is typing</>;
    if (names.length === 2) {
        return <><strong className="font-semibold">{names[0]}</strong> and <strong className="font-semibold">{names[1]}</strong> are typing</>;
    }
    return <>Several people are typing</>;
}

/** "alice is typing…" line. Always takes the same height so the layout does not jump. */
export default function TypingIndicator({ names }) {
    return (
        <div className="flex h-6 items-center gap-2 px-1 text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
            {names.length > 0 && (
                <>
                    <span className="flex gap-0.5" aria-hidden="true">
                        {[0, 150, 300].map((delay) => (
                            <span
                                key={delay}
                                className="size-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500"
                                style={{ animationDelay: `${delay}ms` }}
                            />
                        ))}
                    </span>
                    <span>{describe(names)}…</span>
                </>
            )}
        </div>
    );
}
