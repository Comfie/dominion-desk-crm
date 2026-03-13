'use client';

import { useState } from 'react';
import { Building2, Bell, BarChart3, CheckCircle, Loader2, ArrowRight } from 'lucide-react';

export default function EarlyAccessPage() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong.');
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  const features = [
    {
      icon: Bell,
      title: 'Automated Rent Reminders',
      description:
        'Stop chasing tenants. Smart reminders fire before and after every due date — automatically.',
      iconColor: '#F59E0B',
      glowRgb: '245, 158, 11',
    },
    {
      icon: Building2,
      title: 'Tenant Portal & Payments',
      description:
        'Tenants upload proof of payment. You get notified instantly. No more WhatsApp back-and-forth.',
      iconColor: '#0EA5E9',
      glowRgb: '14, 165, 233',
    },
    {
      icon: BarChart3,
      title: 'Financial Reports & Tax',
      description:
        'Income, expenses, and tax-ready reports across your entire portfolio — ready in seconds.',
      iconColor: '#8B5CF6',
      glowRgb: '139, 92, 246',
    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes orbDrift1 {
          0%,100% { transform: translate(0,0)   scale(1);    }
          40%     { transform: translate(-28px,22px)  scale(1.06); }
          70%     { transform: translate(18px,-20px) scale(0.97); }
        }
        @keyframes orbDrift2 {
          0%,100% { transform: translate(0,0)   scale(1);    }
          35%     { transform: translate(24px,-18px) scale(1.04); }
          65%     { transform: translate(-16px,28px) scale(0.98); }
        }
        @keyframes pulseDot {
          0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.6); }
          50%     { box-shadow: 0 0 0 5px rgba(52,211,153,0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes successPop {
          0%   { opacity:0; transform: scale(0.82) translateY(12px); }
          68%  { transform: scale(1.04) translateY(-2px); }
          100% { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmerSlide {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0;  }
        }

        /* ---- component-scoped utilities ---- */
        .ea-orb-1 { animation: orbDrift1 20s ease-in-out infinite; }
        .ea-orb-2 { animation: orbDrift2 25s ease-in-out infinite; }
        .ea-pulse  { animation: pulseDot 2.2s ease-in-out infinite; }

        .ea-badge    { animation: fadeUp .6s ease .10s both; }
        .ea-headline { animation: fadeUp .7s ease .25s both; }
        .ea-sub      { animation: fadeUp .7s ease .40s both; }
        .ea-form     { animation: fadeUp .7s ease .55s both; }
        .ea-note     { animation: fadeUp .6s ease .68s both; }
        .ea-feat-0   { animation: fadeUp .7s ease .10s both; }
        .ea-feat-1   { animation: fadeUp .7s ease .25s both; }
        .ea-feat-2   { animation: fadeUp .7s ease .40s both; }
        .ea-cta      { animation: fadeUp .7s ease .10s both; }

        .ea-nav-glass {
          background: rgba(4,4,14,.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,.055);
        }
        .ea-form-card {
          background: rgba(255,255,255,.032);
          border: 1px solid rgba(255,255,255,.08);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .ea-input {
          background: rgba(255,255,255,.045);
          border: 1px solid rgba(255,255,255,.09);
          color: rgba(255,255,255,.9);
          transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
          width: 100%;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 14px;
          outline: none;
        }
        .ea-input::placeholder { color: rgba(255,255,255,.28); }
        .ea-input:focus {
          background: rgba(255,255,255,.07);
          border-color: rgba(14,165,233,.55);
          box-shadow: 0 0 0 4px rgba(14,165,233,.09), 0 0 22px rgba(14,165,233,.12);
        }

        .ea-btn {
          background: linear-gradient(110deg, #0ea5e9 0%, #2563eb 45%, #7c3aed 75%, #2563eb 88%, #0ea5e9 100%);
          background-size: 400px 100%;
          transition: background-position .55s ease, transform .15s ease, box-shadow .15s ease;
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          border: none;
          border-radius: 12px;
          padding: 14px 20px;
          width: 100%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .ea-btn:hover:not(:disabled) {
          background-position: -180px 0;
          transform: translateY(-2px);
          box-shadow: 0 10px 36px rgba(14,165,233,.38), 0 4px 14px rgba(0,0,0,.4);
        }
        .ea-btn:active:not(:disabled) { transform: translateY(0); }
        .ea-btn:disabled { opacity: .55; cursor: not-allowed; }

        .ea-feat-card {
          background: rgba(255,255,255,.028);
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 20px;
          padding: 28px;
          position: relative;
          overflow: hidden;
          transition: background .3s ease, border-color .3s ease, transform .3s ease, box-shadow .3s ease;
        }
        .ea-feat-card:hover {
          background: rgba(255,255,255,.055);
          border-color: rgba(255,255,255,.13);
          transform: translateY(-5px);
          box-shadow: 0 24px 64px rgba(0,0,0,.55);
        }

        .ea-cta-strip {
          background: linear-gradient(135deg, rgba(14,165,233,.25), rgba(99,102,241,.22), rgba(139,92,246,.12));
          border-radius: 24px;
          padding: 1px;
        }
        .ea-cta-inner {
          background: rgba(8,8,22,.96);
          border-radius: 23px;
        }

        .ea-nav-cta {
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.11);
          color: rgba(255,255,255,.82);
          border-radius: 50px;
          padding: 7px 16px;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          transition: background .2s ease, border-color .2s ease, gap .2s ease;
        }
        .ea-nav-cta:hover {
          background: rgba(255,255,255,.12);
          border-color: rgba(255,255,255,.2);
          gap: 10px;
        }

        .ea-success { animation: successPop .5s cubic-bezier(.34,1.56,.64,1) both; }

        .ea-gradient-text {
          background: linear-gradient(180deg, rgba(255,255,255,.97) 0%, rgba(255,255,255,.62) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ea-accent-text {
          background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 55%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div
        style={{
          backgroundColor: '#05050F',
          color: '#fff',
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
        }}
      >
        {/* ── Background canvas ──────────────────── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {/* Amber orb — top-left */}
          <div
            className="ea-orb-1"
            style={{
              position: 'absolute',
              top: '-160px',
              left: '-120px',
              width: '640px',
              height: '640px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,158,11,.10) 0%, transparent 70%)',
              filter: 'blur(48px)',
            }}
          />
          {/* Indigo orb — bottom-right */}
          <div
            className="ea-orb-2"
            style={{
              position: 'absolute',
              bottom: '-160px',
              right: '-80px',
              width: '720px',
              height: '720px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,.13) 0%, transparent 70%)',
              filter: 'blur(56px)',
            }}
          />
          {/* Stage light — centre */}
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '900px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(14,165,233,.055) 0%, transparent 70%)',
              filter: 'blur(70px)',
            }}
          />
          {/* Dot grid */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,.055) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
        </div>

        {/* ── Sticky nav ─────────────────────────── */}
        <nav
          className="ea-nav-glass"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            width: '100%',
          }}
        >
          <div
            style={{
              maxWidth: '1120px',
              margin: '0 auto',
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Building2 size={15} color="#fff" />
              </div>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,.9)',
                  letterSpacing: '-0.02em',
                }}
              >
                DominionDesk
              </span>
            </div>

            <a href="#apply" className="ea-nav-cta">
              Early Access
              <ArrowRight size={13} />
            </a>
          </div>
        </nav>

        {/* ── Hero ───────────────────────────────── */}
        <section
          style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '1120px',
            margin: '0 auto',
            padding: '112px 24px 128px',
            textAlign: 'center',
          }}
        >
          {/* Live badge */}
          <div
            className="ea-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(52,211,153,.08)',
              border: '1px solid rgba(52,211,153,.22)',
              borderRadius: '50px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#34D399',
              letterSpacing: '0.04em',
              marginBottom: '36px',
            }}
          >
            <span
              className="ea-pulse"
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#34D399',
                flexShrink: 0,
              }}
            />
            NOW ACCEPTING APPLICATIONS · LIMITED BETA
          </div>

          {/* Headline */}
          <h1
            className="ea-headline ea-gradient-text"
            style={{
              fontSize: 'clamp(52px, 9vw, 96px)',
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-0.035em',
              marginBottom: '28px',
              maxWidth: '760px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Your property.
            <br />
            <span className="ea-accent-text">Managed.</span>
          </h1>

          {/* Sub */}
          <p
            className="ea-sub"
            style={{
              fontSize: '17px',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,.42)',
              maxWidth: '480px',
              margin: '0 auto 56px',
              letterSpacing: '-0.01em',
            }}
          >
            The property management platform built for South African landlords. Automate rent,
            manage tenants, and own your finances.
          </p>

          {/* Form */}
          <div id="apply" className="ea-form" style={{ maxWidth: '360px', margin: '0 auto' }}>
            {status === 'success' ? (
              <div
                className="ea-success ea-form-card"
                style={{
                  borderRadius: '24px',
                  padding: '44px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg,rgba(52,211,153,.18),rgba(16,185,129,.08))',
                    border: '1px solid rgba(52,211,153,.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle size={28} color="#34D399" />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: '17px',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,.92)',
                      marginBottom: '6px',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    You&apos;re on the list.
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.38)', lineHeight: 1.5 }}>
                    We&apos;ll reach out with your early access details soon.
                  </p>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="ea-form-card"
                style={{
                  borderRadius: '24px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <input
                  type="text"
                  placeholder="Your name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="ea-input"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="ea-input"
                />

                {errorMsg && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#F87171',
                      background: 'rgba(248,113,113,.08)',
                      border: '1px solid rgba(248,113,113,.2)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      textAlign: 'left',
                    }}
                  >
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="ea-btn"
                  style={{ marginTop: '4px' }}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      Submitting…
                    </>
                  ) : (
                    <>
                      Request Early Access
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            )}

            <p
              className="ea-note"
              style={{
                marginTop: '18px',
                fontSize: '10px',
                letterSpacing: '0.06em',
                color: 'rgba(255,255,255,.22)',
              }}
            >
              FREE DURING BETA &nbsp;·&nbsp; NO CREDIT CARD &nbsp;·&nbsp; SA LANDLORDS
            </p>
          </div>
        </section>

        {/* ── Features ───────────────────────────── */}
        <section
          style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '1120px',
            margin: '0 auto',
            padding: '0 24px 112px',
          }}
        >
          {/* Section label */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'rgba(14,165,233,.65)',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}
            >
              Built for landlords
            </p>
            <h2
              className="ea-gradient-text"
              style={{
                fontSize: 'clamp(26px, 4vw, 38px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                maxWidth: '500px',
                margin: '0 auto',
              }}
            >
              Everything you need to run your portfolio
            </h2>
          </div>

          {/* Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '18px',
            }}
          >
            {features.map((f, i) => (
              <div key={f.title} className={`ea-feat-card ea-feat-${i}`}>
                {/* Inner corner glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-24px',
                    right: '-24px',
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, rgba(${f.glowRgb},.18) 0%, transparent 70%)`,
                    filter: 'blur(18px)',
                    pointerEvents: 'none',
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '13px',
                      background: `rgba(${f.glowRgb},.12)`,
                      border: `1px solid rgba(${f.glowRgb},.22)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px',
                    }}
                  >
                    <f.icon size={19} color={f.iconColor} />
                  </div>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,.88)',
                      marginBottom: '10px',
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.65,
                      color: 'rgba(255,255,255,.38)',
                    }}
                  >
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA strip ───────────────────── */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '1072px',
            margin: '0 auto 40px',
            padding: '0 24px',
          }}
        >
          <div className="ea-cta-strip ea-cta">
            <div
              className="ea-cta-inner"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                padding: '52px 32px',
                textAlign: 'center',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 'clamp(20px, 3vw, 26px)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: 'rgba(255,255,255,.9)',
                    marginBottom: '8px',
                  }}
                >
                  Be first. Shape the product.
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.35)', maxWidth: '400px' }}>
                  Beta members get lifetime founder pricing and direct access to the product team.
                </p>
              </div>
              <a
                href="#apply"
                className="ea-btn"
                style={{ width: 'auto', padding: '13px 28px', textDecoration: 'none' }}
              >
                Apply Now
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────── */}
        <footer
          style={{
            position: 'relative',
            zIndex: 10,
            borderTop: '1px solid rgba(255,255,255,.04)',
            padding: '32px 24px',
          }}
        >
          <div
            style={{
              maxWidth: '1120px',
              margin: '0 auto',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '7px',
                  background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={12} color="#fff" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,.45)' }}>
                DominionDesk
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.18)' }}>
                © {new Date().getFullYear()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {[
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
                { label: 'support@dominiondesk.com', href: 'mailto:support@dominiondesk.com' },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,.28)',
                    textDecoration: 'none',
                    transition: 'color .2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,.7)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,.28)')}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
