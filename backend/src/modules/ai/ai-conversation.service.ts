import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConversation } from '../../database/entities/ai-conversation.entity';
import { AiMessage } from '../../database/entities/ai-message.entity';
import { AiEngineService, EngineMessage, EngineResult, EngineEvent, AiUnavailableException } from './ai-engine.service';
import { AiToolsService, ToolUser } from './ai-tools.service';

export interface ChatRequest {
  message: string;
  conversationId?: string;
  location?: { lat: number; lng: number };
  stream?: boolean;
  isVoice?: boolean;
}

export interface ChatReply {
  conversationId: string;
  messageId: string;
  content: string;
  provider?: string;
  model?: string;
}

@Injectable()
export class AiConversationService {
  private readonly logger = new Logger(AiConversationService.name);

  constructor(
    @InjectRepository(AiConversation) private readonly convRepo: Repository<AiConversation>,
    @InjectRepository(AiMessage) private readonly msgRepo: Repository<AiMessage>,
    private readonly engine: AiEngineService,
    private readonly tools: AiToolsService,
  ) {}

  private systemPrompt(user: ToolUser): string {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
    return [
      'You are CivicBot, the official AI assistant of CommunityIQ / FixMyCity — a civic issue reporting and live mapping platform for Kolkata, India.',
      'You help citizens, volunteers and officials with civic issues, city services, community health, departments, analytics and emergencies.',
      '',
      'Rules:',
      '- Answer in the same language the user writes in (English, Bengali, Hindi or a natural mix).',
      '- Use clean Markdown: headings, bullet lists, bold, and fenced code blocks when useful. Keep answers focused and well-structured.',
      '- When CIVIC-DATA blocks are present in the context, answer strictly from that real data and cite it. NEVER invent issue IDs, counts, names or numbers.',
      '- Do not fabricate resolution statuses, departments or helpline numbers that are not in the context.',
      '- If the user asks for something outside civic scope, politely redirect to your civic purpose.',
      '- For emergencies: always lead with the helpline guidance and tell them to call first.',
      '- Be warm, concise and practical. Use the user name when natural.',
      '',
      `Today: ${new Date().toISOString().slice(0, 10)}. User: ${name} (${user.role}). Platform: CommunityIQ/FixMyCity.`,
    ].join('\n');
  }

  private async buildMessages(user: ToolUser, history: AiMessage[], message: string, location?: { lat: number; lng: number }): Promise<EngineMessage[]> {
    const context = await this.tools.buildContext(message, user, location);
    const engineMessages: EngineMessage[] = [{ role: 'system', content: this.systemPrompt(user) }];
    if (context.blocks.length) {
      engineMessages.push({
        role: 'system',
        content: `CURRENT CIVIC DATA (answer from this real data when relevant; tools used: ${context.toolsUsed.join(', ') || 'none'}):\n${context.blocks.join('\n\n')}`,
      });
    }
    for (const m of history.slice(-16)) {
      engineMessages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
    }
    engineMessages.push({ role: 'user', content: message });
    return engineMessages;
  }

  private cleanTitle(message: string): string {
    const t = message.replace(/\s+/g, ' ').trim();
    return t.length > 60 ? `${t.slice(0, 60)}…` : t || 'New conversation';
  }

  async listForUser(userId: string): Promise<any[]> {
    const convs = await this.convRepo.find({ where: { userId }, order: { updatedAt: 'DESC' }, take: 50 });
    const ids = convs.map((c) => c.id);
    const counts: Record<string, number> = {};
    if (ids.length) {
      const rows = await this.msgRepo
        .createQueryBuilder('m')
        .select('m."conversation_id"', 'conversationId')
        .addSelect('COUNT(*)', 'count')
        .where('m."conversation_id" IN (:...ids)', { ids })
        .groupBy('m."conversation_id"')
        .getRawMany();
      for (const r of rows) counts[r.conversationId] = Number(r.count || 0);
    }
    return convs.map((c) => ({
      id: c.id,
      title: c.title,
      isVoice: c.isVoice,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: counts[c.id] || 0,
    }));
  }

  private async getOwned(userId: string, conversationId: string): Promise<AiConversation> {
    const conv = await this.convRepo.findOne({ where: { id: conversationId }, relations: ['messages'] });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenException('You do not own this conversation');
    return conv;
  }

  async getConversation(userId: string, conversationId: string) {
    const conv = await this.getOwned(userId, conversationId);
    return {
      id: conv.id,
      title: conv.title,
      isVoice: conv.isVoice,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messages: (conv.messages || [])
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          provider: m.provider,
          model: m.model,
          createdAt: m.createdAt,
        })),
    };
  }

  async latestConversationId(userId: string): Promise<string | null> {
    const conv = await this.convRepo.findOne({ where: { userId }, order: { updatedAt: 'DESC' } });
    return conv ? conv.id : null;
  }

  async rename(userId: string, conversationId: string, title: string) {
    const conv = await this.getOwned(userId, conversationId);
    conv.title = title.slice(0, 200) || conv.title;
    await this.convRepo.save(conv);
    return { id: conv.id, title: conv.title };
  }

  async delete(userId: string, conversationId: string) {
    const conv = await this.getOwned(userId, conversationId);
    await this.convRepo.remove(conv);
    return { deleted: true, id: conversationId };
  }

  async chat(user: ToolUser, request: ChatRequest): Promise<ChatReply> {
    if (!this.engine.isConfigured) {
      throw new AiUnavailableException();
    }
    let conv: AiConversation;
    if (request.conversationId) {
      conv = await this.getOwned(user.id, request.conversationId);
    } else {
      conv = this.convRepo.create({ userId: user.id, title: this.cleanTitle(request.message), isVoice: !!request.isVoice });
      conv = await this.convRepo.save(conv);
    }
    const userMsg = this.msgRepo.create({ conversationId: conv.id, role: 'user', content: request.message });
    await this.msgRepo.save(userMsg);

    const history = await this.msgRepo.find({ where: { conversationId: conv.id }, order: { createdAt: 'ASC' } });
    const messages = await this.buildMessages(user, history.slice(0, -1), request.message, request.location);

    let result: EngineResult;
    try {
      result = await this.engine.generate(messages);
    } catch (e) {
      conv.meta = { ...(conv.meta || {}), lastError: true };
      await this.convRepo.save(conv);
      throw e;
    }

    const reply = this.msgRepo.create({
      conversationId: conv.id,
      role: 'assistant',
      content: result.content,
      provider: result.provider,
      model: result.model,
      latencyMs: 0,
    });
    await this.msgRepo.save(reply);
    conv.title = history.length === 1 ? this.cleanTitle(request.message) : conv.title;
    conv.meta = { ...(conv.meta || {}), lastError: false };
    await this.convRepo.save(conv);

    return { conversationId: conv.id, messageId: reply.id, content: result.content, provider: result.provider, model: result.model };
  }

  async *chatStream(user: ToolUser, request: ChatRequest): AsyncGenerator<Record<string, unknown>> {
    if (!this.engine.isConfigured) {
      throw new AiUnavailableException();
    }
    let conv: AiConversation;
    if (request.conversationId) {
      conv = await this.getOwned(user.id, request.conversationId);
    } else {
      conv = this.convRepo.create({ userId: user.id, title: this.cleanTitle(request.message), isVoice: !!request.isVoice });
      conv = await this.convRepo.save(conv);
    }
    const userMsg = this.msgRepo.create({ conversationId: conv.id, role: 'user', content: request.message });
    await this.msgRepo.save(userMsg);

    const history = await this.msgRepo.find({ where: { conversationId: conv.id }, order: { createdAt: 'ASC' } });
    const messages = await this.buildMessages(user, history.slice(0, -1), request.message, request.location);

    yield { type: 'meta', conversationId: conv.id };
    let full = '';
    let provider = '';
    let model = '';
    try {
      for await (const ev of this.engine.stream(messages)) {
        if (ev.type === 'meta') {
          provider = ev.provider;
          model = ev.model;
          yield { type: 'provider', conversationId: conv.id, provider: ev.provider, model: ev.model };
        } else if (ev.type === 'delta') {
          full += ev.text;
          yield { type: 'delta', text: ev.text };
        }
      }
    } catch (e) {
      conv.meta = { ...(conv.meta || {}), lastError: true };
      await this.convRepo.save(conv);
      throw e;
    }

    const reply = this.msgRepo.create({
      conversationId: conv.id,
      role: 'assistant',
      content: full,
      provider,
      model,
    });
    await this.msgRepo.save(reply);
    conv.title = history.length === 1 ? this.cleanTitle(request.message) : conv.title;
    conv.meta = { ...(conv.meta || {}), lastError: false };
    await this.convRepo.save(conv);

    yield { type: 'done', conversationId: conv.id, messageId: reply.id };
  }

  async regenerate(user: ToolUser, conversationId: string, location?: { lat: number; lng: number }): Promise<ChatReply> {
    const conv = await this.getOwned(user.id, conversationId);
    const all = await this.msgRepo.find({ where: { conversationId: conv.id }, order: { createdAt: 'ASC' } });
    if (!all.length) throw new NotFoundException('No messages to regenerate');
    let lastAssistant = all.filter((m) => m.role === 'assistant').pop();
    if (lastAssistant) {
      await this.msgRepo.remove(lastAssistant);
    }
    const history = (await this.msgRepo.find({ where: { conversationId: conv.id }, order: { createdAt: 'ASC' } })).slice(0, -1);
    const lastUser = [...all.filter((m) => m.role === 'user')].pop();
    if (!lastUser) throw new NotFoundException('No user message to regenerate');
    const messages = await this.buildMessages(user, history, lastUser.content, location);
    let result: EngineResult;
    try {
      result = await this.engine.generate(messages);
    } catch (e) {
      conv.meta = { ...(conv.meta || {}), lastError: true };
      await this.convRepo.save(conv);
      throw e;
    }
    const reply = this.msgRepo.create({
      conversationId: conv.id,
      role: 'assistant',
      content: result.content,
      provider: result.provider,
      model: result.model,
    });
    await this.msgRepo.save(reply);
    conv.meta = { ...(conv.meta || {}), lastError: false };
    await this.convRepo.save(conv);
    return { conversationId: conv.id, messageId: reply.id, content: result.content, provider: result.provider, model: result.model };
  }

  async *regenerateStream(user: ToolUser, conversationId: string, location?: { lat: number; lng: number }): AsyncGenerator<Record<string, unknown>> {
    const conv = await this.getOwned(user.id, conversationId);
    const all = await this.msgRepo.find({ where: { conversationId: conv.id }, order: { createdAt: 'ASC' } });
    if (!all.length) throw new NotFoundException('No messages to regenerate');
    const lastAssistant = all.filter((m) => m.role === 'assistant').pop();
    if (lastAssistant) {
      await this.msgRepo.remove(lastAssistant);
    }
    const history = (await this.msgRepo.find({ where: { conversationId: conv.id }, order: { createdAt: 'ASC' } })).slice(0, -1);
    const lastUser = [...all.filter((m) => m.role === 'user')].pop();
    if (!lastUser) throw new NotFoundException('No user message to regenerate');

    yield { type: 'meta', conversationId: conv.id };
    let full = '';
    let provider = '';
    let model = '';
    try {
      const messages = await this.buildMessages(user, history, lastUser.content, location);
      for await (const ev of this.engine.stream(messages)) {
        if (ev.type === 'meta') {
          provider = ev.provider;
          model = ev.model;
          yield { type: 'provider', conversationId: conv.id, provider: ev.provider, model: ev.model };
        } else if (ev.type === 'delta') {
          full += ev.text;
          yield { type: 'delta', text: ev.text };
        }
      }
    } catch (e) {
      conv.meta = { ...(conv.meta || {}), lastError: true };
      await this.convRepo.save(conv);
      throw e;
    }
    const reply = this.msgRepo.create({
      conversationId: conv.id,
      role: 'assistant',
      content: full,
      provider,
      model,
    });
    await this.msgRepo.save(reply);
    conv.meta = { ...(conv.meta || {}), lastError: false };
    await this.convRepo.save(conv);
    yield { type: 'done', conversationId: conv.id, messageId: reply.id };
  }
}
