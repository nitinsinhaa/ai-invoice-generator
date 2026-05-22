import userRepository from '../repositories/userRepository.js';
import walletRepository from '../repositories/walletRepository.js';
import refreshTokenRepository from '../repositories/refreshTokenRepository.js';
import { hashPassword, comparePassword } from '../utils/encryption.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { AppError } from '../errors/AppError.js';

function getRefreshExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

class AuthService {
  async issueTokens(user) {
    const payload = { id: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await refreshTokenRepository.create(user.id, refreshToken, getRefreshExpiryDate());
    return { accessToken, refreshToken };
  }

  async register(userData) {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw AppError.conflict('Email already registered');
    }

    const hashedPassword = await hashPassword(userData.password);
    const user = await userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    await walletRepository.create(user.id);
    const profile = await userRepository.findById(user.id);
    const tokens = await this.issueTokens(profile);

    return {
      user: profile,
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid credentials');
    }

    if (!user.is_active) {
      throw AppError.forbidden('Account is deactivated');
    }

    const profile = await userRepository.findById(user.id);
    const tokens = await this.issueTokens(profile);

    return {
      user: profile,
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(refreshToken) {
    const { verifyRefreshToken } = await import('../utils/jwt.js');
    const decoded = verifyRefreshToken(refreshToken);
    const stored = await refreshTokenRepository.findValid(decoded.id, refreshToken);
    if (!stored) {
      throw AppError.unauthorized('Refresh token revoked or expired');
    }

    await refreshTokenRepository.revokeToken(decoded.id, refreshToken);
    const profile = await userRepository.findById(decoded.id);
    if (!profile) {
      throw AppError.unauthorized('User not found');
    }

    const tokens = await this.issueTokens(profile);
    return {
      user: profile,
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId, refreshToken) {
    if (refreshToken) {
      await refreshTokenRepository.revokeToken(userId, refreshToken);
    } else {
      await refreshTokenRepository.revokeByUser(userId);
    }
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  }

  async updateProfile(userId, updateData) {
    const allowedFields = [
      'email', 'password', 'full_name', 'company_name', 'company_logo',
      'phone', 'address', 'city', 'state', 'country', 'zip_code', 'tax_id',
      'currency', 'theme', 'email_notifications',
      'tax_type', 'gst_rate', 'cgst_rate', 'sgst_rate', 'igst_rate',
    ];

    const sanitized = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        sanitized[key] = updateData[key];
      }
    }

    if (sanitized.password) {
      sanitized.password = await hashPassword(sanitized.password);
    }

    const user = await userRepository.update(userId, sanitized);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  }
}

export default new AuthService();
