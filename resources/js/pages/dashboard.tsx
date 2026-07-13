import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    FlaskConical,
    Swords,
    Trophy,
    UserRound,
    Zap,
} from 'lucide-react';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';

export default function Dashboard() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const firstName = auth.user.name.split(' ')[0];

    const actions = [
        {
            href: '/game/topics',
            icon: FlaskConical,
            title: 'Solo Quest',
            description: 'Pick a topic and beat your best score',
            className: 'from-game-purple to-game-primary shadow-game-purple/30',
            emoji: '🧪',
        },
        {
            href: '/battle',
            icon: Swords,
            title: 'Battle Mode',
            description: 'Challenge a classmate in real time',
            className: 'from-game-coral to-game-warning shadow-game-coral/30',
            emoji: '⚔️',
        },
        {
            href: '/game/leaderboard',
            icon: Trophy,
            title: 'Leaderboard',
            description: 'See who rules the periodic table',
            className: 'from-game-sky to-game-primary shadow-game-sky/40',
            emoji: '🏆',
        },
        {
            href: `/players/${auth.user.username}`,
            icon: UserRound,
            title: 'My Profile',
            description: 'Check your stars, XP, and stats',
            className: 'from-game-lime to-game-sky shadow-game-lime/30',
            emoji: '⭐',
        },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Greeting */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-game-purple via-game-primary to-game-sky p-6 text-white shadow-xl sm:p-8">
                    <div
                        aria-hidden
                        className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-xl"
                    />
                    <div
                        aria-hidden
                        className="absolute right-24 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-lg"
                    />
                    <div className="relative flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="font-display text-3xl font-bold sm:text-4xl">
                                Hey, {firstName}! 👋
                            </h1>
                            <p className="mt-1 text-white/80">
                                Ready to mix up some chemistry today?
                            </p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 font-display font-bold backdrop-blur">
                            <Zap
                                size={18}
                                className="fill-game-warning text-game-warning"
                            />
                            {auth.user.xp_total.toLocaleString()} XP
                        </div>
                    </div>
                </div>

                {/* Action cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {actions.map((action) => (
                        <Link
                            key={action.title}
                            href={action.href}
                            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg transition-transform hover:-translate-y-1 hover:scale-[1.02] ${action.className}`}
                        >
                            <span
                                aria-hidden
                                className="absolute -right-3 -bottom-5 text-7xl opacity-25 transition-transform group-hover:scale-110 group-hover:rotate-12"
                            >
                                {action.emoji}
                            </span>
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                                <action.icon size={24} />
                            </span>
                            <h2 className="mt-4 font-display text-2xl font-bold">
                                {action.title}
                            </h2>
                            <p className="mt-1 text-sm text-white/85">
                                {action.description}
                            </p>
                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold">
                                Let's go
                                <ArrowRight
                                    size={16}
                                    className="transition-transform group-hover:translate-x-1"
                                />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
