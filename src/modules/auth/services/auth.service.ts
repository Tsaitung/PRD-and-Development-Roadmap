/**
 * Authentication Service
 * 身份驗證服務
 * 
 * @module AuthService
 * @version 1.0.0
 * @since 2025-08-25
 */

import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refreshToken.entity';
import { LoginAttempt } from '../entities/loginAttempt.entity';
import { 
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ResetPasswordDto,
  ChangePasswordDto,
  TokenResponse,
  UserResponse,
  TwoFactorSetupResponse,
  VerifyTwoFactorDto
} from '../dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@/common/services/cache.service';
import { EmailService } from '@/common/services/email.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthEvents } from '../events/auth.events';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 30; // minutes
  private readonly tokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly emailService: EmailService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * User Registration
   */
  async register(dto: RegisterDto): Promise<UserResponse> {
    this.logger.log(`Registering new user: ${dto.email}`);

    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: dto.email },
        { username: dto.username }
      ]
    });

    if (existingUser) {
      throw new BadRequestException('User already exists with this email or username');
    }

    // Validate password strength
    this.validatePasswordStrength(dto.password);

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      isActive: false,
      emailVerified: false,
      createdAt: new Date()
    });

    await this.userRepository.save(user);

    // Generate email verification token
    const verificationToken = this.generateVerificationToken();
    await this.cacheService.set(
      `email-verification:${verificationToken}`,
      user.id,
      3600 * 24 // 24 hours
    );

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    // Emit registration event
    this.eventEmitter.emit(AuthEvents.USER_REGISTERED, {
      userId: user.id,
      email: user.email,
      timestamp: new Date()
    });

    return this.sanitizeUser(user);
  }

  /**
   * User Login
   */
  async login(dto: LoginDto): Promise<TokenResponse> {
    this.logger.log(`Login attempt for: ${dto.username}`);

    // Check for account lockout
    await this.checkAccountLockout(dto.username);

    // Find user
    const user = await this.userRepository.findOne({
      where: [
        { email: dto.username },
        { username: dto.username }
      ],
      select: ['id', 'email', 'username', 'password', 'isActive', 'emailVerified', 'twoFactorEnabled', 'twoFactorSecret', 'roles']
    });

    if (!user) {
      await this.recordFailedLogin(dto.username, dto.ipAddress);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      await this.recordFailedLogin(dto.username, dto.ipAddress, user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is not active');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      // Generate temporary token for 2FA verification
      const tempToken = this.generateTempToken(user.id);
      await this.cacheService.set(
        `2fa-temp:${tempToken}`,
        user.id,
        300 // 5 minutes
      );

      return {
        requiresTwoFactor: true,
        tempToken,
        accessToken: null,
        refreshToken: null,
        expiresIn: null
      };
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Record successful login
    await this.recordSuccessfulLogin(user.id, dto.ipAddress, dto.userAgent);

    // Clear failed login attempts
    await this.clearFailedAttempts(dto.username);

    // Emit login event
    this.eventEmitter.emit(AuthEvents.USER_LOGGED_IN, {
      userId: user.id,
      ipAddress: dto.ipAddress,
      timestamp: new Date()
    });

    return tokens;
  }

  /**
   * Verify Two-Factor Authentication
   */
  async verifyTwoFactor(dto: VerifyTwoFactorDto): Promise<TokenResponse> {
    // Get user ID from temp token
    const userId = await this.cacheService.get<string>(`2fa-temp:${dto.tempToken}`);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'twoFactorSecret', 'roles']
    });

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('Two-factor authentication not configured');
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: dto.code,
      window: 2 // Allow 2 time steps tolerance
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    // Delete temp token
    await this.cacheService.del(`2fa-temp:${dto.tempToken}`);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Record successful 2FA
    this.eventEmitter.emit(AuthEvents.TWO_FACTOR_VERIFIED, {
      userId: user.id,
      timestamp: new Date()
    });

    return tokens;
  }

  /**
   * Setup Two-Factor Authentication
   */
  async setupTwoFactor(userId: string): Promise<TwoFactorSetupResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Tsaitung ERP (${user.email})`,
      issuer: 'Tsaitung'
    });

    // Save secret temporarily
    await this.cacheService.set(
      `2fa-setup:${userId}`,
      secret.base32,
      600 // 10 minutes
    );

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: this.generateBackupCodes()
    };
  }

  /**
   * Enable Two-Factor Authentication
   */
  async enableTwoFactor(userId: string, code: string): Promise<void> {
    // Get temporary secret
    const secret = await this.cacheService.get<string>(`2fa-setup:${userId}`);
    if (!secret) {
      throw new BadRequestException('Two-factor setup expired or not initiated');
    }

    // Verify code
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    // Update user
    await this.userRepository.update(userId, {
      twoFactorEnabled: true,
      twoFactorSecret: secret
    });

    // Clear setup cache
    await this.cacheService.del(`2fa-setup:${userId}`);

    // Emit event
    this.eventEmitter.emit(AuthEvents.TWO_FACTOR_ENABLED, {
      userId,
      timestamp: new Date()
    });
  }

  /**
   * Refresh Access Token
   */
  async refreshToken(dto: RefreshTokenDto): Promise<TokenResponse> {
    // Verify refresh token
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { 
        token: dto.refreshToken,
        isRevoked: false
      },
      relations: ['user']
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if expired
    if (moment(refreshToken.expiresAt).isBefore(moment())) {
      await this.refreshTokenRepository.update(refreshToken.id, { isRevoked: true });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(refreshToken.user);

    // Revoke old refresh token
    await this.refreshTokenRepository.update(refreshToken.id, { isRevoked: true });

    return tokens;
  }

  /**
   * Logout
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    // Revoke refresh token
    if (refreshToken) {
      await this.refreshTokenRepository.update(
        { token: refreshToken, userId },
        { isRevoked: true }
      );
    }

    // Clear user cache
    await this.cacheService.del(`user:${userId}`);
    await this.cacheService.del(`user-permissions:${userId}`);

    // Emit logout event
    this.eventEmitter.emit(AuthEvents.USER_LOGGED_OUT, {
      userId,
      timestamp: new Date()
    });
  }

  /**
   * Request Password Reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token
    const resetToken = this.generateResetToken();
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Save reset token
    await this.cacheService.set(
      `password-reset:${hashedToken}`,
      user.id,
      3600 // 1 hour
    );

    // Send reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    // Emit event
    this.eventEmitter.emit(AuthEvents.PASSWORD_RESET_REQUESTED, {
      userId: user.id,
      timestamp: new Date()
    });
  }

  /**
   * Reset Password
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    // Hash the token to find in cache
    const hashedToken = await bcrypt.hash(dto.token, 10);
    const userId = await this.cacheService.get<string>(`password-reset:${hashedToken}`);

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate new password
    this.validatePasswordStrength(dto.newPassword);

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    // Update password
    await this.userRepository.update(userId, {
      password: hashedPassword,
      passwordChangedAt: new Date()
    });

    // Clear reset token
    await this.cacheService.del(`password-reset:${hashedToken}`);

    // Revoke all refresh tokens
    await this.refreshTokenRepository.update(
      { userId },
      { isRevoked: true }
    );

    // Send confirmation email
    const user = await this.userRepository.findOne({ where: { id: userId } });
    await this.emailService.sendPasswordChangedEmail(user.email);

    // Emit event
    this.eventEmitter.emit(AuthEvents.PASSWORD_RESET, {
      userId,
      timestamp: new Date()
    });
  }

  /**
   * Change Password
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password']
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password
    this.validatePasswordStrength(dto.newPassword);

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    // Update password
    await this.userRepository.update(userId, {
      password: hashedPassword,
      passwordChangedAt: new Date()
    });

    // Revoke all refresh tokens
    await this.refreshTokenRepository.update(
      { userId },
      { isRevoked: true }
    );

    // Emit event
    this.eventEmitter.emit(AuthEvents.PASSWORD_CHANGED, {
      userId,
      timestamp: new Date()
    });
  }

  /**
   * Verify Email
   */
  async verifyEmail(token: string): Promise<void> {
    const userId = await this.cacheService.get<string>(`email-verification:${token}`);
    if (!userId) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Update user
    await this.userRepository.update(userId, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true
    });

    // Clear verification token
    await this.cacheService.del(`email-verification:${token}`);

    // Emit event
    this.eventEmitter.emit(AuthEvents.EMAIL_VERIFIED, {
      userId,
      timestamp: new Date()
    });
  }

  /**
   * Get Current User
   */
  async getCurrentUser(userId: string): Promise<UserResponse> {
    // Try cache first
    const cached = await this.cacheService.get<UserResponse>(`user:${userId}`);
    if (cached) {
      return cached;
    }

    // Get from database
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'permissions']
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const sanitized = this.sanitizeUser(user);

    // Cache user data
    await this.cacheService.set(`user:${userId}`, sanitized, 300); // 5 minutes

    return sanitized;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: Partial<User>): Promise<TokenResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles?.map(r => r.name) || []
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.tokenExpiry
    });

    // Generate refresh token
    const refreshTokenValue = uuidv4();
    const refreshToken = this.refreshTokenRepository.create({
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: moment().add(7, 'days').toDate(),
      createdAt: new Date()
    });

    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer',
      requiresTwoFactor: false
    };
  }

  /**
   * Check account lockout
   */
  private async checkAccountLockout(username: string): Promise<void> {
    const recentAttempts = await this.loginAttemptRepository.count({
      where: {
        username,
        successful: false,
        attemptedAt: moment().subtract(this.lockoutDuration, 'minutes').toDate()
      }
    });

    if (recentAttempts >= this.maxLoginAttempts) {
      const lockoutEnd = moment().add(this.lockoutDuration, 'minutes');
      throw new UnauthorizedException(
        `Account locked due to too many failed attempts. Try again after ${lockoutEnd.format('HH:mm')}`
      );
    }
  }

  /**
   * Record failed login attempt
   */
  private async recordFailedLogin(
    username: string,
    ipAddress?: string,
    userId?: string
  ): Promise<void> {
    const attempt = this.loginAttemptRepository.create({
      username,
      userId,
      ipAddress,
      successful: false,
      attemptedAt: new Date()
    });

    await this.loginAttemptRepository.save(attempt);
  }

  /**
   * Record successful login
   */
  private async recordSuccessfulLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const attempt = this.loginAttemptRepository.create({
      userId,
      ipAddress,
      userAgent,
      successful: true,
      attemptedAt: new Date()
    });

    await this.loginAttemptRepository.save(attempt);

    // Update last login
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress
    });
  }

  /**
   * Clear failed login attempts
   */
  private async clearFailedAttempts(username: string): Promise<void> {
    await this.loginAttemptRepository.delete({
      username,
      successful: false
    });
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    if (password.length < minLength) {
      throw new BadRequestException(`Password must be at least ${minLength} characters long`);
    }

    if (!hasUpperCase || !hasLowerCase) {
      throw new BadRequestException('Password must contain both uppercase and lowercase letters');
    }

    if (!hasNumbers) {
      throw new BadRequestException('Password must contain at least one number');
    }

    if (!hasSpecialChar) {
      throw new BadRequestException('Password must contain at least one special character (!@#$%^&*)');
    }
  }

  /**
   * Sanitize user data
   */
  private sanitizeUser(user: User): UserResponse {
    const { password, twoFactorSecret, ...sanitized } = user;
    return sanitized as UserResponse;
  }

  /**
   * Generate verification token
   */
  private generateVerificationToken(): string {
    return uuidv4();
  }

  /**
   * Generate reset token
   */
  private generateResetToken(): string {
    return uuidv4();
  }

  /**
   * Generate temporary token for 2FA
   */
  private generateTempToken(userId: string): string {
    return `${userId}-${uuidv4()}`;
  }

  /**
   * Generate backup codes for 2FA
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
    }
    return codes;
  }
}