import { MessageCircle, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
    id: number;
    user_id: number;
    name: string;
    avatar_path: string | null;
    body: string;
    sent_at: string;
}

function messageTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Battle room chat: scrollable message list plus composer.
 * Realtime updates are handled by the parent (Echo); this renders and sends.
 */
export function RoomChat({
    messages,
    myId,
    onSend,
    className,
}: {
    messages: ChatMessage[];
    myId: number;
    onSend: (body: string) => Promise<void>;
    className?: string;
}) {
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, [messages]);

    async function submit() {
        const body = draft.trim();

        if (!body || sending) {
            return;
        }

        setSending(true);

        try {
            await onSend(body);
            setDraft('');
            setError(null);
        } catch (e) {
            // Keep the draft so the player can retry; surface the reason
            // (e.g. the 5-minute spam block).
            setError(e instanceof Error ? e.message : 'Message not sent.');
        } finally {
            setSending(false);
        }
    }

    return (
        <div
            className={cn(
                'flex flex-col rounded-2xl border border-foreground/10 bg-background/95',
                className,
            )}
        >
            <p className="flex items-center gap-1.5 border-b border-foreground/10 px-3 py-2 text-[11px] font-semibold tracking-widest text-foreground/40 uppercase">
                <MessageCircle size={13} />
                Room chat
            </p>

            <div
                ref={listRef}
                className="flex h-56 flex-col gap-2 overflow-y-auto p-3"
            >
                {messages.length === 0 && (
                    <p className="m-auto text-xs text-foreground/40">
                        No messages yet — say hi!
                    </p>
                )}
                {messages.map((message) => {
                    const mine = message.user_id === myId;

                    return (
                        <div
                            key={message.id}
                            className={cn(
                                'flex max-w-[85%] items-end gap-1.5',
                                mine
                                    ? 'flex-row-reverse self-end'
                                    : 'self-start',
                            )}
                        >
                            {!mine &&
                                (message.avatar_path ? (
                                    <img
                                        src={message.avatar_path}
                                        alt=""
                                        className="h-6 w-6 shrink-0 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-game-primary/25 text-[10px] font-bold text-foreground uppercase">
                                        {message.name.charAt(0)}
                                    </span>
                                ))}
                            <div
                                className={cn(
                                    'rounded-2xl px-3 py-1.5 text-sm',
                                    mine
                                        ? 'rounded-br-sm bg-game-primary/25 text-foreground'
                                        : 'rounded-bl-sm bg-foreground/10 text-foreground',
                                )}
                            >
                                {!mine && (
                                    <p className="text-[10px] font-bold text-foreground/50">
                                        {message.name}
                                    </p>
                                )}
                                <p className="break-words whitespace-pre-wrap">
                                    {message.body}
                                </p>
                                <p className="mt-0.5 text-right text-[9px] text-foreground/35">
                                    {messageTime(message.sent_at)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {error && (
                <p className="border-t border-foreground/10 px-3 py-1.5 text-xs font-medium text-game-danger">
                    {error}
                </p>
            )}

            <div className="flex items-center gap-2 border-t border-foreground/10 p-2">
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void submit();
                        }
                    }}
                    maxLength={500}
                    placeholder="Type a message…"
                    className="h-9 min-w-0 flex-1 rounded-xl border border-foreground/15 bg-background px-3 text-sm text-foreground outline-none placeholder:text-foreground/35 focus:border-game-primary/60"
                />
                <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={!draft.trim() || sending}
                    aria-label="Send message"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-game-primary/80 text-game-navy transition-colors hover:bg-game-primary disabled:opacity-40"
                >
                    <Send size={15} />
                </button>
            </div>
        </div>
    );
}
