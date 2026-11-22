import React from 'react';
import { FileText, Mic, Brain, CheckCircle, Zap, Globe, ArrowRight, Sparkles } from 'lucide-react';

const features = [
  { icon: FileText, title: 'Upload Any Form', desc: 'PDF or photo — government, scholarship, visa, institutional forms', color: '#6366f1' },
  { icon: Brain, title: 'Vision AI Reads It', desc: 'Automatically extracts every field, instruction, checkbox and deadline', color: '#06b6d4' },
  { icon: Sparkles, title: 'Plain Language', desc: 'Confusing legal jargon translated to simple, friendly explanations', color: '#10b981' },
  { icon: Mic, title: 'Voice Assistant', desc: 'Ask questions in Kannada, Hindi or English — spoken answers', color: '#f59e0b' },
  { icon: CheckCircle, title: 'Completion Check', desc: 'AI spots missing fields, inconsistencies and required documents', color: '#ef4444' },
  { icon: Globe, title: 'Multilingual', desc: 'Supports ಕನ್ನಡ, हिंदी and English natively', color: '#8b5cf6' },
];

export default function LandingPage({ onStart }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 48px', borderBottom: '1px solid var(--border)',
        background: 'rgba(15,15,26,0.9)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FileText size={20} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>
            Form<span style={{ color: 'var(--primary)' }}>Pilot</span> AI
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 8 }}>
            Powered by IBM watsonx
          </span>
          <button className="btn btn-primary" onClick={onStart}>
            Try it now <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '80px 24px 60px',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 20,
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
          marginBottom: 24, fontSize: 13, color: 'var(--primary)'
        }}>
          <Zap size={14} /> Agentic AI · Vision AI · Voice AI
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800,
          lineHeight: 1.1, letterSpacing: '-2px', maxWidth: 800,
          marginBottom: 24
        }}>
          Never be confused<br />
          by a form <span style={{
            background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>again</span>
        </h1>

        <p style={{
          fontSize: 18, color: 'var(--text-muted)', maxWidth: 560,
          marginBottom: 40, lineHeight: 1.7
        }}>
          Upload any government, scholarship or visa form. FormPilot AI reads it,
          explains every field in plain language and guides you to completion —
          in Kannada, Hindi or English.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }} onClick={onStart}>
            Upload a Form <ArrowRight size={18} />
          </button>
          <button className="btn btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>
            Watch Demo
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 48, marginTop: 64, flexWrap: 'wrap', justifyContent: 'center'
        }}>
          {[
            { n: '50+', label: 'Form types supported' },
            { n: '3', label: 'Languages' },
            { n: '99%', label: 'Field detection accuracy' },
            { n: '<5s', label: 'Processing time' },
          ].map(s => (
            <div key={s.n} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>{s.n}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 48, letterSpacing: '-0.5px' }}>
          Every step of the journey, covered
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20
        }}>
          {features.map(f => (
            <div key={f.title} className="card" style={{
              display: 'flex', gap: 16, alignItems: 'flex-start',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: f.color + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <f.icon size={22} color={f.color} />
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section style={{
        padding: '60px 48px',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Built for real people</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 36 }}>
            From village scholarship applications to international visa forms
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['📋 Scholarship Applications', '🛂 Visa & Passport Forms', '🏥 Hospital Admission', '🎓 College Enrollment', '🏦 Bank Account Opening', '🏛️ Government Schemes'].map(tag => (
              <div key={tag} style={{
                padding: '10px 20px', borderRadius: 24,
                background: 'var(--bg-card2)', border: '1px solid var(--border)',
                fontSize: 14, fontWeight: 500
              }}>{tag}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
          Ready to pilot your next form?
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
          Upload a form in seconds. No account required.
        </p>
        <button className="btn btn-primary" style={{ fontSize: 16, padding: '14px 36px' }} onClick={onStart}>
          Get Started Free <ArrowRight size={18} />
        </button>
      </section>

      <footer style={{
        textAlign: 'center', padding: '20px',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)', fontSize: 13
      }}>
        FormPilot AI · IBM watsonx Hackathon 2024 · Vision AI + Agentic AI + Voice AI
      </footer>
    </div>
  );
}
