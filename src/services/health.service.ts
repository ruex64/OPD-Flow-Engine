export class HealthService {
  async getHealthStatus() {
    return {
      success: true,
      message: 'OPD Flow Engine is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
