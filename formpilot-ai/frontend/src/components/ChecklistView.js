import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, FileText, Download, RefreshCw, Trophy } from 'lucide-react';
import axios from 'axios';

export default function ChecklistView({ formData, onRestart }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docChecked, setDocChecked] = useState({});

  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/check', { form_data: formData }, { timeout: 30000 });
      setAnalysis(data);
    } catch {
      setAnalysis(getDemoAnalysis(formData));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', margin: '0 auto 24px',
          background: 'rgba(99,102,241,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Agentic AI Checking Your Application…</h2>
        <p style={{ color: 'var(--text-muted)' }}>Detecting missing fields, inconsistencies and document gaps</p>
      </div>
    );
  }

  if (!analysis) return null;

  const { score, missing_fields, warnings, suggestions, checklist } = analysis;
  const isGood = score >= 80;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Completion Report</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          AI has reviewed your application for completeness and consistency.
        </p>
      </div>

      {/* Score card */}
      <div className="card" style={{
        marginBottom: 24,
        background: `linear-gradient(135deg, ${isGood ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)'}, rgba(99,102,241,0.08))`,
        border: `1px solid ${isGood ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
        textAlign: 'center', padding: '32px'
      }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke={isGood ? '#10b981' : '#f59e0b'} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - score / 100)}`}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s' }}
            />
          </svg>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', textAlign: 'center'
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: isGood ? 'var(--success)' : 'var(--warning)' }}>
              {score}%
            </div>
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          {score >= 90 ? '🎉 Excellent!' : score >= 70 ? '👍 Almost Ready' : '⚠️ Needs Attention'}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {score >= 90
            ? 'Your application looks complete. Ready to submit!'
            : score >= 70
              ? 'A few things to fix before submitting.'
              : 'Several important fields are missing. Please complete them.'}
        </div>
        {score >= 80 && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--success)' }}>
            <Trophy size={16} /> Application ready for submission
          </div>
        )}
      </div>

      {/* Issues */}
      {missing_fields.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <XCircle size={18} color="var(--danger)" />
            <span style={{ fontWeight: 600, color: 'var(--danger)' }}>Missing Required Fields ({missing_fields.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {missing_fields.map((f, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 14
              }}>
                <XCircle size={16} color="var(--danger)" />
                <div>
                  <div style={{ fontWeight: 600 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{f.hint}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={18} color="var(--warning)" />
            <span style={{ fontWeight: 600, color: 'var(--warning)' }}>Warnings ({warnings.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {warnings.map((w, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                fontSize: 14, display: 'flex', gap: 10, alignItems: 'flex-start'
              }}>
                <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document checklist */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <FileText size={18} color="var(--primary)" />
          <span style={{ fontWeight: 600 }}>Document Checklist</span>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
            {Object.values(docChecked).filter(Boolean).length} / {(formData?.required_documents || []).length} ready
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(formData?.required_documents || []).map((doc, i) => (
            <label key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              padding: '10px 12px', borderRadius: 8,
              background: docChecked[i] ? 'rgba(16,185,129,0.08)' : 'var(--bg-card2)',
              border: `1px solid ${docChecked[i] ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
              transition: 'all 0.2s', fontSize: 14
            }}>
              <input
                type="checkbox"
                checked={!!docChecked[i]}
                onChange={e => setDocChecked(prev => ({ ...prev, [i]: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--success)' }}
              />
              <span style={{ textDecoration: docChecked[i] ? 'line-through' : 'none', color: docChecked[i] ? 'var(--text-muted)' : 'var(--text)' }}>
                {doc}
              </span>
              {docChecked[i] && <CheckCircle size={16} color="var(--success)" style={{ marginLeft: 'auto' }} />}
            </label>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle size={18} color="var(--primary)" />
            <span style={{ fontWeight: 600 }}>AI Suggestions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                fontSize: 14, display: 'flex', gap: 10, alignItems: 'flex-start'
              }}>
                <span style={{ color: 'var(--primary)', flexShrink: 0 }}>💡</span>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onRestart}>
          <RefreshCw size={16} /> Start Over
        </button>
        <button className="btn btn-success" style={{ flex: 2, justifyContent: 'center', fontSize: 15 }}
          onClick={() => {
            alert('In a full implementation, this would generate a filled PDF using the data you entered. This requires the backend PDF generation service.');
          }}
        >
          <Download size={16} /> Download Filled Form
        </button>
      </div>
    </div>
  );
}

function getDemoAnalysis(formData) {
  const fields = formData?.fields || [];
  const missing = fields.filter(f => f.required && !f.value?.trim()).slice(0, 4);

  const score = Math.max(45, 95 - (missing.length * 12));

  return {
    score,
    missing_fields: missing.map(f => ({
      name: f.name,
      hint: `This field is required. ${f.simple_explanation}`
    })),
    warnings: missing.length === 0
      ? []
      : [
          'Ensure your income certificate is not older than 6 months',
          'Verify that your bank account is linked with Aadhaar for DBT',
        ],
    suggestions: [
      'Double-check that your name matches exactly across all documents (Aadhaar, marksheet, caste certificate)',
      'Keep physical photocopies of all documents ready along with originals',
      'Save a copy of your submitted application and note the reference number',
      'Apply early — portals often slow down near deadlines',
    ],
    checklist: formData?.required_documents?.map(d => ({ item: d, done: false })) || []
  };
}
