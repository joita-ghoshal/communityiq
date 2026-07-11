import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API root' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getRoot() {
    return {
      name: 'CommunityIQ API',
      version: '1.0.0',
      docs: '/docs',
      health: '/api/v1/health',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness check' })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  getReadiness() {
    return this.appService.getReadiness();
  }
}
