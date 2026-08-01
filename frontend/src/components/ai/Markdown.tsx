'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = String(children ?? '').replace(/\n$/, '');
  return (
    <div className="relative group/code my-2">
      <pre className="bg-slate-950 dark:bg-slate-950 text-slate-100 rounded-xl p-3 pr-10 overflow-x-auto text-[12px] leading-relaxed">
        <code>{text}</code>
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/10 text-slate-300 hover:bg-white/20 transition-colors opacity-0 group-hover/code:opacity-100"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function Markdown({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`markdown-body text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className: _cn, children, ...props }: any) {
            const match = /language-(\w+)/.exec(_cn || '');
            if (inline) {
              return (
                <code className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/70 text-[12px]" {...props}>
                  {children}
                </code>
              );
            }
            if (match) {
              return (
                <CodeBlock>
                  {children}
                </CodeBlock>
              );
            }
            return (
              <CodeBlock>
                {children}
              </CodeBlock>
            );
          },
          a({ href, children }: any) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 underline underline-offset-2">
                {children}
              </a>
            );
          },
          h1: (props: any) => <h1 className="text-base font-bold mt-3 mb-1.5" {...props} />,
          h2: (props: any) => <h2 className="text-[15px] font-bold mt-3 mb-1.5" {...props} />,
          h3: (props: any) => <h3 className="text-sm font-bold mt-2.5 mb-1" {...props} />,
          ul: (props: any) => <ul className="list-disc pl-4 my-1.5 space-y-0.5" {...props} />,
          ol: (props: any) => <ol className="list-decimal pl-4 my-1.5 space-y-0.5" {...props} />,
          li: (props: any) => <li className="markdown-li" {...props} />,
          p: (props: any) => <p className="my-1.5" {...props} />,
          strong: (props: any) => <strong className="font-bold" {...props} />,
          table: (props: any) => (
            <div className="overflow-x-auto my-2">
              <table className="text-xs border-collapse min-w-full" {...props} />
            </div>
          ),
          th: (props: any) => <th className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-left font-semibold" {...props} />,
          td: (props: any) => <td className="border border-slate-300 dark:border-slate-600 px-2 py-1" {...props} />,
          blockquote: (props: any) => <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-3 my-2 italic" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
