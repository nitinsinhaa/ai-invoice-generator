import notificationService from '../services/notificationService.js';
import { ApiResponse } from '../utils/response.js';

class NotificationController {
  async getStatus(req, res, next) {
    try {
      const status = await notificationService.getStatus();
      return ApiResponse.success(res, status);
    } catch (error) {
      next(error);
    }
  }

  async sendTest(req, res, next) {
    try {
      const result = await notificationService.sendTest(req.user);
      return ApiResponse.success(
        res,
        result,
        result.previewUrl
          ? 'Test email sent (Ethereal preview — check backend terminal)'
          : 'Test email sent successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
