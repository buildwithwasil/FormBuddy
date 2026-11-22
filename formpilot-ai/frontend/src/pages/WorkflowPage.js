import React, { useState } from 'react';
import { ArrowLeft, FileText, Brain, Mic, CheckCircle, ChevronRight } from 'lucide-react';
import UploadStep from '../components/UploadStep';
import ExtractionView from '../components/ExtractionView';
import FieldExplainer from '../components/FieldExplainer';
import VoiceAssistant from '../components/VoiceAssistant';
import ChecklistView from '../components/ChecklistView';

const STEPS = [
  { id: 'upload', label: 'Upload Form', icon: FileText },
  { id: 'extract', label: 'AI Reads Form', icon: Brain },
  { id: 'explain', label: 'Field Guide', icon: ChevronRight },
  { id: 'voice', label: 'Voice Assistant', icon: Mic },
  { id: 'checklist', label: 'Completion Check', icon: CheckCircle },
];

export default function WorkflowPage({ onBack, sessionData, setSessionData }) {
  const [currentStep, setCurrentStep] = useState('upload');
  const [formData, setFormData] = useState(null); // extracted form data from backend

  const stepIdx = STEPS.findIndex(s => s.id === currentStep);

  const handleUploadComplete = (data) => {
    setFormData(data);
    setCurrentStep('extract');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return <UploadStep onComplete={handleUploadComplete} />;
      case 'extract':
        return <ExtractionView formData={formData} onNext={() => setCurrentStep('explain')} />;
      case 'explain':
        return <FieldExplainer formData={formData} onNext={() => setCurrentStep('voice')} />;
      case 'voice':
        return <VoiceAssistant formData={formData} onNext={() => setCurrentStep('checklist')} />;
      case 'checklist':
        return <ChecklistView formData={formData} onRestart={() => { setFormData(null); setCurrentStep('upload'); }} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 32px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)', gap: 16
      }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ gap: 6 }}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 6,
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FileText size={16} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            Form<span style={{ color: 'var(--primary)' }}>Pilot</span> AI
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Step {stepIdx + 1} of {STEPS.length}
        </div>
      </nav>

      {/* Progress stepper */}
      <div style={{
        padding: '20px 32px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card2)',
        overflowX: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content', margin: '0 auto', maxWidth: 800 }}>
          {STEPS.map((step, idx) => {
            const isActive = step.id === currentStep;
            const isDone = idx < stepIdx;
            const isClickable = idx <= stepIdx;
            return (
              <React.Fragment key={step.id}>
                <div
                  onClick={() => isClickable && setCurrentStep(step.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    cursor: isClickable ? 'pointer' : 'default',
                    opacity: !isDone && !isActive ? 0.4 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: isActive ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--bg-card)',
                    border: `2px solid ${isActive ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s'
                  }}>
                    {isDone
                      ? <CheckCircle size={18} color="white" />
                      : <step.icon size={18} color={isActive ? 'white' : 'var(--text-muted)'} />
                    }
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap'
                  }}>{step.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, minWidth: 32, maxWidth: 80,
                    background: idx < stepIdx ? 'var(--success)' : 'var(--border)',
                    margin: '0 4px', marginBottom: 20, transition: 'background 0.3s'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {renderStep()}
      </div>
    </div>
  );
}
