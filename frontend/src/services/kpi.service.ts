import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface EmployeeKPIResponse {
  employeeId: string;
  kpiScore: number;
  breakdown: {
    timelinessScore: number;
    qualityScore: number;
    effortAccuracyScore: number;
    peerReviewScore: number;
    autoVerificationScore: number;
  };
  totalTasks: number;
  completedTasks: number;
  avgTaskScore: number;
  onTimePercentage: number;
}

export interface KPIHistoryResponse {
  id: string;
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  kpiScore: number;
  normalizedScore: number;
  breakdown: {
    timeliness: number;
    quality: number;
    effortAccuracy: number;
    peerReview: number;
    autoVerification: number;
  };
  totalTasks: number;
  completedTasks: number;
  avgTaskScore: number;
  rank?: number;
  createdAt: Date;
}

export interface TeamKPIResponse {
  employees: {
    employeeId: string;
    employeeName: string;
    designation: string;
    department: string;
    role: string;
    kpiScore: number;
    normalizedScore: number;
    totalTasks: number;
    completedTasks: number;
    avgTaskScore: number;
    onTimePercentage: number;
  }[];
  roleStats: {
    [role: string]: {
      mean: number;
      stdDev: number;
      count: number;
    };
  };
}

class KPIService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  /**
   * Get KPI for a specific employee
   */
  async getEmployeeKPI(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<EmployeeKPIResponse> {
    const response = await axios.get(
      `${API_URL}/kpi/employee/${employeeId}`,
      {
        ...this.getAuthHeaders(),
        params: { startDate, endDate },
      }
    );
    return response.data;
  }

  /**
   * Get KPI history for an employee
   */
  async getKPIHistory(employeeId: string): Promise<KPIHistoryResponse[]> {
    const response = await axios.get(
      `${API_URL}/kpi/employee/${employeeId}/history`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  /**
   * Get team KPI with normalization
   */
  async getTeamKPI(
    startDate: string,
    endDate: string,
    companyId?: string
  ): Promise<TeamKPIResponse> {
    const response = await axios.get(`${API_URL}/kpi/team`, {
      ...this.getAuthHeaders(),
      params: { startDate, endDate, companyId },
    });
    return response.data;
  }

  /**
   * Recalculate task score (admin/manager)
   */
  async recalculateTaskScore(taskId: string): Promise<{ taskScore: number; penaltyPct: number }> {
    const response = await axios.post(
      `${API_URL}/kpi/task/${taskId}/recalculate`,
      {},
      this.getAuthHeaders()
    );
    return response.data;
  }

  /**
   * Publish monthly KPI snapshot
   */
  async publishMonthlyKPI(
    employeeId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<KPIHistoryResponse> {
    const response = await axios.post(
      `${API_URL}/kpi/employee/${employeeId}/publish-monthly`,
      { periodStart, periodEnd },
      this.getAuthHeaders()
    );
    return response.data;
  }

  /**
   * Get aggregated statistics for dashboard
   */
  async getDashboardStats(startDate: string, endDate: string) {
    const teamKPI = await this.getTeamKPI(startDate, endDate);

    const totalMembers = teamKPI.employees.length;
    const avgKPI =
      teamKPI.employees.reduce((sum, emp) => sum + emp.kpiScore, 0) /
      (totalMembers || 1);
    const totalTasks = teamKPI.employees.reduce(
      (sum, emp) => sum + emp.totalTasks,
      0
    );
    const completedTasks = teamKPI.employees.reduce(
      (sum, emp) => sum + emp.completedTasks,
      0
    );
    const completionRate = (completedTasks / (totalTasks || 1)) * 100;

    return {
      avgKPI: Math.round(avgKPI * 10) / 10,
      totalMembers,
      totalTasks,
      completionRate: Math.round(completionRate * 10) / 10,
    };
  }

  /**
   * Get KPI trend history for charts (last N months)
   */
  async getKPITrend(employeeId: string, months: number = 4) {
    const history = await this.getKPIHistory(employeeId);
    return history
      .slice(0, months)
      .reverse()
      .map((record) => ({
        month: new Date(record.periodStart).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        overall: Math.round(record.kpiScore * 10) / 10,
        timeliness: Math.round(record.breakdown.timeliness * 10) / 10,
        quality: Math.round(record.breakdown.quality * 10) / 10,
        efficiency: Math.round(record.breakdown.effortAccuracy * 10) / 10,
      }));
  }
}

export const kpiService = new KPIService();
