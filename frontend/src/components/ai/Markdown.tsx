'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, Copy } from 'lucide-react';

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
    <div className="group/code my-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[hsl(222,40%,9%)] shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/90" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90" />
          {language && (
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{language}</span>
          )}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors opacity-0 group-hover/code:opacity-100 ai-focus-ring rounded-md px-1.5 py-0.5"
          title="Copy code"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 text-[12.5px] leading-relaxed text-slate-800 dark:text-slate-100">
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
                <code className="ai-inline-code" {...props}>
                  {children}
                </code>
              );
            }
            const lang = /language-(\w+)/.exec(_cn || '')?.[1];
            return <CodeBlock language={lang}>{children}</CodeBlock>;
          },
          a({ href, children }: any) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          table: (props: any) => <table {...props} />,
          blockquote: (props: any) => <blockquote {...props} />,
          input: (props: any) => (
            <input
              type="checkbox"
              checked={props.checked}
              readOnly
              className="mr-1.5 -mt-0.5 inline-block align-middle accent-sky-600 dark:accent-sky-400"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
