import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Param,
  Query,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AiService } from './ai.service';
import { AiConversationService } from './ai-conversation.service';
import { AiEngineService } from './ai-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';

@ApiTags('AI Intelligence')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly conversationService: AiConversationService,
    private readonly engine: AiEngineService,
  ) {}

  /* ---------------- Legacy non-chat AI endpoints ---------------- */

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze issue data with AI for severity and priority' })
  @ApiBody({ schema: { properties: { title: { type: 'string' }, description: { type: 'string' }, category: { type: 'string' }, latitude: { type: 'number' }, longitude: { type: 'number' } } } })
  async analyze(@Body() body: { title: string; description: string; category: string; latitude: number; longitude: number }) {
    return this.aiService.analyzeIssue(body);
  }

  @Post('verify-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an image against issue description and category using AI Vision' })
  @ApiBody({ schema: { properties: { imageBase64: { type: 'string' }, image: { type: 'string' }, description: { type: 'string' }, category: { type: 'string' } } } })
  async verifyImage(@Body() body: { imageBase64?: string; image?: string; description?: string; category?: string }) {
    const imageData = body.imageBase64 || body.image;
    return this.aiService.verifyImage(imageData, body.description, body.category);
  }

  @Post('insights')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate AI insights from a collection of issues' })
  @ApiBody({ schema: { properties: { issues: { type: 'array', items: { type: 'object' } } } } })
  async insights(@Body('issues') issues: any[]) {
    return this.aiService.generateInsights(issues);
  }

  @Post('classify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Classify issue category using AI' })
  async classify(@Body('text') text: string) {
    return this.aiService.classifyIssue(text);
  }

  @Post('predict')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Predict issue resolution time and priority' })
  async predict(@Body('issueId') issueId: string) {
    return this.aiService.predictResolution(issueId);
  }

  @Post('detect-duplicates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detect potential duplicate issues' })
  async detectDuplicates(@Body('issueId') issueId: string) {
    return this.aiService.detectDuplicates(issueId);
  }

  @Post('detect-fakes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detect potentially fake/spam issues' })
  async detectFakes(@Body('issueId') issueId: string) {
    return this.aiService.detectFakes(issueId);
  }

  @Post('generate-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate AI summary of issues in an area' })
  async generateSummary(@Body('data') data: { city?: string; category?: string; days?: number }) {
    return this.aiService.generateSummary(data);
  }

  @Post('recommend-department')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recommend department for issue assignment' })
  async recommendDepartment(@Body('issueId') issueId: string) {
    return this.aiService.recommendDepartment(issueId);
  }

  @Post('calculate-impact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate impact score for an issue' })
  async calculateImpact(@Body('issueId') issueId: string) {
    return this.aiService.calculateImpact(issueId);
  }

  @Post('assess-severity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assess severity and risk of an issue' })
  async assessSeverity(@Body('issueId') issueId: string) {
    return this.aiService.assessSeverity(issueId);
  }

  /* ---------------- Unified conversational AI (single engine) ---------------- */

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI engine health and configured providers' })
  async health() {
    return {
      configured: this.engine.isConfigured,
      providers: this.engine.configuredProviders,
      streaming: true,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List current user conversations' })
  async conversations(@CurrentUser('id') userId: string) {
    return this.conversationService.listForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/latest')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the most recent conversation id' })
  async latest(@CurrentUser('id') userId: string) {
    return { conversationId: await this.conversationService.latestConversationId(userId) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a conversation with its messages' })
  async conversation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationService.getConversation(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('conversations/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rename a conversation' })
  async rename(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { title: string }) {
    return this.conversationService.rename(user.id, id, body.title || '');
  }

  @UseGuards(JwtAuthGuard)
  @Delete('conversations/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a conversation' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationService.delete(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unified AI chat with streaming support' })
  @SkipTransform()
  async chat(
    @Res() res: Response,
    @CurrentUser() user: any,
    @Body() body: { message: string; conversationId?: string; location?: { lat: number; lng: number }; stream?: boolean; isVoice?: boolean },
  ) {
    const stream = body.stream === true;
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();
      try {
        const gen = this.conversationService.chatStream(user, body);
        for await (const event of gen) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
        res.end();
      } catch (e: any) {
        this.writeSseError(res, e);
      }
      return;
    }
    try {
      const reply = await this.conversationService.chat(user, body);
      res.status(HttpStatus.OK).json({ ...reply, success: true, timestamp: new Date().toISOString() });
    } catch (e: any) {
      throw new HttpException(e.message || 'AI service error', e.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('conversations/:id/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate the last assistant reply' })
  @SkipTransform()
  async regenerate(
    @Res() res: Response,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { location?: { lat: number; lng: number }; stream?: boolean },
  ) {
    const stream = body.stream === true;
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();
      try {
        const gen = this.conversationService.regenerateStream(user, id, body.location);
        for await (const event of gen) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
        res.end();
      } catch (e: any) {
        this.writeSseError(res, e);
      }
      return;
    }
    try {
      const reply = await this.conversationService.regenerate(user, id, body.location);
      return { ...reply, success: true, timestamp: new Date().toISOString() };
    } catch (e: any) {
      throw new HttpException(e.message || 'AI service error', e.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('voice/transcribe')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transcribe voice audio (speech-to-text) for voice AI' })
  @SkipTransform()
  async transcribe(@Res() res: Response, @Body() body: { audioBase64?: string; mimeType?: string }) {
    try {
      const text = await this.aiService.transcribeAudio(body.audioBase64, body.mimeType);
      res.json({ success: true, data: { text }, timestamp: new Date().toISOString() });
    } catch (e: any) {
      res.status(e.status || 500).json({ success: false, message: e.message || 'Transcription unavailable', code: e.code, timestamp: new Date().toISOString() });
    }
  }

  @Get('voice/speak')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Text-to-speech synthesis endpoint (prepared for voice AI)' })
  @SkipTransform()
  async speak(@Res() res: Response, @Query('text') text: string) {
    try {
      const audio = await this.aiService.synthesizeSpeech(text || '');
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(audio);
    } catch (e: any) {
      res.status(e.status || 501).json({ success: false, message: e.message || 'Text-to-speech not configured', code: e.code, timestamp: new Date().toISOString() });
    }
  }

  private writeSseError(res: Response, e: any) {
    const message = e?.message || 'AI service error';
    res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
    res.end();
  }
}
