import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/layout/TopNav";
import { WalletProvider } from "@/components/wallet/WalletProvider";

export const metadata: Metadata = {
  title: "Fiducia — Decentralized Underwriting",
  description: "GenLayer-native underwriting layer. Private evidence. Public trust. Consensus-backed credit decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <style>{`
          :root {
            --alice: #E2ECF5;
            --wisteria: #A4A7E3;
            --majorelle: #6A4DD4;
            --velvet: #6E3377;
            --prussian: #000229;
            --prussian-2: #07083A;
            --mint: #63E6C2;
            --amber: #F6C56B;
            --rose: #FF8FB8;
            --glass-line: rgba(226, 236, 245, 0.12);
          }

          html {
            background: var(--prussian);
            color: var(--alice);
            font-family: Inter, system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
            scroll-behavior: smooth;
          }

          body {
            min-height: 100vh;
            margin: 0;
            overflow-x: hidden;
            background:
              linear-gradient(180deg, rgba(0, 2, 41, 0.94), rgba(2, 4, 20, 0.98) 52%, #050416),
              var(--prussian);
            color: var(--alice);
          }

          body::before {
            content: '';
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 0;
            background:
              linear-gradient(rgba(226, 236, 245, 0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(226, 236, 245, 0.025) 1px, transparent 1px);
            background-size: 84px 84px;
            mask-image: linear-gradient(to bottom, black 0%, black 48%, transparent 90%);
          }

          body::after {
            content: '';
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 1;
            opacity: 0.3;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E");
            mix-blend-mode: soft-light;
          }

          .site-shell,
          .home-shell,
          .section,
          .site-nav {
            position: relative;
            z-index: 2;
          }

          .site-nav {
            position: sticky;
            top: 0;
            z-index: 50;
            border-bottom: 1px solid rgba(226, 236, 245, 0.08);
            background: rgba(0, 2, 41, 0.62);
            backdrop-filter: blur(24px);
          }

          .site-nav__inner {
            margin: 0 auto;
            display: flex;
            height: 64px;
            max-width: 80rem;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
          }

          .site-brand {
            display: inline-flex;
            align-items: center;
            gap: 12px;
          }

          .site-brand > div {
            display: grid;
            width: 32px;
            height: 32px;
            place-items: center;
          }

          .site-brand__mark {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #63E6C2, #6A4DD4 48%, #6E3377);
            clip-path: polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%);
            box-shadow: 0 0 24px rgba(99, 230, 194, 0.28), 0 0 34px rgba(106, 77, 212, 0.34);
          }

          .group:hover .site-brand__mark {
            animation: logo-spin 18s linear infinite;
          }

          .site-brand__label {
            font-family: Space Grotesk, system-ui, sans-serif;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--alice);
          }

          .site-nav__links {
            display: none;
            align-items: center;
            gap: 4px;
            border: 1px solid rgba(226, 236, 245, 0.08);
            background: rgba(0, 2, 41, 0.24);
            padding: 4px;
            border-radius: 999px;
          }

          @media (min-width: 768px) {
            .site-nav__links {
              display: inline-flex;
            }
          }

          .site-nav__link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            padding: 8px 16px;
            font-size: 0.875rem;
            color: rgba(226, 236, 245, 0.68);
            transition: 180ms ease;
            text-decoration: none;
          }

          .site-nav__link:hover {
            background: rgba(226, 236, 245, 0.08);
            color: #fff;
          }

          .site-nav__link--active {
            background: rgba(99, 230, 194, 0.1);
            color: var(--mint);
          }

          .site-nav__actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .site-badge {
            display: none;
            border: 1px solid var(--mint);
            background: rgba(99, 230, 194, 0.1);
            color: var(--mint);
            border-radius: 999px;
            padding: 4px 8px;
            font: 500 0.75rem/1 JetBrains Mono, ui-monospace, monospace;
          }

          @media (min-width: 640px) {
            .site-badge {
              display: inline-flex;
            }
          }

          .wallet-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-height: 40px;
            border-radius: 999px;
            border: 1px solid rgba(226, 236, 245, 0.16);
            background: rgba(226, 236, 245, 0.045);
            padding: 0 16px;
            color: var(--alice);
            font: 500 0.875rem/1 Inter, system-ui, sans-serif;
            transition: 180ms ease;
          }

          .wallet-button:hover {
            border-color: rgba(99, 230, 194, 0.45);
            background: rgba(99, 230, 194, 0.08);
          }

          .nav-launch-btn {
            display: inline-flex;
            align-items: center;
            min-height: 40px;
            border-radius: 999px;
            border: 1px solid rgba(226, 236, 245, 0.22);
            background: rgba(226, 236, 245, 0.06);
            padding: 0 20px;
            color: var(--alice);
            font: 500 0.875rem/1 Inter, system-ui, sans-serif;
            text-decoration: none;
            transition: 180ms ease;
          }

          .nav-launch-btn:hover {
            background: var(--majorelle);
            border-color: var(--majorelle);
            box-shadow: 0 0 28px rgba(106, 77, 212, 0.45);
          }

          .home-shell {
            min-height: 100vh;
            overflow: hidden;
          }

          /* ── Hero: centred layout ── */
          .hero {
            position: relative;
            min-height: 92svh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 120px 20px 60px;
            overflow: hidden;
          }

          /* Halo ring behind the headline */
          .hero-halo {
            position: absolute;
            top: 48%;
            left: 50%;
            width: min(70vw, 660px);
            aspect-ratio: 1;
            border-radius: 50%;
            background: radial-gradient(circle, transparent 36%, rgba(106,77,212,0.32) 50%, transparent 70%);
            filter: blur(3px);
            transform: translate(-50%, -50%);
            pointer-events: none;
            animation: breathe 6s ease-in-out infinite;
          }

          .hero-halo::after {
            content: '';
            position: absolute;
            inset: 22%;
            border-radius: 50%;
            background: radial-gradient(circle, transparent 48%, rgba(110,51,119,0.26) 60%, transparent 78%);
            animation: breathe 6s ease-in-out infinite reverse;
          }

          .hero__inner {
            position: relative;
            z-index: 10;
            max-width: 860px;
            margin: 0 auto;
          }

          .signal-field {
            position: fixed;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
          }

          /* Trust rings — centred on hero */
          .trust-ring {
            position: absolute;
            left: 50%;
            top: 48%;
            width: min(72vw, 680px);
            aspect-ratio: 1;
            border: 1px solid rgba(226, 236, 245, 0.1);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
          }

          .trust-ring::before {
            content: '';
            position: absolute;
            inset: -1px;
            border: 1px solid transparent;
            border-radius: 50%;
            background: conic-gradient(from 0deg, transparent 0 18%, var(--mint), transparent 28% 58%, var(--velvet), transparent 68% 100%) border-box;
            mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);
            mask-composite: exclude;
            animation: ring-turn 12s linear infinite;
          }

          .trust-ring-inner {
            width: min(52vw, 500px);
            opacity: 0.5;
          }

          .trust-ring-inner::before {
            animation-duration: 18s;
            animation-direction: reverse;
          }

          @media (max-width: 900px) {
            .trust-ring       { width: min(88vw, 480px); }
            .trust-ring-inner { width: min(70vw, 360px); }
            .hero-halo        { width: min(86vw, 460px); }
            .signal-chip-c, .signal-chip-d { display: none; }
            .signal-chip-a { left: 0.75rem; }
            .signal-chip-b { right: 0.75rem; }
          }

          @media (max-width: 600px) {
            .hero { padding: 96px 16px 48px; min-height: 100svh; }
            .hero__title {
              font-size: clamp(1.5rem, 7.5vw, 2.2rem);
              max-width: 16ch;
            }
            .hero__copy { font-size: 0.9375rem; }
            .trust-ring       { width: 90vw; }
            .trust-ring-inner { width: 68vw; }
            .hero-halo        { width: 88vw; }
            .signal-chip-a, .signal-chip-b { display: none; }
          }

          .trust-ring-inner::before {
            animation-duration: 18s;
            animation-direction: reverse;
          }

          .signal-chip {
            position: absolute;
            min-width: 176px;
            padding: 0.85rem 0.95rem;
            border: 1px solid rgba(226, 236, 245, 0.16);
            border-radius: 8px;
            background: linear-gradient(180deg, rgba(8, 10, 48, 0.68), rgba(2, 4, 20, 0.44));
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255,255,255,0.08);
            backdrop-filter: blur(18px);
            text-align: left;
            animation: float-card 7s ease-in-out infinite;
          }

          .signal-chip span {
            display: block;
            margin-bottom: 0.35rem;
            color: rgba(226, 236, 245, 0.62);
            font: 500 0.61rem/1 JetBrains Mono, ui-monospace, monospace;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .signal-chip strong {
            color: var(--alice);
            font-family: Space Grotesk, system-ui, sans-serif;
            font-size: 1.05rem;
          }

          .signal-chip-a { left: max(1.5rem, 4vw); top: 28%; }
          .signal-chip-b { right: max(1.5rem, 4vw); top: 24%; animation-delay: -2.1s; }
          .signal-chip-c { left: max(1.5rem, 5vw); bottom: 22%; animation-delay: -4.2s; }
          .signal-chip-d { right: max(1.5rem, 5vw); bottom: 22%; animation-delay: -1.2s; }

          .gradient-text {
            background: linear-gradient(110deg, var(--mint) 0%, var(--wisteria) 23%, var(--majorelle) 56%, var(--rose) 82%, var(--amber) 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            background-size: 200% auto;
            animation: shimmer 8s linear infinite;
          }

          .hero__content,
          .section,
          .cta-shell {
            margin-left: auto;
            margin-right: auto;
            max-width: 80rem;
          }

          .hero__content {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .hero__eyebrow,
          .section-kicker {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(226, 236, 245, 0.16);
            background: rgba(226, 236, 245, 0.055);
            color: #A4A7E3;
            border-radius: 999px;
            padding: 8px 16px;
            font: 500 0.68rem/1 JetBrains Mono, ui-monospace, monospace;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }

          .hero__eyebrow > svg,
          .section-kicker > span {
            width: 14px;
            height: 14px;
            flex: 0 0 auto;
          }

          .hero__eyebrow > svg {
            color: var(--mint);
          }

          .section-kicker > span {
            border-radius: 999px;
            background: var(--mint);
            box-shadow: 0 0 12px rgba(99, 230, 194, 0.65);
          }

          .hero__brandline {
            margin-top: 28px;
            color: rgba(226, 236, 245, 0.56);
            font: 500 0.75rem/1 JetBrains Mono, ui-monospace, monospace;
            letter-spacing: 0.32em;
            text-transform: uppercase;
          }

          .hero__title,
          .section-title,
          .cta-title {
            font-family: Space Grotesk, system-ui, sans-serif;
            font-size: clamp(1.875rem, 4vw, 2.75rem);
            font-weight: 600;
            line-height: 1.1;
            color: var(--alice);
            margin: 0 auto;
            max-width: 640px;
          }

          .hero__title {
            margin: 20px 0 0;
            font-size: clamp(1.75rem, 3.6vw, 3.5rem);
            line-height: 1.08;
            letter-spacing: -0.03em;
            max-width: 18ch;
          }

          .hero__copy,
          .section-copy,
          .cta-copy {
            color: rgba(226, 236, 245, 0.78);
            line-height: 1.8;
          }

          .hero__copy {
            margin-top: 24px;
            max-width: 38rem;
            font-size: 1.0625rem;
            text-align: center;
          }

          .hero__actions,
          .cta-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
            margin-top: 36px;
          }

          .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 48px;
            padding: 0 28px;
            border-radius: 999px;
            font: 600 0.875rem/1 Inter, system-ui, sans-serif;
            text-decoration: none;
            transition: 180ms ease;
          }

          .button:hover {
            transform: translateY(-2px);
          }

          .button--primary {
            background: linear-gradient(135deg, #6A4DD4, #6E3377);
            color: var(--alice);
            box-shadow: 0 10px 30px rgba(106, 77, 212, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.16);
          }

          .button--secondary {
            border: 1px solid rgba(226, 236, 245, 0.16);
            background: rgba(226, 236, 245, 0.045);
            color: var(--alice);
          }

          .stats-strip {
            position: relative;
            z-index: 10;
            margin: -16px auto 0;
            max-width: 80rem;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            overflow: hidden;
            border: 1px solid rgba(226, 236, 245, 0.12);
            border-radius: 8px;
            background: linear-gradient(180deg, rgba(8, 10, 48, 0.62), rgba(2, 4, 20, 0.34));
            box-shadow: 0 24px 90px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.07);
            backdrop-filter: blur(24px);
          }

          @media (min-width: 768px) {
            .stats-strip {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }
          }

          .stats-strip__item {
            padding: 24px;
            text-align: center;
            border-right: 1px solid rgba(226, 236, 245, 0.08);
            border-bottom: 1px solid rgba(226, 236, 245, 0.08);
          }

          .stats-strip__item:nth-child(2n) {
            border-right: 0;
          }

          @media (min-width: 768px) {
            .stats-strip__item,
            .stats-strip__item:nth-child(2n) {
              border-bottom: 0;
              border-right: 1px solid rgba(226, 236, 245, 0.08);
            }

            .stats-strip__item:last-child {
              border-right: 0;
            }
          }

          .stats-strip__value {
            font-family: Space Grotesk, system-ui, sans-serif;
            font-size: 2.25rem;
            font-weight: 600;
            color: var(--alice);
          }

          .stats-strip__label {
            margin-top: 8px;
            color: rgba(226, 236, 245, 0.62);
            font: 500 0.62rem/1 JetBrains Mono, ui-monospace, monospace;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .section {
            padding: 96px 20px 0;
          }

          .section__header {
            max-width: 48rem;
            margin: 0 auto;
            text-align: center;
          }

          .section-title {
            margin: 20px auto 0;
            font-size: clamp(2.25rem, 4vw, 4rem);
          }

          .section-copy {
            margin-top: 24px;
            font-size: 1.125rem;
          }

          .statement-list,
          .feature-grid,
          .flow-grid,
          .usecase-grid {
            margin-top: 48px;
            display: grid;
            gap: 16px;
          }

          .statement-card,
          .feature-card,
          .flow-card,
          .usecase-card {
            border-radius: 8px;
            border: 1px solid rgba(226, 236, 245, 0.12);
            background: linear-gradient(180deg, rgba(8, 10, 48, 0.68), rgba(2, 4, 20, 0.42));
            backdrop-filter: blur(18px);
          }

          .statement-list {
            max-width: 48rem;
            margin-left: auto;
            margin-right: auto;
          }

          .statement-card {
            padding: 20px;
            font-family: Space Grotesk, system-ui, sans-serif;
            font-size: 1.25rem;
            font-weight: 500;
          }

          .statement-card--bad {
            border-left: 4px solid var(--velvet);
            background: linear-gradient(90deg, rgba(110, 51, 119, 0.16), rgba(8, 10, 48, 0.34));
          }

          .statement-card--good {
            border-left: 4px solid var(--majorelle);
            background: linear-gradient(90deg, rgba(106, 77, 212, 0.17), rgba(8, 10, 48, 0.34));
          }

          .section-punch {
            margin-top: 48px;
            text-align: center;
            font-family: Space Grotesk, system-ui, sans-serif;
            font-size: clamp(2rem, 3.5vw, 3.5rem);
            font-weight: 600;
            color: var(--alice);
          }

          .feature-grid {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }

          @media (min-width: 768px) {
            .feature-grid,
            .flow-grid,
            .usecase-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (min-width: 1024px) {
            .flow-grid,
            .usecase-grid {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }
          }

          .feature-card,
          .flow-card,
          .usecase-card {
            padding: 28px;
          }

          .feature-icon {
            margin-bottom: 24px;
            display: grid;
            height: 44px;
            width: 44px;
            place-items: center;
            border-radius: 8px;
            border: 1px solid rgba(226, 236, 245, 0.14);
            background: linear-gradient(135deg, rgba(99, 230, 194, 0.18), rgba(106, 77, 212, 0.22));
            color: var(--alice);
          }

          .feature-title,
          .flow-title,
          .usecase-title {
            font-family: Space Grotesk, system-ui, sans-serif;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--alice);
          }

          .feature-copy,
          .flow-copy {
            margin-top: 12px;
            color: rgba(226, 236, 245, 0.72);
            line-height: 1.75;
            font-size: 0.95rem;
          }

          .flow-step {
            font-family: Space Grotesk, system-ui, sans-serif;
            font-size: 3rem;
            font-weight: 700;
            line-height: 1;
            background: linear-gradient(110deg, var(--mint) 0%, var(--wisteria) 23%, var(--majorelle) 56%, var(--rose) 82%, var(--amber) 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .flow-ico {
            margin-top: 24px;
            display: inline-grid;
            height: 40px;
            width: 40px;
            place-items: center;
            border-radius: 8px;
            border: 1px solid rgba(226, 236, 245, 0.14);
            background: rgba(226, 236, 245, 0.05);
            color: var(--mint);
          }

          .usecase-card {
            padding: 24px;
          }

          .usecase-bar {
            height: 2px;
            width: 40px;
            margin-bottom: 20px;
            background: linear-gradient(90deg, #63E6C2, #6A4DD4, #6E3377);
          }

          .cta-shell {
            position: relative;
            margin: 0 auto 64px;
            overflow: hidden;
            border-radius: 8px;
            border: 1px solid rgba(226, 236, 245, 0.18);
            background: linear-gradient(135deg, rgba(110, 51, 119, 0.9), rgba(106, 77, 212, 0.92) 56%, rgba(99, 230, 194, 0.72) 140%);
            padding: 64px 24px;
            text-align: center;
            box-shadow: 0 36px 100px rgba(0, 0, 0, 0.34), 0 24px 70px rgba(106, 77, 212, 0.24);
          }

          .cta-grid {
            position: absolute;
            inset: 0;
            background:
              linear-gradient(90deg, rgba(255,255,255,0.12) 0 1px, transparent 1px),
              linear-gradient(rgba(255,255,255,0.1) 0 1px, transparent 1px);
            background-size: 58px 58px;
            mask-image: linear-gradient(90deg, transparent, black 20%, black 80%, transparent);
            opacity: 0.28;
            pointer-events: none;
          }

          .cta-copy {
            margin: 20px auto 0;
            max-width: 42rem;
          }

          @keyframes shimmer {
            from { background-position: -200% center; }
            to   { background-position: 200% center; }
          }

          @keyframes ring-turn {
            to { transform: rotate(360deg); }
          }

          @keyframes float-card {
            0%, 100% { transform: translateY(0); opacity: 0.72; }
            50% { transform: translateY(-14px); opacity: 0.96; }
          }

          @keyframes data-plane {
            from { background-position: 0 0, 0 0; }
            to { background-position: 220px 0, 0 44px; }
          }

          @keyframes signal-field-shift {
            0%   { transform: translate3d(-3%, -2%, 0) rotate(0deg) scale(1); }
            100% { transform: translate3d(4%, 3%, 0) rotate(8deg) scale(1.06); }
          }

          @keyframes signal-scan {
            from { background-position: 0 0, 0 0; }
            to { background-position: 260px 0, 0 0; }
          }

          @keyframes logo-spin {
            to { transform: rotate(360deg); }
          }

          .signal-field::before,
          .signal-field::after {
            content: '';
            position: absolute;
            inset: -18%;
          }

          .signal-field::before {
            background:
              conic-gradient(from 130deg at 45% 38%, transparent 0 20%, rgba(106, 77, 212, 0.44) 27%, transparent 36% 52%, rgba(99, 230, 194, 0.18) 58%, transparent 66% 82%, rgba(110, 51, 119, 0.34) 90%, transparent 100%);
            filter: blur(76px);
            opacity: 0.55;
            animation: signal-field-shift 24s ease-in-out infinite alternate;
          }

          .signal-field::after {
            inset: 0;
            background:
              linear-gradient(115deg, transparent 0 24%, rgba(164, 167, 227, 0.08) 24.5%, transparent 25% 58%, rgba(99, 230, 194, 0.08) 58.5%, transparent 59%),
              linear-gradient(180deg, transparent, rgba(0, 2, 41, 0.72));
            opacity: 0.55;
            animation: signal-scan 11s linear infinite;
          }

          @media (max-width: 760px) {
            .hero {
              padding-top: 96px;
            }

            .hero__title {
              font-size: clamp(2.5rem, 12vw, 3.8rem);
              max-width: 12ch;
            }

            .hero__copy {
              max-width: 100%;
            }

            .hero-visual {
              min-height: 360px;
            }

            .signal-chip {
              display: none;
            }
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">
        <WalletProvider>
          <TopNav />
          <main className="flex-1">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
