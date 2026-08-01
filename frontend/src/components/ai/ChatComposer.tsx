'use client';
import { useEffect, useRef, useState } from 'react';
import { PaperAirplaneIcon, MicrophoneIcon, StopIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ChatComposerProps {
  disabled?: boolean;
  isStreaming?: boolean;
  onSend: (text: string) => void;
  placeholder?: string;
  voiceSupported?: boolean;
  onVoiceTranscript?: (text: string) => void;
}

export default function ChatComposer({
  disabled,
  isStreaming,
  onSend,
  placeholder = 'Ask me anything...',
  voiceSupported = true,
  onVoiceTranscript,
}: ChatComposerProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser');
      return;
    }
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsRecording(false);
      onVoiceTranscript?.(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'AI is responding...' : placeholder}
          disabled={disabled || isStreaming}
          rows={1}
          className="flex-1 resize-none px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed max-h-[120px]"
        />
        {voiceSupported && (
          <button
            onClick={toggleMic}
            disabled={isStreaming}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40'
            }`}
            title={isRecording ? 'Stop recording' : 'Voice input'}
          >
            {isRecording ? <StopIcon className="w-4.5 h-4.5" /> : <MicrophoneIcon className="w-4.5 h-4.5" />}
          </button>
        )}
        <button
          onClick={submit}
          disabled={!input.trim() || disabled || isStreaming}
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-center disabled:opacity-40 hover:shadow-lg transition-all flex-shrink-0"
          title="Send"
        >
          {isStreaming ? <ArrowPathIcon className="w-4.5 h-4.5 animate-spin" /> : <PaperAirplaneIcon className="w-4.5 h-4.5" />}
        </button>
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5 text-center">AI can make mistakes — verify important civic info.</p>
    </div>
  );
}
