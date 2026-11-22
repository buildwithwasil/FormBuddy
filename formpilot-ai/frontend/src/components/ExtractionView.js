import React, { useEffect, useState } from 'react';
import { Brain, FileText, Calendar, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';

export default function ExtractionView({ formData, onNext }) {
  const [animIdx, setAnimIdx] = useState(0);

  useEffect(() => {
    if (!formData) return;
    const total = formData.fields?.length || 0;
    if (animIdx < total) {
      const t = setTimeout(() => setAnimIdx(i => i + 1), 60);
      return () => clearTimeout(t);
    }
  }, [animIdx, formData]);

  if (!formData) return null;

  const { form_title, form_type, total_fields, deadline, fields, required_documents } = formData;

  const sectionGroups = fields.reduce((acc, f) => {
    if (!acc[f.section]) acc[f.section] = [];
    acc[f.section].push(f);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(6,182,212,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Brain size={22} color="#06b6d4" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Vision AI Read Your Form</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Here's what was extracted</p>
          </div>
        </div>
      </div>

      {/* Form summary card */}
      <div className="card" style={{
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.08))',
        border: '1px solid rgba(99,102,241,0.3)'
      }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>FORM DETECTED</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{form_title}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{form_type}</span>
              {deadline && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: '#fef3c7', color: '#92400e'
                }}>
                  <Calendar size={12} /> Deadline: {deadline}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { n: fields.length, label: 'Fields found' },
              { n: Object.keys(sectionGroups).length, label: 'Sections' },
              { n: required_documents.length, label: 'Documents' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>{s.n}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {Object.entries(sectionGroups).map(([section, sFields]) => (
          <div key={section} className="card" style={{ padding: 20 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 1,
              color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12
            }}>{section}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sFields.map((field, idx) => {
                const globalIdx = fields.findIndex(f => f.id === field.id);
                const visible = globalIdx < animIdx;
                return (
                  <div key={field.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-10px)',
                    transition: 'all 0.3s'
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: field.required ? 'var(--primary)' : 'var(--text-muted)',
                      flexShrink: 0
                    }} />
                    <span style={{ fontSize: 14 }}>{field.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {field.type}
                    </span>
                    {field.required && (
                      <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>required</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Required documents */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <FileText size={18} color="var(--warning)" />
          <span style={{ fontWeight: 600 }}>Required Documents</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {required_documents.map((doc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <CheckCircle size={16} color="var(--warning)" />
              {doc}
            </div>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16 }}
        onClick={onNext}
      >
        Understand Each Field <ChevronRight size={18} />
      </button>
    </div>
  );
}
