import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Star, Target, Trophy, Zap } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';

// ─── Chemistry particles that float upward ───────────────────────
const PARTICLES = [
    { label: 'CH₄',    left: '5%',  delay: '0s',    dur: '14s', size: '1.1rem'  },
    { label: 'C₂H₆',  left: '15%', delay: '2.2s',  dur: '17s', size: '0.8rem'  },
    { label: '⬡',      left: '28%', delay: '4.8s',  dur: '21s', size: '1.9rem'  },
    { label: 'IUPAC',  left: '42%', delay: '1.1s',  dur: '12s', size: '0.7rem'  },
    { label: 'C₃H₈',  left: '56%', delay: '3.4s',  dur: '16s', size: '0.85rem' },
    { label: 'NaCl',   left: '68%', delay: '0.6s',  dur: '15s', size: '1.05rem' },
    { label: 'C₆H₁₂', left: '79%', delay: '5.3s',  dur: '19s', size: '0.75rem' },
    { label: 'H₂O',   left: '89%', delay: '2.8s',  dur: '13s', size: '0.9rem'  },
    { label: 'CH₃OH', left: '22%', delay: '7.2s',  dur: '18s', size: '0.7rem'  },
    { label: 'C₄H₁₀', left: '63%', delay: '6.5s',  dur: '14s', size: '0.8rem'  },
    { label: '—CH₃',  left: '36%', delay: '9.1s',  dur: '16s', size: '0.75rem' },
    { label: 'C₅H₁₂', left: '82%', delay: '3.9s',  dur: '20s', size: '0.7rem'  },
];

const FEATURES = [
    { Icon: Zap,    title: '3 Game Modes',       desc: 'Name it, match it, decode it'    },
    { Icon: Target, title: 'Timed Challenges',   desc: 'Race the clock, earn big points' },
    { Icon: Trophy, title: 'Leaderboards',       desc: 'Compete with classmates'         },
    { Icon: Star,   title: 'XP & Achievements', desc: 'Track your chemistry mastery'    },
];

// ─── Injected CSS keyframes (page-scoped) ────────────────────────
const STYLES = `
    @keyframes ct-float {
        0%   { transform: translateY(108vh) rotate(-6deg); opacity: 0; }
        5%   { opacity: 0.22; }
        90%  { opacity: 0.14; }
        100% { transform: translateY(-10vh) rotate(6deg); opacity: 0; }
    }
    @keyframes ct-blob {
        0%,100% { transform: translate(0,0) scale(1); }
        33%     { transform: translate(26px,-16px) scale(1.07); }
        66%     { transform: translate(-16px,12px) scale(0.95); }
    }
    @keyframes ct-glow {
        0%,100% { box-shadow: 0 0 20px 5px oklch(0.6 0.24 277.6 / 0.38); }
        50%     { box-shadow: 0 0 36px 10px oklch(0.6 0.24 277.6 / 0.62); }
    }
    @keyframes ct-in {
        from { transform: translateY(22px); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
    }
    @keyframes ct-fadein {
        from { opacity: 0; }
        to   { opacity: 1; }
    }
    .ct-particle { position:absolute; bottom:-8%; pointer-events:none; user-select:none;
        animation: ct-float linear infinite; font-family:'Courier New',monospace; font-weight:600; }
    .ct-in  { animation: ct-in   0.6s cubic-bezier(0.22,1,0.36,1) both; }
    .ct-fi  { animation: ct-fadein 0.4s ease-out both; }
`;

// ─── Animated Bohr-model atom (SVG) ──────────────────────────────
function AnimatedAtom() {
    const ePath = 'M 68 0 A 68 22 0 1 1 -68 0 A 68 22 0 1 1 68 0';
    return (
        <svg viewBox="-90 -90 180 180" width="152" height="152" style={{ overflow: 'visible' }}>
            <defs>
                <radialGradient id="ct-nuc" cx="35%" cy="30%" r="65%">
                    <stop offset="0%"   stopColor="oklch(0.65 0.24 277.6)" />
                    <stop offset="100%" stopColor="oklch(0.30 0.16 277.6)" />
                </radialGradient>
                <filter id="ct-gf">
                    <feGaussianBlur stdDeviation="2.5" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* Three tilted orbital ellipses */}
            <ellipse rx="68" ry="22" fill="none" stroke="oklch(0.762 0.199 131.2 / 0.38)" strokeWidth="1.5" />
            <ellipse rx="68" ry="22" fill="none" stroke="oklch(0.793 0.131 216.4 / 0.32)" strokeWidth="1.5" transform="rotate(60)" />
            <ellipse rx="68" ry="22" fill="none" stroke="oklch(0.6 0.24 277.6 / 0.32)"    strokeWidth="1.5" transform="rotate(-60)" />

            {/* Nucleus */}
            <circle r="23" fill="url(#ct-nuc)" filter="url(#ct-gf)" />
            <text textAnchor="middle" dy="5" fill="white" fontSize="12" fontWeight="800" fontFamily="monospace">C</text>

            {/* Electrons following their ring's elliptical path */}
            <circle r="5.5" fill="oklch(0.762 0.199 131.2)" filter="url(#ct-gf)">
                <animateMotion dur="2.9s" repeatCount="indefinite" path={ePath} />
            </circle>
            <g transform="rotate(60)">
                <circle r="5" fill="oklch(0.793 0.131 216.4)" filter="url(#ct-gf)">
                    <animateMotion dur="2.1s" repeatCount="indefinite" begin="-0.8s" path={ePath} />
                </circle>
            </g>
            <g transform="rotate(-60)">
                <circle r="4.5" fill="oklch(0.6 0.24 277.6)" filter="url(#ct-gf)">
                    <animateMotion dur="3.6s" repeatCount="indefinite" begin="-1.7s" path={ePath} />
                </circle>
            </g>
        </svg>
    );
}

// ─── Page ────────────────────────────────────────────────────────
type Props = { status?: string };

interface Branding {
    app_name: string;
    app_tagline: string | null;
    app_logo_path: string | null;
    footer_text: string | null;
}

export default function Login({ status }: Props) {
    const { name, branding } = usePage<{ name: string; branding?: Branding }>().props;
    const appName = name ?? 'ChemTag';

    const brandBadge = (size: number, radius: string, fontSize: string) =>
        branding?.app_logo_path ? (
            <img
                src={branding.app_logo_path}
                alt={appName}
                style={{ width: `${size}px`, height: `${size}px`, borderRadius: radius, objectFit: 'contain', flexShrink: 0 }}
            />
        ) : (
            <div style={{
                background: 'linear-gradient(135deg, oklch(0.62 0.245 277.6), oklch(0.42 0.22 277.6))',
                borderRadius: radius, width: `${size}px`, height: `${size}px`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize, color: '#fff',
                flexShrink: 0,
            }}>{appName.slice(0, 2).toUpperCase()}</div>
        );

    return (
        <div
            className="relative flex min-h-screen overflow-hidden"
            style={{ background: 'oklch(0.112 0.028 265)' }}
        >
            <Head title="Log in" />
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: STYLES }} />

            {/* ── Ambient colour blobs ── */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div style={{
                    animation: 'ct-blob 18s ease-in-out infinite',
                    background: 'oklch(0.496 0.265 277.6 / 0.16)',
                    width: '520px', height: '520px', borderRadius: '50%',
                    position: 'absolute', top: '-120px', left: '-160px', filter: 'blur(90px)',
                }} />
                <div style={{
                    animation: 'ct-blob 23s ease-in-out infinite reverse',
                    background: 'oklch(0.793 0.131 216.4 / 0.1)',
                    width: '440px', height: '440px', borderRadius: '50%',
                    position: 'absolute', bottom: '-60px', right: '-90px', filter: 'blur(90px)',
                }} />
                <div style={{
                    animation: 'ct-blob 27s ease-in-out infinite 4s',
                    background: 'oklch(0.762 0.199 131.2 / 0.07)',
                    width: '360px', height: '360px', borderRadius: '50%',
                    position: 'absolute', top: '40%', left: '38%', filter: 'blur(110px)',
                }} />
            </div>

            {/* ── Floating chemistry particles ── */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
                {PARTICLES.map((p, i) => (
                    <span
                        key={i}
                        className="ct-particle"
                        style={{
                            left: p.left,
                            animationDelay: p.delay,
                            animationDuration: p.dur,
                            fontSize: p.size,
                            color: 'oklch(0.7 0.06 280 / 0.16)',
                        }}
                    >
                        {p.label}
                    </span>
                ))}
            </div>

            {/* ════════════════════════════════════════════════════
                LEFT SHOWCASE PANEL  (desktop only)
            ════════════════════════════════════════════════════ */}
            <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between p-14 xl:p-20">

                {/* Brand mark */}
                <div className="flex items-center gap-3">
                    <div style={{ animation: 'ct-glow 3s ease-in-out infinite', borderRadius: '14px' }}>
                        {brandBadge(46, '14px', '1rem')}
                    </div>
                    <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', color: '#fff', lineHeight: 1.1 }}>{appName}</div>
                        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.16em', color: 'oklch(0.65 0.05 280 / 0.55)' }}>
                            {branding?.app_tagline ?? 'Organic Chemistry'}
                        </div>
                    </div>
                </div>

                {/* Hero content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    <AnimatedAtom />

                    {/* Headline */}
                    <div>
                        <h1 style={{
                            fontFamily: 'var(--font-display)', fontWeight: 800,
                            fontSize: 'clamp(1.8rem, 3.2vw, 2.55rem)', lineHeight: 1.1,
                            color: '#fff', marginBottom: '14px',
                        }}>
                            Level Up Your<br />
                            <span style={{
                                background: 'linear-gradient(105deg, oklch(0.76 0.199 131.2), oklch(0.62 0.245 277.6) 55%, oklch(0.79 0.131 216.4))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>Chemistry Game</span>
                        </h1>
                        <p style={{ color: 'oklch(0.70 0.04 280 / 0.65)', fontSize: '0.88rem', maxWidth: '340px', lineHeight: 1.7 }}>
                            Master IUPAC organic chemistry naming through fast-paced quizzes, real-time scoring, and competitive leaderboards.
                        </p>
                    </div>

                    {/* Feature grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {FEATURES.map(({ Icon, title, desc }, i) => (
                            <div
                                key={i}
                                className="ct-fi"
                                style={{
                                    animationDelay: `${0.12 + i * 0.09}s`,
                                    background: 'oklch(1 0 0 / 0.045)',
                                    border: '1px solid oklch(1 0 0 / 0.07)',
                                    borderRadius: '16px', padding: '14px',
                                }}
                            >
                                <div style={{ color: 'oklch(0.762 0.199 131.2)', marginBottom: '7px' }}>
                                    <Icon size={17} />
                                </div>
                                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem', marginBottom: '3px' }}>{title}</div>
                                <div style={{ color: 'oklch(0.56 0.04 280)', fontSize: '0.71rem', lineHeight: 1.5 }}>{desc}</div>
                            </div>
                        ))}
                    </div>

                    {/* Stat strip */}
                    <div style={{ display: 'flex', gap: '24px' }}>
                        {[
                            { value: '3',    label: 'Game Modes'  },
                            { value: '4',    label: 'Difficulty Levels' },
                            { value: '∞',    label: 'Questions'   },
                        ].map(({ value, label }) => (
                            <div key={label}>
                                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'oklch(0.762 0.199 131.2)', lineHeight: 1 }}>{value}</div>
                                <div style={{ fontSize: '0.68rem', color: 'oklch(0.55 0.04 280)', marginTop: '3px' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p style={{ color: 'oklch(0.44 0.04 280)', fontSize: '0.68rem' }}>
                    {branding?.footer_text ?? `© ${appName}`}
                </p>
            </div>

            {/* ════════════════════════════════════════════════════
                RIGHT LOGIN PANEL
            ════════════════════════════════════════════════════ */}
            <div className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
                <div className="ct-in w-full" style={{ maxWidth: '390px', animationDelay: '0.05s' }}>

                    {/* Mobile-only brand */}
                    <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                        {brandBadge(36, '10px', '0.85rem')}
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{appName}</span>
                    </div>

                    {/* ── Glass card ── */}
                    <div style={{
                        background: 'oklch(1 0 0 / 0.05)',
                        backdropFilter: 'blur(28px)',
                        WebkitBackdropFilter: 'blur(28px)',
                        border: '1px solid oklch(1 0 0 / 0.1)',
                        borderRadius: '28px',
                        padding: '36px 36px 32px',
                        boxShadow: '0 30px 70px oklch(0 0 0 / 0.55), inset 0 1px 0 oklch(1 0 0 / 0.1)',
                    }}>
                        {/* Card header */}
                        <div style={{ marginBottom: '28px' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: 'oklch(0.762 0.199 131.2 / 0.12)',
                                border: '1px solid oklch(0.762 0.199 131.2 / 0.25)',
                                borderRadius: '100px', padding: '4px 12px',
                                fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em',
                                color: 'oklch(0.762 0.199 131.2)', textTransform: 'uppercase',
                                marginBottom: '14px',
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'oklch(0.762 0.199 131.2)', display: 'inline-block', animation: 'ct-glow 2s ease-in-out infinite' }} />
                                Player Login
                            </div>
                            <h2 style={{
                                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.45rem',
                                color: '#fff', marginBottom: '6px', lineHeight: 1.2,
                            }}>
                                Welcome back, Chemist!
                            </h2>
                            <p style={{ color: 'oklch(0.60 0.04 280)', fontSize: '0.82rem' }}>
                                Enter your credentials to continue your journey
                            </p>
                        </div>

                        {status && (
                            <div style={{
                                background: 'oklch(0.762 0.199 131.2 / 0.12)',
                                border: '1px solid oklch(0.762 0.199 131.2 / 0.28)',
                                borderRadius: '12px', padding: '10px 14px',
                                color: 'oklch(0.762 0.199 131.2)', fontSize: '0.82rem', marginBottom: '22px',
                            }}>
                                {status}
                            </div>
                        )}

                        <Form {...store.form()} resetOnSuccess={['password']} className="flex flex-col gap-5">
                            {({ processing, errors }) => (
                                <>
                                    {/* Username */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label
                                            htmlFor="username"
                                            style={{ color: 'oklch(0.74 0.05 280)', fontSize: '0.8rem', fontWeight: 500 }}
                                        >
                                            Username
                                        </Label>
                                        <Input
                                            id="username"
                                            type="text"
                                            name="username"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="username"
                                            placeholder="your_username"
                                            className="bg-white/8 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[oklch(0.6_0.24_277.6/0.8)] focus-visible:ring-[oklch(0.6_0.24_277.6/0.2)]"
                                        />
                                        <InputError message={errors.username} />
                                    </div>

                                    {/* Password */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label
                                            htmlFor="password"
                                            style={{ color: 'oklch(0.74 0.05 280)', fontSize: '0.8rem', fontWeight: 500 }}
                                        >
                                            Password
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="Password"
                                            className="bg-white/8 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[oklch(0.6_0.24_277.6/0.8)] focus-visible:ring-[oklch(0.6_0.24_277.6/0.2)]"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    {/* Remember me */}
                                    <div className="flex items-center gap-2.5">
                                        <Checkbox id="remember" name="remember" tabIndex={3} />
                                        <label
                                            htmlFor="remember"
                                            style={{ color: 'oklch(0.60 0.04 280)', fontSize: '0.82rem', cursor: 'pointer' }}
                                        >
                                            Remember me
                                        </label>
                                    </div>

                                    {/* CTA */}
                                    <Button
                                        type="submit"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                        className="w-full mt-1 h-11 border-0 text-white font-semibold text-[0.88rem] tracking-wide"
                                        style={{
                                            background: processing
                                                ? 'oklch(0.42 0.18 277.6)'
                                                : 'linear-gradient(135deg, oklch(0.63 0.245 277.6) 0%, oklch(0.44 0.23 277.6) 100%)',
                                            boxShadow: processing ? 'none' : '0 4px 24px oklch(0.6 0.24 277.6 / 0.4)',
                                            borderRadius: '14px',
                                            transition: 'opacity 0.15s, box-shadow 0.15s',
                                        } as React.CSSProperties}
                                    >
                                        {processing ? (
                                            <Spinner />
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Enter the Lab <ArrowRight size={16} />
                                            </span>
                                        )}
                                    </Button>

                                    {/* Register link */}
                                    <p style={{
                                        textAlign: 'center',
                                        color: 'oklch(0.52 0.04 280)',
                                        fontSize: '0.82rem',
                                        paddingTop: '2px',
                                    }}>
                                        New to {appName}?{' '}
                                        <Link
                                            href={register()}
                                            tabIndex={5}
                                            style={{ color: 'oklch(0.762 0.199 131.2)', fontWeight: 600, textDecoration: 'none' }}
                                        >
                                            Create an account
                                        </Link>
                                    </p>
                                </>
                            )}
                        </Form>
                    </div>

                    {/* Mobile tagline */}
                    <p className="mt-5 text-center text-xs lg:hidden" style={{ color: 'oklch(0.42 0.04 280)' }}>
                        Master organic chemistry · Compete · Level up
                    </p>
                </div>
            </div>
        </div>
    );
}

// No outer layout — this page manages its own full-screen shell
Login.layout = null;
