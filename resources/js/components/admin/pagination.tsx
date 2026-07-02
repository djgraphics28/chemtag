import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PaginatedData } from '@/types/admin';

interface PaginationProps {
    meta: Pick<PaginatedData<unknown>, 'current_page' | 'last_page' | 'from' | 'to' | 'total' | 'links'>;
}

export function Pagination({ meta }: PaginationProps) {
    if (meta.last_page <= 1) {
        return null;
    }

    const prev = meta.links.find((l) => l.label === '&laquo; Previous');
    const next = meta.links.find((l) => l.label === 'Next &raquo;');

    return (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
                {meta.from}–{meta.to} of {meta.total}
            </span>
            <div className="flex items-center gap-1">
                {prev?.url ? (
                    <Button asChild variant="ghost" size="sm">
                        <Link href={prev.url}>
                            <ChevronLeft size={14} />
                        </Link>
                    </Button>
                ) : (
                    <Button variant="ghost" size="sm" disabled>
                        <ChevronLeft size={14} />
                    </Button>
                )}
                <span className="px-2">
                    {meta.current_page} / {meta.last_page}
                </span>
                {next?.url ? (
                    <Button asChild variant="ghost" size="sm">
                        <Link href={next.url}>
                            <ChevronRight size={14} />
                        </Link>
                    </Button>
                ) : (
                    <Button variant="ghost" size="sm" disabled>
                        <ChevronRight size={14} />
                    </Button>
                )}
            </div>
        </div>
    );
}
