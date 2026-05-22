import dashboardService from '../services/dashboardService.js';
import { ApiResponse } from '../utils/response.js';

class DashboardController {
  async getDashboardStats(req, res, next) {
    try {
      const { timeframe = 'monthly' } = req.query;

      const stats = await dashboardService.getDashboardStats(req.user.id, timeframe);

      return ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();
