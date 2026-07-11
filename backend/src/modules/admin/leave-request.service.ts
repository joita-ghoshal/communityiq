import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequest } from '../../database/entities/leave-request.entity';

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
  ) {}

  async createRequest(
    userId: string,
    data: { type: string; reason: string; startDate?: string; endDate?: string },
  ): Promise<LeaveRequest> {
    const validTypes = ['leave', 'duty_transfer', 'other'];
    if (!validTypes.includes(data.type)) {
      throw new BadRequestException(`Invalid request type: ${data.type}. Must be one of: ${validTypes.join(', ')}`);
    }

    const request = this.leaveRequestRepository.create({
      userId,
      type: data.type,
      reason: data.reason,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      status: 'pending',
    });

    return this.leaveRequestRepository.save(request);
  }

  async getMyRequests(userId: string): Promise<LeaveRequest[]> {
    return this.leaveRequestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllRequests(): Promise<LeaveRequest[]> {
    return this.leaveRequestRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async reviewRequest(
    requestId: string,
    status: string,
    reviewedBy: string,
    reviewNote?: string,
  ): Promise<LeaveRequest> {
    const request = await this.leaveRequestRepository.findOne({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`Leave request with id ${requestId} not found`);
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(`Request has already been ${request.status}`);
    }

    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}. Must be 'approved' or 'rejected'`);
    }

    request.status = status;
    request.reviewedBy = reviewedBy;
    request.reviewNote = reviewNote || null;

    return this.leaveRequestRepository.save(request);
  }
}
