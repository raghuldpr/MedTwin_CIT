import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { voiceApi } from '../services/voice.api';
import { ApiError } from '../services/api';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const suggestedQueries = [
    'Read my vitals',
    'Show my medications',
    'Upload a document',
    "Give today's health report",
  ];

  useEffect(() => {
    if (isOpen) {
      setIsListening(true);
      setTranscript('');
      setAiResponse('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleQueryClick = async (query: string) => {
    setTranscript(query);
    setIsListening(false);
    setIsProcessing(true);
    setAiResponse('');

    try {
      const res = await voiceApi.sendCommand(query);
      setAiResponse(res.message);

      if (res.targetEndpoint) {
        setTimeout(() => {
          onClose();
          navigate(res.targetEndpoint!);
        }, 2200);
      }
    } catch (err) {
      setAiResponse(err instanceof ApiError ? err.message : 'Could not process voice command.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
        {/* Top Bar */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">smart_toy</span>
            <span className="text-sm font-bold">MedTwin Voice Assistant</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Pulsing Concentric Audio Rings & Mic */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute w-44 h-44 rounded-full bg-blue-500/10 animate-ping duration-1000"></div>
          <div className="absolute w-36 h-36 rounded-full bg-blue-500/20"></div>
          <div className="absolute w-28 h-28 rounded-full bg-blue-500/30"></div>

          <button
            onClick={() => setIsListening(!isListening)}
            className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 hover:scale-105 transition-transform"
          >
            <span className="material-symbols-outlined text-[36px]">mic</span>
          </button>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-bold text-slate-900 mb-2">How can I help you?</h2>

        {/* Status / Transcript */}
        <div className="min-h-[50px] flex flex-col items-center justify-center mb-6 w-full">
          {isProcessing ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Processing with MedTwin Voice Engine...</span>
            </div>
          ) : isListening ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce delay-200"></span>
              </span>
              <span>Listening... Select or speak a command</span>
            </div>
          ) : (
            <div className="text-xs text-slate-700 font-medium px-4 w-full">
              {transcript && <p className="italic text-slate-500">"{transcript}"</p>}
              {aiResponse && (
                <p className="mt-2 text-blue-700 font-semibold bg-blue-50 p-3 rounded-xl text-left border border-blue-100">
                  {aiResponse}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-100 text-left">
          <p className="text-[11px] font-semibold text-slate-400">Try saying:</p>
          <div className="flex flex-col gap-2">
            {suggestedQueries.map((query) => (
              <button
                key={query}
                onClick={() => handleQueryClick(query)}
                disabled={isProcessing}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-xs font-medium text-slate-700 hover:text-blue-700 flex items-center justify-between transition-all text-left disabled:opacity-50"
              >
                <span>{query}</span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
