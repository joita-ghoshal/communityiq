import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { LeaveRequestService } from './leave-request.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly leaveRequestService: LeaveRequestService,
  ) {}

  @Get('users')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination and optional role filter' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'role', type: String, required: false })
  async getAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('role') role?: string,
  ) {
    return this.adminService.getAllUsers(Number(page), Number(limit), role);
  }

  @Get('users/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: { properties: { role: { type: 'string', enum: Object.values(UserRole) } } } })
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.updateUserRole(id, role);
  }

  @Patch('users/:id/department')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign user to a department' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: { properties: { departmentId: { type: 'string' } } } })
  async updateUserDepartment(
    @Param('id') id: string,
    @Body('departmentId') departmentId: string,
  ) {
    return this.adminService.updateUserDepartment(id, departmentId);
  }

  @Delete('users/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate (soft delete) a user' })
  @ApiParam({ name: 'id', type: String })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('departments')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiBody({ schema: { properties: { name: { type: 'string' }, description: { type: 'string' } } } })
  async createDepartment(@Body() body: { name: string; description?: string }) {
    return this.adminService.createDepartment(body);
  }

  @Get('departments')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all departments' })
  async getDepartments() {
    return this.adminService.getDepartments();
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a leave/duty transfer request' })
  @ApiBody({ schema: { properties: { type: { type: 'string' }, reason: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' } } } })
  async createRequest(
    @CurrentUser('id') userId: string,
    @Body() body: { type?: string; reason?: string; title?: string; description?: string; startDate?: string; endDate?: string },
  ) {
    const requestData = {
      type: body.type || 'other',
      reason: body.reason || body.description || body.title || '',
      startDate: body.startDate,
      endDate: body.endDate,
    };
    return this.leaveRequestService.createRequest(userId, requestData);
  }

  @Get('requests/mine')
  @ApiOperation({ summary: 'Get current user\'s leave requests' })
  async getMyRequests(@CurrentUser('id') userId: string) {
    return this.leaveRequestService.getMyRequests(userId);
  }

  @Get('requests')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all leave requests (super admin)' })
  async getAllRequests() {
    return this.leaveRequestService.getAllRequests();
  }

  @Patch('requests/:id/review')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject a leave request' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: { properties: { status: { type: 'string', enum: ['approved', 'rejected'] }, reviewNote: { type: 'string' } } } })
  async reviewRequest(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('status') status: string,
    @Body('reviewNote') reviewNote?: string,
  ) {
    return this.leaveRequestService.reviewRequest(id, status, userId, reviewNote);
  }
}
