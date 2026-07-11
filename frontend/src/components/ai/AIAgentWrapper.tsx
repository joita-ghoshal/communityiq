'use client';
import dynamic from 'next/dynamic';

const AIAgentChat = dynamic(() => import('./AIAgentChat'), { ssr: false });

export default function AIAgentWrapper() {
  return <AIAgentChat />;
}
