import { useId } from 'react';

/** Labeled text input with an optional hint line. Extra props go to the <input>. */
export default function FormField({ label, hint, ...inputProps }) {
    const id = useId();
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {label}
            </label>
            <input
                id={id}
                {...inputProps}
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-brand-400"
            />
            {hint && <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
        </div>
    );
}
