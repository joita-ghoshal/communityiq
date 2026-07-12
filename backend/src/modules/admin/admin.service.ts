import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../database/entities/user.entity';
import { Department } from '../../database/entities/department.entity';
import { LeaveRequest } from '../../database/entities/leave-request.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
  ) {}

  async getAllUsers(
    page: number = 1,
    limit: number = 20,
    role?: string,
  ): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const qb = this.userRepository.createQueryBuilder('user');

    if (role) {
      qb.where('user.role = :role', { role });
    }

    qb.orderBy('user.createdAt', 'DESC');

    const total = await qb.getCount();
    const users = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    user.role = role;
    return this.userRepository.save(user);
  }

  async updateUserDepartment(userId: string, departmentId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const department = await this.departmentRepository.findOne({ where: { id: departmentId } });
    if (!department) {
      throw new NotFoundException(`Department with id ${departmentId} not found`);
    }

    user.preferences = {
      ...user.preferences,
      departmentId,
    };

    return this.userRepository.save(user);
  }

  async deleteUser(userId: string): Promise<{ message: string; id: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    user.isActive = false;
    await this.userRepository.save(user);

    return { message: 'User deactivated successfully', id: userId };
  }

  async getDepartments(): Promise<Department[]> {
    return this.departmentRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createDepartment(data: { name: string; description?: string }): Promise<Department> {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Department name is required');
    }
    const existing = await this.departmentRepository.findOne({ where: { name: data.name.trim() } });
    if (existing) {
      throw new BadRequestException('Department with this name already exists');
    }
    const department = this.departmentRepository.create({
      name: data.name.trim(),
      description: data.description || '',
      isActive: true,
    });
    return this.departmentRepository.save(department);
  }

  async updateDepartment(id: string, data: { name?: string; description?: string; headId?: string }): Promise<Department> {
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }
    if (data.name !== undefined) department.name = data.name;
    if (data.description !== undefined) department.description = data.description;
    if (data.headId !== undefined) (department as any).headId = data.headId;
    return this.departmentRepository.save(department);
  }

  async deleteDepartment(id: string): Promise<{ message: string; id: string }> {
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }
    department.isActive = false;
    await this.departmentRepository.save(department);
    return { message: 'Department deactivated successfully', id };
  }

  private platformSettings: Record<string, any> = {
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    autoAssignIssues: true,
    maxIssuesPerUser: 50,
    issueExpiryDays: 30,
    defaultPriority: 'medium',
    aiAnalysisEnabled: true,
    communityVerificationRequired: true,
  };

  async getSettings(): Promise<Record<string, any>> {
    return this.platformSettings;
  }

  async updateSettings(data: Record<string, any>): Promise<Record<string, any>> {
    this.platformSettings = { ...this.platformSettings, ...data };
    return this.platformSettings;
  }
}
