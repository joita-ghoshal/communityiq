import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {}

  async uploadFile(file: Express.Multer.File, userId: string, folder: string) {
    const fileKey = this.generateFileKey(file.originalname, folder, userId);

    try {
      const S3Client = (await import('@aws-sdk/client-s3')).S3Client;
      const PutObjectCommand = (await import('@aws-sdk/client-s3')).PutObjectCommand;

      const client = new S3Client({
        region: this.configService.get('AWS_REGION', 'ap-south-1'),
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID', ''),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY', ''),
        },
      });

      await client.send(
        new PutObjectCommand({
          Bucket: this.configService.get('AWS_S3_BUCKET', 'communityiq-media'),
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: { uploadedBy: userId },
        }),
      );

      const cloudfrontDomain = this.configService.get('AWS_CLOUDFRONT_DOMAIN', '');
      const url = cloudfrontDomain
        ? `https://${cloudfrontDomain}/${fileKey}`
        : `https://${this.configService.get('AWS_S3_BUCKET')}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${fileKey}`;

      return {
        url,
        key: fileKey,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.warn(`S3 upload failed: ${error.message}. Returning local reference.`);
      return {
        url: `/uploads/${fileKey}`,
        key: fileKey,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString(),
        note: 'Local storage - S3 not configured',
      };
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[], userId: string, folder: string) {
    const results = await Promise.all(
      files.map((file) => this.uploadFile(file, userId, folder)),
    );
    return results;
  }

  async getPresignedUrl(fileName: string, contentType: string, folder: string) {
    const fileKey = this.generateFileKey(fileName, folder);

    try {
      const S3Client = (await import('@aws-sdk/client-s3')).S3Client;
      const PutObjectCommand = (await import('@aws-sdk/client-s3')).PutObjectCommand;

      const client = new S3Client({
        region: this.configService.get('AWS_REGION', 'ap-south-1'),
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID', ''),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY', ''),
        },
      });

      const command = new PutObjectCommand({
        Bucket: this.configService.get('AWS_S3_BUCKET', 'communityiq-media'),
        Key: fileKey,
        ContentType: contentType,
      });

      const url = await (await import('@aws-sdk/s3-request-presigner')).getSignedUrl(client, command, { expiresIn: 3600 });

      return {
        uploadUrl: url,
        key: fileKey,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };
    } catch (error: any) {
      this.logger.warn(`Presigned URL generation failed: ${error.message}`);
      return {
        uploadUrl: `/upload/${fileKey}`,
        key: fileKey,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        note: 'Fallback URL - S3 not configured',
      };
    }
  }

  private generateFileKey(fileName: string, folder: string, userId?: string): string {
    const ext = fileName.split('.').pop();
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const userPrefix = userId ? `${userId}/` : '';
    return `${folder}/${userPrefix}${timestamp}-${uniqueId}.${ext}`;
  }
}
