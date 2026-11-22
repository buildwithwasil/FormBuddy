import React, { useState } from 'react';
import { ChevronRight, ChevronDown, ChevronUp, Lightbulb, HelpCircle, CheckCircle } from 'lucide-react';

export default function FieldExplainer({ formData, onNext }) {
  const [activeField, setActiveField] = useState(0);
  const [fieldValues, setFieldValues] = useState({});
  const [expanded, setExpanded] = useState({});

  if (!formData) return null;
  const { fields } = formData;

  const handleValueChange = (fieldId, value) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const filledCount = Object.values(fieldValues).filter(v => v && v.toString().trim()).length;

  const sectionGroups = fields.reduce((acc, f) => {
    if (!acc[f.section]) acc[f.section] = [];
    acc[f.section].push(f);
    return acc;
  }, {});

  const renderInput = (field) => {
    const val = fieldValues[field.id] || field.value || '';
    const baseStyle = {
      width: '100%', padding: '10px 14px', borderRadius: 8,
      background: 'var(--bg)', border: '1px solid var(--border)',
      color: 'var(--text)', fontSize: 14, marginTop: 8, outline: 'none',
    };
    const focusStyle = { borderColor: 'var(--primary)' };

    if (field.type === 'select') {
      return (
        <select
          value={val}
          onChange={e => handleValueChange(field.id, e.target.value)}
          style={{ ...baseStyle, appearance: 'none' }}
        >
          <option value="">Select…</option>
          {(field.options || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    if (field.type === 'textarea') {
      return (
        <textarea
          value={val}
          onChange={e => handleValueChange(field.id, e.target.value)}
          placeholder={field.example}
          rows={3}
          style={{ ...baseStyle, resize: 'vertical' }}
        />
      );
    }
    return (
      <input
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'tel' ? 'tel' : 'text'}
        value={val}
        onChange={e => handleValueChange(field.id, e.target.value)}
        placeholder={field.example}
        style={baseStyle}
      />
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Field-by-Field Guide</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Every field explained in plain language. Fill them directly here.
        </p>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>Progress</span>
            <span>{filledCount} / {fields.length} fields filled</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: 'linear-gradient(90deg, var(--primary), #06b6d4)',
              width: `${(filledCount / fields.length) * 100}%`,
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
      </div>

      {/* Fields by section */}
      {Object.entries(sectionGroups).map(([section, sFields]) => (
        <div key={section} style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
            color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12,
            paddingLeft: 4, borderLeft: '3px solid var(--primary)', paddingRight: 4
          }}>{section}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sFields.map((field) => {
              const isExpanded = expanded[field.id];
              const val = fieldValues[field.id] || field.value || '';
              const isFilled = val && val.toString().trim();

              return (
                <div
                  key={field.id}
                  className="card"
                  style={{
                    padding: 0, overflow: 'hidden',
                    border: `1px solid ${isFilled ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
                    transition: 'border-color 0.2s'
                  }}
                >
                  {/* Field header */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', cursor: 'pointer',
                      background: isExpanded ? 'rgba(99,102,241,0.08)' : 'transparent'
                    }}
                    onClick={() => setExpanded(prev => ({ ...prev, [field.id]: !prev[field.id] }))}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: isFilled ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isFilled
                        ? <CheckCircle size={16} color="var(--success)" />
                        : <HelpCircle size={16} color="var(--primary)" />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{field.name}</span>
                        {field.required && (
                          <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 600 }}>*required</span>
                        )}
                      </div>
                      {!isExpanded && val && (
                        <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 2 }}>✓ {val}</div>
                      )}
                      {!isExpanded && !val && (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                          {field.simple_explanation.substring(0, 60)}…
                        </div>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                      {/* AI Explanation */}
                      <div style={{
                        display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 8,
                        background: 'rgba(99,102,241,0.08)', margin: '12px 0',
                        border: '1px solid rgba(99,102,241,0.2)'
                      }}>
                        <Lightbulb size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ fontSize: 14 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--primary)' }}>AI Explanation</div>
                          {field.simple_explanation}
                          {field.example && (
                            <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 13, color: 'var(--text-muted)' }}>
                              {field.example}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Original instruction */}
                      <div style={{
                        fontSize: 12, color: 'var(--text-muted)', marginBottom: 8,
                        fontStyle: 'italic'
                      }}>
                        Original: "{field.original_instruction}"
                      </div>

                      {/* Input */}
                      {renderInput(field)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16, marginTop: 8 }}
        onClick={onNext}
      >
        Ask the Voice Assistant <ChevronRight size={18} />
      </button>
    </div>
  );
}
