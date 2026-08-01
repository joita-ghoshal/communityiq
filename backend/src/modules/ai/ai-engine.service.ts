import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EngineMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface EngineOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface EngineResult {
  content: string;
  provider: string;
  model: string;
}

export type EngineEvent =
  | { type: 'meta'; provider: string; model: string }
  | { type: 'delta'; text: string }
  | { type: 'done' };

interface ProviderConfig {
  id: string;
  apiKey: string;
  model: string;
}

export class AiUnavailableException extends HttpException {
  constructor(message = 'AI service is temporarily unavailable. Please try again in a moment.') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

@Injectable()
export class AiEngineService {
  private readonly logger = new Logger(AiEngineService.name);
  private readonly providers: ProviderConfig[];

  constructor(private readonly config: ConfigService) {
    const ai: any = this.config.get('ai', { defaultProvider: 'auto', gemini: {}, openai: {}, groq: {}, openrouter: {} });

    const all: ProviderConfig[] = [
      { id: 'gemini', apiKey: ai.gemini?.apiKey || '', model: ai.gemini?.model || 'gemini-3.5-flash-lite' },
      { id: 'openai', apiKey: ai.openai?.apiKey || '', model: ai.openai?.model || 'gpt-4o-mini' },
      { id: 'groq', apiKey: ai.groq?.apiKey || '', model: ai.groq?.model || 'llama-3.3-70b-versatile' },
      { id: 'openrouter', apiKey: ai.openrouter?.apiKey || '', model: ai.openrouter?.model || 'meta-llama/llama-3.3-70b-instruct:free' },
    ];

    const order = (ai.defaultProvider || 'auto').split(',').map((s) => s.trim()).filter(Boolean);
    if (order.length && order[0] !== 'auto') {
      this.providers = order
        .map((id) => all.find((p) => p.id === id))
        .filter((p): p is ProviderConfig => !!p)
        .concat(all.filter((p) => !order.includes(p.id)));
    } else {
      this.providers = all;
    }
  }

  get isConfigured(): boolean {
    return this.providers.some((p) => !!p.apiKey);
  }

  get configuredProviders(): string[] {
    return this.providers.filter((p) => !!p.apiKey).map((p) => p.id);
  }

  private usableProviders(): ProviderConfig[] {
    return this.providers.filter((p) => !!p.apiKey);
  }

  async generate(messages: EngineMessage[], options: EngineOptions = {}): Promise<EngineResult> {
    const usable = this.usableProviders();
    if (!usable.length) {
      throw new AiUnavailableException();
    }
    let lastError: unknown = null;
    for (const provider of usable) {
      try {
        const started = Date.now();
        const content = provider.id === 'gemini'
          ? await this.callGemini(provider, messages, options, false)
          : await this.callOpenAiCompatible(provider, messages, options, false);
        this.logger.log(`AI provider=${provider.id} model=${provider.model} tokens-latency=${Date.now() - started}ms`);
        return { content, provider: provider.id, model: provider.model };
      } catch (e: any) {
        lastError = e;
        this.logger.error(`AI provider ${provider.id} failed: ${e.message}`);
      }
    }
    this.logger.error(`All AI providers failed: ${(lastError as any)?.message}`);
    throw new AiUnavailableException();
  }

  async *stream(
    messages: EngineMessage[],
    options: EngineOptions = {},
  ): AsyncGenerator<EngineEvent> {
    const usable = this.usableProviders();
    if (!usable.length) {
      throw new AiUnavailableException();
    }
    let lastError: unknown = null;
    for (const provider of usable) {
      try {
        yield { type: 'meta', provider: provider.id, model: provider.model };
        if (provider.id === 'gemini') {
          for await (const chunk of this.streamGemini(provider, messages, options)) {
            yield chunk;
          }
        } else {
          for await (const chunk of this.streamOpenAiCompatible(provider, messages, options)) {
            yield chunk;
          }
        }
        yield { type: 'done' };
        return;
      } catch (e: any) {
        lastError = e;
        this.logger.error(`AI stream provider ${provider.id} failed: ${e.message}`);
      }
    }
    this.logger.error(`All AI stream providers failed: ${(lastError as any)?.message}`);
    throw new AiUnavailableException();
  }

  private geminiContents(messages: EngineMessage[]) {
    const contents: { role: string; parts: { text: string }[] }[] = [];
    for (const m of messages) {
      if (m.role === 'system') {
        contents.push({ role: 'user', parts: [{ text: `System instruction:\n${m.content}` }] });
        continue;
      }
      contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] });
    }
    return contents;
  }

  private openAiMessages(messages: EngineMessage[]) {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }

  private async callGemini(provider: ProviderConfig, messages: EngineMessage[], options: EngineOptions, _streaming: boolean): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        contents: this.geminiContents(messages),
        generationConfig: {
          temperature: options.temperature ?? 0.6,
          maxOutputTokens: options.maxTokens ?? 1024,
        },
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`Gemini HTTP ${resp.status}: ${body.slice(0, 200)}`);
    }
    const data: any = await resp.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
    if (!text) throw new Error('Gemini returned empty response');
    return text;
  }

  private async *streamGemini(provider: ProviderConfig, messages: EngineMessage[], options: EngineOptions): AsyncGenerator<EngineEvent> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:streamGenerateContent?alt=sse&key=${provider.apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(90_000),
      body: JSON.stringify({
        contents: this.geminiContents(messages),
        generationConfig: {
          temperature: options.temperature ?? 0.6,
          maxOutputTokens: options.maxTokens ?? 1024,
        },
      }),
    });
    if (!resp.ok || !resp.body) {
      const body = await resp.text().catch(() => '');
      throw new Error(`Gemini stream HTTP ${resp.status}: ${body.slice(0, 200)}`);
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';
      for (const event of events) {
        for (const line of event.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6);
          if (json.trim() === '[DONE]') continue;
          try {
            const parsed = JSON.parse(json);
            const text = parsed?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
            if (text) yield { type: 'delta', text };
            if (parsed?.candidates?.[0]?.finishReason) return;
          } catch {
            /* skip malformed chunk */
          }
        }
      }
    }
  }

  private async callOpenAiCompatible(provider: ProviderConfig, messages: EngineMessage[], options: EngineOptions, _streaming: boolean): Promise<string> {
    const baseUrl =
      provider.id === 'groq'
        ? 'https://api.groq.com/openai/v1'
        : provider.id === 'openrouter'
          ? 'https://openrouter.ai/api/v1'
          : 'https://api.openai.com/v1';
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        ...(provider.id === 'openrouter' ? { 'HTTP-Referer': 'https://communityiq-green.vercel.app', 'X-Title': 'CommunityIQ' } : {}),
      },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: provider.model,
        messages: this.openAiMessages(messages),
        temperature: options.temperature ?? 0.6,
        max_tokens: options.maxTokens ?? 1024,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`${provider.id} HTTP ${resp.status}: ${body.slice(0, 200)}`);
    }
    const data: any = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content || '';
    if (!content) throw new Error(`${provider.id} returned empty response`);
    return content;
  }

  private async *streamOpenAiCompatible(provider: ProviderConfig, messages: EngineMessage[], options: EngineOptions): AsyncGenerator<EngineEvent> {
    const baseUrl =
      provider.id === 'groq'
        ? 'https://api.groq.com/openai/v1'
        : provider.id === 'openrouter'
          ? 'https://openrouter.ai/api/v1'
          : 'https://api.openai.com/v1';
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        ...(provider.id === 'openrouter' ? { 'HTTP-Referer': 'https://communityiq-green.vercel.app', 'X-Title': 'CommunityIQ' } : {}),
      },
      signal: AbortSignal.timeout(90_000),
      body: JSON.stringify({
        model: provider.model,
        messages: this.openAiMessages(messages),
        temperature: options.temperature ?? 0.6,
        max_tokens: options.maxTokens ?? 1024,
        stream: true,
      }),
    });
    if (!resp.ok || !resp.body) {
      const body = await resp.text().catch(() => '');
      throw new Error(`${provider.id} stream HTTP ${resp.status}: ${body.slice(0, 200)}`);
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length) {
            yield { type: 'delta', text: delta };
          }
          if (parsed?.choices?.[0]?.finish_reason) return;
        } catch {
          /* skip malformed chunk */
        }
      }
    }
  }
}
