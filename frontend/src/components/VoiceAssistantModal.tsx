import React, { useState } from 'react';
import { Mic, MicOff, X, ArrowLeft, Sparkles, Volume2, ArrowRight } from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSection?: (section: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSection,
}) => {
  const [isListening, setIsListening] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const suggestions = [
    { text: 'Read my vitals', action: () => handleCommand('Read my vitals') },
    { text: 'Show my medications', action: () => handleCommand('Show my medications') },
    { text: 'Upload a document', action: () => handleCommand('Upload a document') },
    { text: "Give today's health report", action: () => handleCommand("Give today's health report") },
  ];

  const handleCommand = (query: string) => {
    setTranscript(query);
    setIsListening(false);

    setTimeout(() => {
      if (query.includes('vital')) {
        setResponseMessage('Your heart rate is 78 bpm, blood pressure is 120/80 mmHg, and oxygen saturation is 98%. All physiological biomarkers are stable.');
        onNavigateToSection?.('vitals');
      } else if (query.includes('medication')) {
        setResponseMessage('You have Amlodipine 5mg scheduled in 2h 15m and Metformin 500mg taken this morning.');
        onNavigateToSection?.('medications');
      } else if (query.includes('document')) {
        setResponseMessage('Opening clinical documents directory. Ready for PDF and scan uploads.');
        onNavigateToSection?.('documents');
      } else {
        setResponseMessage("Today's digital twin synthesis indicates normal cardiovascular and metabolic function with optimal sleep and hydration.");
        onNavigateToSection?.('summary');
      }
    }, 600);
  };

  const toggleMic = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setResponseMessage(null);
      setTranscript('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col min-h-[520px]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voice Assistant</span>
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Stage: Mic & Query */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          {/* Big Glowing Microphone Button */}
          <div className="relative mb-6">
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                <div className="absolute -inset-4 rounded-full bg-blue-500/10 animate-pulse" />
              </>
            )}

            <button
              onClick={toggleMic}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-blue-600 text-white shadow-blue-500/30 scale-105'
                  : 'bg-slate-100 text-slate-400 hover:text-slate-700'
              }`}
            >
              {isListening ? <Mic className="w-10 h-10 animate-pulse" /> : <MicOff className="w-10 h-10" />}
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {transcript ? `"${transcript}"` : 'How can I help you?'}
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            {isListening ? 'Speak naturally or tap a suggestion below' : 'Processing request...'}
          </p>

          {/* AI Response Bubble */}
          {responseMessage && (
            <div className="w-full p-4 mb-5 rounded-2xl bg-blue-50/80 border border-blue-100 text-left animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-blue-700 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MedTwin AI Assistant</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{responseMessage}</p>
            </div>
          )}

          {/* Suggestions */}
          <div className="w-full text-left">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Try saying:
            </div>
            <div className="space-y-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={s.action}
                  className="w-full p-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-xs text-slate-700 hover:text-blue-700 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <span className="font-medium">{s.text}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audio Waveform Bars Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-center gap-1.5">
          {[40, 65, 30, 85, 95, 60, 45, 75, 90, 50, 35, 70, 80, 40].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                isListening ? 'bg-blue-600' : 'bg-slate-300'
              }`}
              style={{
                height: isListening ? `${(h * 0.25) + 4}px` : '4px',
                animation: isListening ? `pulse 1s ease-in-out ${i * 0.1}s infinite` : 'none',
              }}
            />
          ))}
          <span className="ml-3 text-xs font-medium text-slate-500">
            {isListening ? 'Listening...' : 'Ready'}
          </span>
        </div>
      </div>
    </div>
  );
};
