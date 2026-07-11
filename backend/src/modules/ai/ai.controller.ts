import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI Intelligence')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

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

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat with CommunityIQ AI assistant' })
  @ApiBody({ schema: { properties: { message: { type: 'string' }, history: { type: 'array', items: { type: 'object', properties: { role: { type: 'string' }, content: { type: 'string' } } } } } } })
  async chat(@Body() body: { message: string; history?: Array<{ role: string; content: string }> }) {
    return this.aiService.chat(body.message, body.history);
  }
}
