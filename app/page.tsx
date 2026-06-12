import Link from 'next/link';
import {
  ArrowRight,
  BrainCircuit,
  FileCheck2,
  GitBranch,
  Network,
  LockKeyhole,
  Scale,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const stats = [
  { value: '50+',    label: 'Risk signals evaluated' },
  { value: '89%',    label: 'Consensus confidence' },
  { value: '1,200+', label: 'Assessments simulated' },
  { value: '3.2s',   label: 'Avg evaluation time' },
];

const features = [
  { icon: BrainCircuit, title: 'Intelligent Underwriting',  text: 'Assess repayment potential through context, behavior, cash-flow quality, and financial patterns.' },
  { icon: GitBranch,    title: 'Decentralized Consensus',   text: 'Multiple GenLayer validators independently reason over the same evidence before a verdict is stored.' },
  { icon: ShieldCheck,  title: 'Explainable Decisions',     text: 'Every recommendation includes confidence, risk level, repayment probability, and transparent reasoning.' },
  { icon: Scale,        title: 'Dynamic Reputation',        text: 'Borrower reputation evolves from public verdicts, appeals, and repayment-facing credit history.' },
];

const flow = [
  { icon: LockKeyhole, title: 'Commit Evidence',    text: 'Borrowers submit a hash first — keeping evidence private until reveal.' },
  { icon: FileCheck2,  title: 'Reveal & Verify',    text: 'Sanitised evidence is revealed and checked against the original commitment.' },
  { icon: BrainCircuit,title: 'GenLayer Review',    text: 'Validators evaluate business context, repayment behaviour, and risk signals.' },
  { icon: Network,     title: 'Consensus Verdict',  text: 'Independent evaluations converge into an explainable, on-chain credit opinion.' },
];

const useCases = [
  'Small business lending',
  'Onchain credit reports',
  'Emerging-market underwriting',
  'Alternative borrower assessment',
];

export default function HomePage() {
  return (
    <div className="home-shell">
      <div className="signal-field" aria-hidden="true" />

      {/* ── Hero ── */}
      <section className="hero">
        {/* Halo rings */}
        <div className="hero-halo" aria-hidden="true" />
        <div className="trust-ring" aria-hidden="true" />
        <div className="trust-ring trust-ring-inner" aria-hidden="true" />

        {/* Floating signal chips */}
        <div className="signal-chip signal-chip-a" aria-hidden="true">
          <span>Revenue consistency</span>
          <strong>+18% signal</strong>
        </div>
        <div className="signal-chip signal-chip-b" aria-hidden="true">
          <span>Consensus confidence</span>
          <strong>89% aligned</strong>
        </div>
        <div className="signal-chip signal-chip-c" aria-hidden="true">
          <span>Repayment behaviour</span>
          <strong>Stable trend</strong>
        </div>
        <div className="signal-chip signal-chip-d" aria-hidden="true">
          <span>Context layer</span>
          <strong>Verified</strong>
        </div>

        {/* Centred content */}
        <div className="hero__content">
          <div className="hero__eyebrow">
            <Zap className="h-3.5 w-3.5" />
            Built on GenLayer Intelligent Contracts
          </div>

          <p className="hero__brandline">Fiducia</p>

          <h1 className="hero__title">
            Private evidence.<br />
            <span className="gradient-text">Public trust.</span><br />
            Consensus-backed credit decisions.
          </h1>

          <p className="hero__copy">
            Fiducia is a GenLayer-native decentralized underwriting layer. Borrowers submit
            sanitised summaries, GenLayer validators produce holistic verdicts, and lenders
            review public credit reports.
          </p>

          <div className="hero__actions">
            <Link href="/borrower/create-case" className="button button--primary">
              Create credit case
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/lenders" className="button button--secondary">
              Explore lender reports
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="stats-strip" aria-label="Platform statistics">
        {stats.map((stat) => (
          <div key={stat.label} className="stats-strip__item">
            <p className="stats-strip__value">{stat.value}</p>
            <p className="stats-strip__label">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* ── Why traditional credit fails ── */}
      <section className="section" id="product">
        <div className="section__header">
          <div className="section-kicker">
            <span className="h-1.5 w-1.5 rounded-full bg-[#63E6C2] shadow-[0_0_12px_#63E6C2]" />
            The problem
          </div>
          <h2 className="section-title">Evaluate people, not just numbers.</h2>
          <p className="section-copy">
            Traditional systems evaluate people using a handful of fixed variables.
            But creditworthiness is more than a score.
          </p>
        </div>

        <div className="statement-list">
          <div className="statement-card statement-card--bad">
            A growing business can be rejected.
          </div>
          <div className="statement-card statement-card--good">
            A risky borrower can be approved.
          </div>
        </div>

        <p className="section-punch">
          The problem is not data.
          <span className="gradient-text block">It is judgement.</span>
        </p>
      </section>

      {/* ── Features ── */}
      <section className="section">
        <div className="section__header">
          <div className="section-kicker">
            <span className="h-1.5 w-1.5 rounded-full bg-[#63E6C2] shadow-[0_0_12px_#63E6C2]" />
            Product
          </div>
          <h2 className="section-title">Built for context.</h2>
        </div>

        <div className="feature-grid">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="feature-card">
                <div className="feature-icon"><Icon className="h-5 w-5" /></div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-copy">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section" id="how">
        <div className="section__header">
          <div className="section-kicker">
            <span className="h-1.5 w-1.5 rounded-full bg-[#63E6C2] shadow-[0_0_12px_#63E6C2]" />
            How it works
          </div>
          <h2 className="section-title">From evidence to decision.</h2>
        </div>

        <div className="flow-grid">
          {flow.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flow-card">
                <div className="flow-step">0{i + 1}</div>
                <div className="flow-ico"><Icon className="h-5 w-5" /></div>
                <h3 className="flow-title">{step.title}</h3>
                <p className="flow-copy">{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="section" id="use-cases">
        <div className="section__header">
          <div className="section-kicker">
            <span className="h-1.5 w-1.5 rounded-full bg-[#63E6C2] shadow-[0_0_12px_#63E6C2]" />
            Use cases
          </div>
          <h2 className="section-title">Where Fiducia fits.</h2>

        </div>

        <div className="usecase-grid">
          {useCases.map((item) => (
            <div key={item} className="usecase-card">
              <div className="usecase-bar" />
              <p className="usecase-title">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="cta-shell" id="about">
        <div className="cta-grid" aria-hidden="true" />
        <div className="relative">
          <h2 className="cta-title">Private evidence. Public trust.</h2>
          <p className="cta-copy">
            Start with a real borrower case, trigger GenLayer consensus, and turn evidence into
            an explainable credit verdict.
          </p>
          <div className="hero__actions" style={{ marginTop: '32px' }}>
            <Link href="/borrower/create-case" className="button button--primary">
              Launch Fiducia
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
