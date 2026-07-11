import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueCategory, IssueStatus, IssuePriority } from '../../../database/entities/issue.entity';

export class IssueResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: IssueCategory })
  category: IssueCategory;

  @ApiProperty({ enum: IssueStatus })
  status: IssueStatus;

  @ApiProperty({ enum: IssuePriority })
  priority: IssuePriority;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiProperty()
  upvotes: number;

  @ApiProperty()
  downvotes: number;

  @ApiProperty()
  communityScore: number;

  @ApiProperty()
  impactScore: number;

  @ApiProperty()
  riskScore: number;

  @ApiProperty()
  createdAt: Date;
}
