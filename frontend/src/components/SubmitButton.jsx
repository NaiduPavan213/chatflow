import { LoaderCircle } from 'lucide-react';

export default function SubmitButton({ loading, loadingText, children }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 disabled:opacity-60"
        >
            {loading && <LoaderCircle className="size-4 animate-spin" />}
            {loading ? loadingText : children}
        </button>
    );
}
