import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../../database/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    const emailVerificationToken = uuidv4();

    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      emailVerificationToken,
      role: registerDto.role || UserRole.CITIZEN,
    });

    const savedUser = await this.userRepository.save(user);

    const tokens = await this.generateTokens(savedUser.id, savedUser.email, savedUser.role);

    await this.userRepository.update(savedUser.id, {
      refreshToken: await bcrypt.hash(tokens.refreshToken, 10),
    });

    const { password, refreshToken, mfaSecret, resetPasswordToken, emailVerificationToken: evToken, ...userResponse } = savedUser;

    return {
      user: userResponse,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'mfaEnabled', 'mfaSecret', 'isActive'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mfaEnabled && loginDto.mfaCode) {
      const isMfaValid = this.verifyTotpCode(user.mfaSecret, loginDto.mfaCode);
      if (!isMfaValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    } else if (user.mfaEnabled && !loginDto.mfaCode) {
      return {
        mfaRequired: true,
        message: 'MFA verification required',
      };
    }

    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.userRepository.update(user.id, {
      refreshToken: await bcrypt.hash(tokens.refreshToken, 10),
    });

    const { password, mfaSecret, ...userResponse } = user;

    return {
      user: userResponse,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'role', 'refreshToken', 'isActive'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.userRepository.update(user.id, {
      refreshToken: await bcrypt.hash(tokens.refreshToken, 10),
    });

    return tokens;
  }

  async logout(userId: string) {
    await this.userRepository.update(userId, {
      refreshToken: null,
    });

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000);

    await this.userRepository.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    });

    return { message: 'If the email exists, a reset link has been sent', resetToken };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.userRepository.update(user.id, {
      emailVerified: true,
      isVerified: true,
      emailVerificationToken: null,
    });

    return { message: 'Email verified successfully' };
  }

  async enableMfa(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = this.generateTotpSecret();
    const otpauthUrl = `otpauth://totp/${this.configService.get('MFA_ISSUER', 'CommunityIQ')}:${user.email}?secret=${secret}&issuer=${this.configService.get('MFA_ISSUER', 'CommunityIQ')}`;

    await this.userRepository.update(userId, {
      mfaSecret: secret,
    });

    return {
      secret,
      otpauthUrl,
      message: 'Scan the QR code with your authenticator app',
    };
  }

  async verifyMfa(userId: string, code: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'mfaSecret'],
    });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA not set up');
    }

    const isValid = this.verifyTotpCode(user.mfaSecret, code);

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.userRepository.update(userId, {
      mfaEnabled: true,
    });

    return { message: 'MFA enabled successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private generateTotpSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private verifyTotpCode(secret: string, code: string): boolean {
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = 30;
    const time = Math.floor(epoch / timeStep);

    for (let i = -1; i <= 1; i++) {
      const counter = time + i;
      if (this.generateTotp(secret, counter) === code) {
        return true;
      }
    }
    return false;
  }

  private generateTotp(secret: string, counter: number): string {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(0, 0);
    buffer.writeUInt32BE(counter, 4);

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base64'));
    hmac.update(buffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0x0f;
    const otp =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    return String(otp % 1000000).padStart(6, '0');
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'isActive'],
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }
}
