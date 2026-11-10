import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Ban, Pencil, Trash2 } from 'lucide-react';
import Avatar from './Avatar';

const MAX_LENGTH = 2000;

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Inline editor that replaces the bubble while editing. Enter saves, Escape cancels. */
function EditBox({ initial, onSave, onCancel }) {
    const [text, setText] = useState(initial);
    const [saving, setSaving] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
    }, []);

    useLayoutEffect(() => {
        const el = ref.current;
        el.style.height = 'auto';
        // scrollHeight excludes the border, and the box uses border-box sizing, so add it back
        const border = el.offsetHeight - el.clientHeight;
        el.style.height = `${Math.min(el.scrollHeight + border, 200)}px`;
    }, [text]);

    const save = async () => {
        const trimmed = text.trim();
        if (!trimmed || saving) return;
        if (trimmed === initial) {
            onCancel();
            return;
        }
        setSaving(true);
        const ok = await onSave(trimmed);
        if (!ok) setSaving(false); // on success this component unmounts
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        } else if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            save();
        }
    };

    return (
        <div className="w-[min(28rem,70vw)]">
            <textarea
                ref={ref}
                value={text}
                maxLength={MAX_LENGTH}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Edit message"
                rows={1}
                className="scrollbar-thin block w-full resize-none rounded-2xl border border-brand-500 bg-white px-3.5 py-2 text-[15px] leading-relaxed outline-none ring-4 ring-brand-500/15 dark:bg-zinc-900"
            />
            <div className="mt-1.5 flex items-center justify-end gap-2 text-xs">
                <span className="mr-auto hidden text-zinc-500 sm:inline dark:text-zinc-400">
                    Esc to cancel · Enter to save
                </span>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md px-2.5 py-1 font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={save}
                    disabled={saving || !text.trim()}
                    className="rounded-md bg-brand-600 px-2.5 py-1 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </div>
    );
}

function ActionButton({ label, onClick, danger, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            className={`inline-flex size-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 ${
                danger ? 'hover:text-red-600 dark:hover:text-red-400' : 'hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
        >
            {children}
        </button>
    );
}

export default function MessageRow({ item, isMe, editing, onEdit, onDelete, onSave, onCancel }) {
    const { msg, date, grouped } = item;
    const canChange = isMe && !msg.deleted && !editing;

    let body;
    if (editing) {
        body = <EditBox initial={msg.content} onSave={onSave} onCancel={onCancel} />;
    } else if (msg.deleted) {
        body = (
            <div className="inline-flex items-center gap-1.5 rounded-2xl border border-dashed border-zinc-300 px-3.5 py-2 text-sm italic text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <Ban className="size-3.5" /> This message was deleted
            </div>
        );
    } else {
        body = (
            <div
                title={formatTime(date)}
                className={`whitespace-pre-wrap break-words px-3.5 py-2 text-[15px] leading-relaxed shadow-sm ${
                    isMe
                        ? 'rounded-2xl rounded-tr-md bg-brand-600 text-white'
                        : 'rounded-2xl rounded-tl-md bg-white text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700/60'
                }`}
            >
                {msg.content}
                {msg.editedAt && (
                    <span
                        title={`Edited ${new Date(msg.editedAt).toLocaleString()}`}
                        className={`ml-1.5 align-baseline text-[11px] ${isMe ? 'text-white/70' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >
                        (edited)
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={`group flex gap-3 ${isMe ? 'flex-row-reverse' : ''} ${grouped ? 'mt-0.5' : 'mt-4'}`}>
            {grouped ? <div className="w-9 shrink-0" /> : <Avatar name={msg.sender} />}
            <div className={`flex min-w-0 max-w-[80%] flex-col sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                {!grouped && (
                    <div className={`mb-1 flex items-baseline gap-2 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm font-semibold">{isMe ? 'You' : msg.sender}</span>
                        <time dateTime={msg.sentAt} className="text-xs text-zinc-500 dark:text-zinc-400">{formatTime(date)}</time>
                    </div>
                )}
                {body}
            </div>
            {canChange && (
                // Shown on hover/focus with a mouse, always visible on touch screens
                <div className="flex items-center gap-0.5 self-center opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
                    <ActionButton label="Edit message" onClick={onEdit}>
                        <Pencil className="size-3.5" />
                    </ActionButton>
                    <ActionButton label="Delete message" onClick={onDelete} danger>
                        <Trash2 className="size-3.5" />
                    </ActionButton>
                </div>
            )}
        </div>
    );
}
