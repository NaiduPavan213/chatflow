import { useEffect, useId } from 'react';
import { LoaderCircle } from 'lucide-react';

/** Small modal asking the user to confirm a destructive action. Escape or the backdrop cancels. */
export default function ConfirmDialog({ title, description, preview, confirmLabel, busy, onConfirm, onCancel }) {
    const titleId = useId();

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onCancel]);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                <h2 id={titleId} className="text-base font-semibold">{title}</h2>
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
                {preview && (
                    <p className="mt-4 line-clamp-3 whitespace-pre-wrap break-words rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {preview}
                    </p>
                )}
                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        autoFocus
                        onClick={onCancel}
                        className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                        {busy && <LoaderCircle className="size-4 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
