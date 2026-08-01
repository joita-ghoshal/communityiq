'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

function CodeBlock({ children, language }: { children: React.ReactNode; language?: string }) {
  const [copied, setCopied] = useState(false);
  const text = String(children ?? '').replace(/\n$/, '');

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="relative group/code my-2 overflow-hidden rounded-xl border border-slate-700/60 bg-[#0b1220] shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.04] border-b border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400/70" />
          <span className="w-2 h-2 rounded-full bg-amber-400/70" />
          <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
          <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-300 hover:bg-white/10 transition-colors opacity-100 md:opacity-0 md:group-hover/code:opacity-100 focus-visible:opacity-100"
          aria-label="Copy code"
        >
          {copied ? <CheckIcon className="w-3 h-3 text-emerald-400" /> : <ClipboardDocumentIcon className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto text-[12.5px] leading-relaxed">
        <code>{text}</code>
      </pre>
    </div>
  );
}

export default function Markdown({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`ai-markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ inline, className: _cn, children, ...props }: any) {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded-md bg-sky-500/10 dark:bg-indigo-500/20 text-sky-700 dark:text-sky-300 text-[12px]" {...props}>
                  {children}
                </code>
              );
            }
            const match = /language-(\w+)/.exec(_cn || '');
            return <CodeBlock language={match?.[1]}>{children}</CodeBlock>;
          },
          a({ href, children }: any) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 underline underline-offset-2 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
                {children}
              </a>
            );
          },
          h1: (props: any) => <h1 {...props} />,
          h2: (props: any) => <h2 {...props} />,
          h3: (props: any) => <h3 {...props} />,
          h4: (props: any) => <h4 {...props} />,
          ul: (props: any) => <ul {...props} />,
          ol: (props: any) => <ol {...props} />,
          li: (props: any) => <li {...props} />,
          p: (props: any) => <p {...props} />,
          strong: (props: any) => <strong className="font-bold" {...props} />,
          em: (props: any) => <em {...props} />,
          hr: (props: any) => <hr {...props} />,
          table: (props: any) => (
            <div className="overflow-x-auto my-2 rounded-xl">
              <table className="text-xs border-collapse min-w-full" {...props} />
            </div>
          ),
          thead: (props: any) => <thead {...props} />,
          tbody: (props: any) => <tbody {...props} />,
          tr: (props: any) => <tr className="even:bg-slate-500/5" {...props} />,
          th: (props: any) => <th className="border-b border-slate-300 dark:border-slate-600 px-3 py-2 text-left font-semibold" {...props} />,
          td: (props: any) => <td className="border-b border-slate-200/70 dark:border-slate-700/50 px-3 py-2" {...props} />,
          blockquote: (props: any) => <blockquote {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
