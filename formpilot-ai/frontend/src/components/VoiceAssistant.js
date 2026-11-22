import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Send, ChevronRight, Globe, Sparkles } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'en-IN', label: 'English', flag: '🇬🇧', name: 'English' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ', flag: '🇮🇳', name: 'Kannada' },
  { code: 'hi-IN', label: 'हिंदी', flag: '🇮🇳', name: 'Hindi' },
];

const SAMPLE_QUESTIONS = {
  'en-IN': [
    'What documents do I need?',
    'What should I enter for annual family income?',
    'What is the deadline for submission?',
    'Is Aadhaar card mandatory?',
    'What is the maximum income limit?',
  ],
  'kn-IN': [
    'ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?',
    'ವಾರ್ಷಿಕ ಆದಾಯ ಮಿತಿ ಎಷ್ಟು?',
    'ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಕೊನೆಯ ದಿನ ಯಾವುದು?',
    'ಆಧಾರ್ ಕಾರ್ಡ್ ಅಗತ್ಯವೇ?',
  ],
  'hi-IN': [
    'कौन से दस्तावेज़ चाहिए?',
    'वार्षिक आय की सीमा क्या है?',
    'आवेदन की अंतिम तिथि क्या है?',
    'आधार कार्ड जरूरी है क्या?',
  ],
};

export default function VoiceAssistant({ formData, onNext }) {
  const [lang, setLang] = useState('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! I'm FormPilot AI, your voice assistant for the ${formData?.form_title || 'form'}. 
Ask me anything about the form fields, required documents, or eligibility. 
You can speak in English, Kannada, or Hindi! 🎙️`,
      lang: 'en-IN'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser. Use Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
      setInputText(t);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error !== 'no-speech') toast.error('Mic error: ' + e.error);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const sendQuestion = async (question) => {
    const q = question || inputText;
    if (!q.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: q, lang }]);
    setInputText('');
    setTranscript('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/ask', {
        question: q,
        language: lang,
        form_data: formData,
      }, { timeout: 30000 });

      const answer = data.answer;
      setMessages(prev => [...prev, { role: 'assistant', text: answer, lang }]);
      speakText(answer);
    } catch {
      // Demo fallback
      const answer = getLocalAnswer(q, lang, formData);
      setMessages(prev => [...prev, { role: 'assistant', text: answer, lang }]);
      speakText(answer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Voice Assistant</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Ask anything about the form in English, Kannada or Hindi
        </p>
      </div>

      {/* Language selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            className={`btn ${lang === l.code ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
            onClick={() => setLang(l.code)}
          >
            {l.flag} {l.label}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="card" style={{
        padding: 0, marginBottom: 16, overflow: 'hidden',
        height: 340, display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card2)'
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--success)', boxShadow: '0 0 6px var(--success)'
          }} className="pulse" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>FormPilot AI Assistant</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            <Globe size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {LANGUAGES.find(l => l.code === lang)?.name}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginRight: 8, marginTop: 2,
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14
                }}>✦</div>
              )}
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card2)',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => speakText(msg.text)}
                    style={{ display: 'block', marginTop: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, padding: 0 }}
                  >
                    <Volume2 size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    Speak
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)',
                    animation: `pulse 1s ${i * 0.2}s infinite`
                  }} />
                ))}
              </div>
              Thinking…
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sample questions */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          <Sparkles size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          Quick questions:
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(SAMPLE_QUESTIONS[lang] || SAMPLE_QUESTIONS['en-IN']).map(q => (
            <button key={q} className="btn btn-secondary btn-sm"
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => sendQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={isListening ? stopListening : startListening}
          style={{
            width: 46, height: 46, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: isListening ? '#ef4444' : 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: isListening ? '0 0 0 6px rgba(239,68,68,0.2)' : 'none',
            cursor: 'pointer'
          }}
        >
          {isListening ? <MicOff size={20} color="white" /> : <Mic size={20} color="white" />}
        </button>
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendQuestion()}
          placeholder={isListening ? 'Listening…' : `Type or speak your question in ${LANGUAGES.find(l => l.code === lang)?.name}…`}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 24,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={() => sendQuestion()}
          disabled={!inputText.trim() || loading}
          className="btn btn-primary"
          style={{ borderRadius: 24, padding: '12px 20px' }}
        >
          <Send size={16} />
        </button>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16, marginTop: 20 }}
        onClick={onNext}
      >
        Check Completion <ChevronRight size={18} />
      </button>
    </div>
  );
}

function getLocalAnswer(question, lang, formData) {
  const q = question.toLowerCase();
  const title = formData?.form_title || 'this form';
  const docs = formData?.required_documents || [];
  const deadline = formData?.deadline;

  if (q.includes('document') || q.includes('ದಾಖಲ') || q.includes('दस्तावेज़') || q.includes('ಬೇಕು')) {
    const docList = docs.map((d, i) => `${i + 1}. ${d}`).join('\n');
    if (lang === 'kn-IN') return `${title} ಗಾಗಿ ಬೇಕಾದ ದಾಖಲೆಗಳು:\n\n${docList}\n\nಎಲ್ಲಾ ಮೂಲ ದಾಖಲೆಗಳು ಮತ್ತು ಒಂದು ಜೆರಾಕ್ಸ್ ಪ್ರತಿ ತನ್ನಿ.`;
    if (lang === 'hi-IN') return `${title} के लिए आवश्यक दस्तावेज़:\n\n${docList}\n\nसभी मूल दस्तावेज़ और एक फोटोकॉपी लाएं।`;
    return `For ${title}, you need:\n\n${docList}\n\nBring originals and one photocopy of each.`;
  }
  if (q.includes('deadline') || q.includes('last date') || q.includes('ಕೊನೆಯ') || q.includes('अंतिम')) {
    if (!deadline) {
      if (lang === 'kn-IN') return 'ಈ ಫಾರ್ಮ್‌ನ ಮುಕ್ತಾಯ ದಿನಾಂಕ ಸ್ಪಷ್ಟವಾಗಿ ಸೂಚಿಸಿಲ್ಲ. ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಪರಿಶೀಲಿಸಿ.';
      if (lang === 'hi-IN') return 'इस फॉर्म की अंतिम तिथि स्पष्ट नहीं है। आधिकारिक वेबसाइट जांचें।';
      return 'The deadline is not clearly specified in this form. Please check the official website.';
    }
    if (lang === 'kn-IN') return `ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಕೊನೆಯ ದಿನ: ${deadline}. ಸಮಯಕ್ಕೆ ಸಲ್ಲಿಸಿ!`;
    if (lang === 'hi-IN') return `आवेदन की अंतिम तिथि: ${deadline}। समय पर जमा करें!`;
    return `The deadline for submission is ${deadline}. Make sure to submit before this date!`;
  }
  if (q.includes('income') || q.includes('ಆದಾಯ') || q.includes('आय')) {
    if (lang === 'kn-IN') return 'ವಾರ್ಷಿಕ ಕುಟುಂಬ ಆದಾಯ ಎಂದರೆ ನಿಮ್ಮ ಮನೆಯ ಎಲ್ಲಾ ಸದಸ್ಯರ ಒಟ್ಟು ವಾರ್ಷಿಕ ಆದಾಯ. ತಹಶೀಲ್ದಾರ್ ನೀಡಿದ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರದಲ್ಲಿ ಇರುವ ಮೊತ್ತ ನಮೂದಿಸಿ.';
    if (lang === 'hi-IN') return 'वार्षिक पारिवारिक आय में परिवार के सभी सदस्यों की कुल वार्षिक कमाई शामिल है। तहसीलदार द्वारा जारी आय प्रमाण पत्र में दी गई राशि भरें।';
    return 'Annual family income means the total yearly earnings of all members in your household — from jobs, farming, rent, business, etc. Enter the amount shown on your income certificate issued by the Tahsildar.';
  }
  if (q.includes('aadhaar') || q.includes('ಆಧಾರ್') || q.includes('आधार')) {
    if (lang === 'kn-IN') return 'ಆಧಾರ್ ಕಾರ್ಡ್ ಕಡ್ಡಾಯ. ಇದನ್ನು ಗುರುತಿನ ದಾಖಲೆ ಮತ್ತು ನೇರ ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ (DBT) ಗಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ.';
    if (lang === 'hi-IN') return 'आधार कार्ड अनिवार्य है। इसका उपयोग पहचान सत्यापन और सीधे बैंक खाते में पैसे भेजने के लिए होता है।';
    return 'Yes, Aadhaar card is mandatory. It is used for identity verification and for the Direct Benefit Transfer (DBT) — the scholarship money is sent directly to the bank account linked with your Aadhaar.';
  }
  if (q.includes('caste') || q.includes('ಜಾತಿ') || q.includes('जाति')) {
    if (lang === 'kn-IN') return 'ಜಾತಿ ವರ್ಗ ಎಂದರೆ SC (ಪರಿಶಿಷ್ಟ ಜಾತಿ), ST (ಪರಿಶಿಷ್ಟ ಪಂಗಡ), OBC (ಹಿಂದುಳಿದ ವರ್ಗ) ಅಥವಾ General. ನಿಮ್ಮ ಜಾತಿ ಪ್ರಮಾಣಪತ್ರದಲ್ಲಿ ಇರುವಂತೆ ನಮೂದಿಸಿ.';
    if (lang === 'hi-IN') return 'जाति श्रेणी — SC, ST, OBC या General — आपके जाति प्रमाण पत्र में दर्ज के अनुसार भरें।';
    return 'Enter your caste category — SC (Scheduled Caste), ST (Scheduled Tribe), OBC (Other Backward Class) or General — exactly as it appears on your caste certificate issued by a government authority.';
  }

  // Generic
  if (lang === 'kn-IN') return `ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಅರ್ಥವಾಯಿತು. ${title} ಬಗ್ಗೆ ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗೆ, ಅಧಿಕೃತ ಮೂಲ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ನಿರ್ದಿಷ್ಟ ಫೀಲ್ಡ್ ಬಗ್ಗೆ ಕೇಳಿ.`;
  if (lang === 'hi-IN') return `आपका प्रश्न समझ में आया। ${title} के बारे में अधिक जानकारी के लिए कोई विशिष्ट फ़ील्ड या दस्तावेज़ के बारे में पूछें।`;
  return `I understand your question about ${title}. For the most accurate answer, please ask about a specific field (e.g., "What is annual family income?") or required documents, and I'll give you a detailed explanation.`;
}
