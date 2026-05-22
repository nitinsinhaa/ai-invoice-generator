import authService from '../services/authService.js';
import { ApiResponse } from '../utils/response.js';
import notificationService from '../services/notificationService.js';

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, full_name, company_name } = req.body;

      const result = await authService.register({
        email,
        password,
        full_name,
        company_name,
      });

      await notificationService.sendWelcome(email, full_name, {
        email_notifications: true,
      });

      return ApiResponse.created(res, result, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      return ApiResponse.success(res, result, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id, req.body?.refreshToken);
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);

      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.id, req.body);

      return ApiResponse.success(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
