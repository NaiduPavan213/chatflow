import { CircleAlert, X } from 'lucide-react';

export default function Alert({ children, onClose }) {
    return (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <span className="flex-1">{children}</span>
            {onClose && (
                <button type="button" onClick={onClose} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}
