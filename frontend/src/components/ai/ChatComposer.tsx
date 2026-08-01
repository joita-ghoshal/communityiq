'use client';
import { useEffect, useRef, useState } from 'react';
import {
  PaperAirplaneIcon,
  MicrophoneIcon,
  StopIcon,
  ArrowPathIcon,
  PaperClipIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
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
      if (onVoiceTranscript) onVoiceTranscript(transcript);
      else setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
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

  const toolBtn = (active?: boolean) =>
    `w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90 focus-visible:outline-2 focus-visible:outline-sky-500 ${
      active
        ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/40 animate-pulse'
        : 'text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-500/10 dark:hover:bg-sky-500/15 disabled:opacity-40 disabled:cursor-not-allowed'
    }`;

  return (
    <div className="px-3 sm:px-6 lg:px-10 pb-4 pt-1 relative">
      <div className="relative">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-sky-500/40 via-indigo-500/40 to-violet-500/40 opacity-60 blur-[2px] transition-opacity duration-300" aria-hidden="true" />
        <div className="relative ai-panel rounded-2xl px-2.5 sm:px-3 py-2.5 transition-all duration-300 focus-within:shadow-2xl focus-within:shadow-indigo-500/10">
          {isStreaming && (
            <div className="flex items-center gap-1.5 px-1 pb-1.5 text-[10px] font-medium text-indigo-500 dark:text-indigo-300 animate-pulse">
              <span className="typing-dot" style={{ animationDelay: '0ms' }} />
              <span className="typing-dot" style={{ animationDelay: '150ms' }} />
              <span className="typing-dot" style={{ animationDelay: '300ms' }} />
              AI is responding...
            </div>
          )}
          <div className="flex items-end gap-1.5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? 'AI is responding...' : placeholder}
              disabled={disabled || isStreaming}
              rows={1}
              aria-label={placeholder}
              className="flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed max-h-[200px] min-w-0"
            />
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {voiceSupported && (
                <button
                  onClick={toggleMic}
                  disabled={isStreaming}
                  className={toolBtn(isRecording)}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                  aria-label={isRecording ? 'Stop recording' : 'Voice input'}
                >
                  {isRecording ? <StopIcon className="w-4 h-4" /> : <MicrophoneIcon className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={() => toast('Attachments will be available soon', { icon: '📎' })}
                disabled={isStreaming}
                className={toolBtn()}
                title="Attach file (coming soon)"
                aria-label="Attach file"
              >
                <PaperClipIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => toast('Image upload will be available soon', { icon: '📷' })}
                disabled={isStreaming}
                className={toolBtn()}
                title="Add image (coming soon)"
                aria-label="Add image"
              >
                <PhotoIcon className="w-4 h-4" />
              </button>
              <button
                onClick={submit}
                disabled={!input.trim() || disabled || isStreaming}
                className="ml-1.5 h-10 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.03] active:scale-[0.96] transition-all duration-200 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-indigo-400"
                title={isStreaming ? 'AI is responding' : 'Send message'}
                aria-label="Send message"
              >
                {isStreaming ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Send</span>
                    <PaperAirplaneIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-slate-400 dark:text-slate-500">
        <span>AI can make mistakes — verify important civic info.</span>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
        <span className="hidden sm:inline">
          <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 font-sans text-[9px]">Enter</kbd> send
          <span className="mx-1">·</span>
          <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 font-sans text-[9px]">Shift+Enter</kbd> newline
        </span>
      </div>
    </div>
  );
}
