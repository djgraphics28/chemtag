import { Head, Link, usePage } from '@inertiajs/react';
import {
    FlaskConical,
    Medal,
    Sparkles,
    Swords,
    Trophy,
    Zap,
} from 'lucide-react';
import { dashboard, login, register } from '@/routes';

const floatingElements = [
    {
        symbol: 'H',
        name: 'Hydrogen',
        number: 1,
        className: 'top-[12%] left-[6%] rotate-[-8deg] bg-game-purple/90',
        delay: '0s',
    },
    {
        symbol: 'O',
        name: 'Oxygen',
        number: 8,
        className: 'top-[22%] right-[8%] rotate-[10deg] bg-game-coral/90',
        delay: '1.2s',
    },
    {
        symbol: 'Na',
        name: 'Sodium',
        number: 11,
        className: 'bottom-[28%] left-[10%] rotate-[6deg] bg-game-sky/90',
        delay: '0.6s',
    },
    {
        symbol: 'C',
        name: 'Carbon',
        number: 6,
        className: 'bottom-[18%] right-[12%] rotate-[-6deg] bg-game-lime/90',
        delay: '1.8s',
    },
];

const features = [
    {
        icon: FlaskConical,
        title: 'Solo Quests',
        description:
            'Race the clock through chemistry topics and rack up points question by question.',
        className: 'bg-game-purple/10 text-game-purple border-game-purple/25',
        iconClassName: 'bg-game-purple text-white',
    },
    {
        icon: Swords,
        title: 'Battle Mode',
        description:
            'Challenge your classmates to real-time quiz battles and claim bragging rights.',
        className: 'bg-game-coral/10 text-game-coral border-game-coral/25',
        iconClassName: 'bg-game-coral text-white',
    },
    {
        icon: Trophy,
        title: 'Leaderboards',
        description:
            'Climb the ranks per topic and see your name shine at the top of the class.',
        className:
            'bg-game-sky/15 text-game-navy border-game-sky/40 dark:text-game-sky',
        iconClassName: 'bg-game-sky text-game-navy',
    },
    {
        icon: Sparkles,
        title: 'XP & Stars',
        description:
            'Earn XP, collect stars, and level up your chemistry mastery one game at a time.',
        className:
            'bg-game-lime/10 text-game-navy border-game-lime/30 dark:text-game-lime',
        iconClassName: 'bg-game-lime text-game-navy',
    },
];

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
                {/* Background glow blobs */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                >
                    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-game-purple/20 blur-3xl" />
                    <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-game-sky/25 blur-3xl" />
                    <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-game-lime/15 blur-3xl" />
                </div>

                {/* Floating element tiles */}
                {floatingElements.map((element) => (
                    <div
                        key={element.symbol}
                        aria-hidden
                        style={{ animationDelay: element.delay }}
                        className={`absolute hidden w-20 animate-float rounded-2xl p-2 text-white shadow-xl md:block ${element.className}`}
                    >
                        <span className="block text-right text-[10px] font-semibold opacity-80">
                            {element.number}
                        </span>
                        <span className="block text-center font-display text-2xl leading-none font-bold">
                            {element.symbol}
                        </span>
                        <span className="mt-1 block truncate text-center text-[9px] font-medium opacity-80">
                            {element.name}
                        </span>
                    </div>
                ))}

                {/* Nav */}
                <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 animate-wiggle items-center justify-center rounded-xl bg-gradient-to-br from-game-purple to-game-sky text-xl shadow-lg">
                            🧪
                        </span>
                        <span className="font-display text-xl font-bold">
                            ChemTag
                        </span>
                    </div>
                    <nav className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-md transition-transform hover:scale-105"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-full px-5 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-md transition-transform hover:scale-105"
                                >
                                    Sign up free
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* Hero */}
                <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pt-10 pb-16 text-center lg:pt-20">
                    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-game-purple/30 bg-game-purple/10 px-4 py-1.5 text-sm font-semibold text-game-purple dark:text-primary">
                        <Zap size={14} className="fill-current" />
                        The chemistry quiz game for students
                    </span>

                    <h1 className="max-w-2xl font-display text-4xl leading-tight font-extrabold sm:text-5xl lg:text-6xl">
                        Learn chemistry the{' '}
                        <span className="bg-gradient-to-r from-game-purple via-game-coral to-game-sky bg-clip-text text-transparent">
                            fun way
                        </span>
                        !
                    </h1>

                    <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                        Tag elements, smash quizzes, battle your friends, and
                        watch your XP explode. No boring flashcards — just pure
                        reaction. ⚗️
                    </p>

                    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                        <Link
                            href={auth.user ? dashboard() : register()}
                            className="rounded-full bg-gradient-to-r from-game-purple to-game-primary px-8 py-3.5 font-display text-lg font-bold text-white shadow-xl shadow-game-purple/30 transition-transform hover:scale-105"
                        >
                            {auth.user
                                ? 'Keep Playing'
                                : 'Start Playing — Free'}
                        </Link>
                        {!auth.user && (
                            <Link
                                href={login()}
                                className="rounded-full border-2 border-border bg-card px-8 py-3 font-display text-lg font-bold text-foreground transition-all hover:border-game-sky hover:text-game-navy dark:hover:text-game-sky"
                            >
                                I have an account
                            </Link>
                        )}
                    </div>

                    {/* Feature cards */}
                    <div className="mt-16 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className={`rounded-3xl border-2 p-5 text-left transition-transform hover:-translate-y-1 ${feature.className}`}
                            >
                                <span
                                    className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl shadow-md ${feature.iconClassName}`}
                                >
                                    <feature.icon size={22} />
                                </span>
                                <h2 className="font-display text-lg font-bold">
                                    {feature.title}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="relative z-10 flex items-center justify-center gap-2 pb-6 text-sm text-muted-foreground">
                    <Medal size={14} className="text-game-warning" />
                    Made for curious students
                </footer>
            </div>
        </>
    );
}
