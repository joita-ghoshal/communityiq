'use client';
import { useEffect, useRef, useState } from 'react';
import { PaperAirplaneIcon, MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { Paperclip, ImageIcon, ArrowUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatComposerProps {
  disabled?: boolean;
  isStreaming?: boolean;
  onSend: (text: string) => void;
  placeholder?: string;
  voiceSupported?: boolean;
  onVoiceTranscript?: (text: string) => void;
}

const iconBtn =
  'flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/10 dark:hover:bg-sky-400/10 transition-all ai-focus-ring flex-shrink-0';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
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

  const canSend = !!input.trim() && !disabled && !isStreaming;

  return (
    <div className="border-t border-white/50 dark:border-slate-700/40 bg-white/55 dark:bg-slate-900/45 backdrop-blur-2xl px-3 md:px-5 pt-3 pb-2.5">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-700/60 bg-white/85 dark:bg-slate-800/70 px-2.5 py-2 shadow-lg shadow-blue-500/5 focus-within:border-sky-400 dark:focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-500/15 transition-all">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={iconBtn}
            title="Attach file"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={iconBtn}
            title="Add image"
            aria-label="Add image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                toast('Attachments are coming soon — your message was not sent.', { icon: '📎' });
              }
              e.target.value = '';
            }}
          />
          {voiceSupported && (
            <button
              onClick={toggleMic}
              disabled={isStreaming}
              className={`${iconBtn} ${
                isRecording
                  ? '!text-red-500 !bg-red-500/10 animate-pulse'
                  : 'disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
              title={isRecording ? 'Stop recording' : 'Voice input'}
              aria-label={isRecording ? 'Stop recording' : 'Voice input'}
            >
              {isRecording ? <StopIcon className="w-4 h-4" /> : <MicrophoneIcon className="w-4 h-4" />}
            </button>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? 'AI is responding...' : placeholder}
            disabled={disabled || isStreaming}
            rows={1}
            aria-label={placeholder}
            className="flex-1 resize-none bg-transparent px-1.5 py-1.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none max-h-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={submit}
            disabled={!canSend}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ai-focus-ring ${
              canSend
                ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
            title="Send message"
            aria-label="Send message"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : canSend ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <PaperAirplaneIcon className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
          Enter to send · Shift+Enter for a new line — AI can make mistakes, verify important civic info.
        </p>
      </div>
    </div>
  );
}
