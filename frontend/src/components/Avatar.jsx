const COLORS = [
    'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500',
    'bg-sky-500', 'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500',
];

function colorFor(name = '') {
    let hash = 5381;
    for (let i = 0; i < name.length; i++) hash = ((hash << 5) + hash + name.charCodeAt(i)) | 0;
    return COLORS[Math.abs(hash) % COLORS.length];
}

const SIZES = {
    sm: 'size-8 text-xs',
    md: 'size-9 text-sm',
};

/** Initial-letter avatar with a stable color per username. */
export default function Avatar({ name, size = 'md', className = '' }) {
    return (
        <div
            aria-hidden="true"
            className={`flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${SIZES[size]} ${colorFor(name)} ${className}`}
        >
            {name?.charAt(0).toUpperCase() || '?'}
        </div>
    );
}
