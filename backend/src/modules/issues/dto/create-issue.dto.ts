import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueCategory, IssuePriority } from '../../../database/entities/issue.entity';

export class CreateIssueDto {
  @ApiProperty({ example: 'Pothole on Main Street near junction' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Large pothole approximately 2 feet wide causing traffic hazard...' })
  @IsString()
  @MinLength(20)
  description: string;

  @ApiProperty({ enum: IssueCategory, example: IssueCategory.ROAD_DAMAGE })
  @IsEnum(IssueCategory)
  category: IssueCategory;

  @ApiPropertyOptional({ enum: IssuePriority, default: IssuePriority.MEDIUM })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({ example: 22.5726 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 88.3639 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: '123 Main Street, Near City Hospital' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Kolkata' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'West Bengal' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '700001' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: 'Ward 5' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ type: [String], example: ['road', 'pothole', 'safety'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}
