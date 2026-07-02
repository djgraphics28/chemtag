import { Head } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';

interface GameLayoutProps extends PropsWithChildren {
    title?: string;
}

export default function GameLayout({ children, title }: GameLayoutProps) {
    return (
        <>
            {title && <Head title={title} />}
            {/* Always dark for immersive game experience */}
            <div className="dark flex min-h-screen flex-col bg-[oklch(0.156_0.038_264.8)] text-white">
                {children}
            </div>
        </>
    );
}
