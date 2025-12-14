import apiClient from './api';

export interface EmployeeTask {
  id: string;
  userId: string;
  date: string;
  title: string;
  description?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  hoursSpent: number;
  completedAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateTaskDto {
  userId?: string; // Optional: assign to another user
  date: string;
  title: string;
  description?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  hoursSpent: number;
}

export interface UpdateTaskDto {
  date?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  hoursSpent?: number;
}

export interface KPIMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  totalHours: number;
  completionRate: number;
  tasksByCategory: Record<string, number>;
  tasksByPriority: Record<string, number>;
  averageHoursPerTask: number;
}

export interface TeamKPIMetrics {
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  completionRate: number;
  totalEmployees: number;
  employeeStats: Array<{
    name: string;
    totalTasks: number;
    completedTasks: number;
    totalHours: number;
    completionRate: number;
  }>;
  averageTasksPerEmployee: number;
}

export const employeeTaskService = {
  // Create a new task
  createTask: async (data: CreateTaskDto): Promise<EmployeeTask> => {
    const response = await apiClient.post('/employee-tasks', data);
    return response.data;
  },

  // Get my tasks
  getMyTasks: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<EmployeeTask[]> => {
    const response = await apiClient.get('/employee-tasks/my-tasks', { params });
    return response.data;
  },

  // Get team tasks (admin only)
  getTeamTasks: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<EmployeeTask[]> => {
    const response = await apiClient.get('/employee-tasks/team-tasks', { params });
    return response.data;
  },

  // Get a specific task
  getTask: async (id: string): Promise<EmployeeTask> => {
    const response = await apiClient.get(`/employee-tasks/${id}`);
    return response.data;
  },

  // Update a task
  updateTask: async (id: string, data: UpdateTaskDto): Promise<EmployeeTask> => {
    const response = await apiClient.put(`/employee-tasks/${id}`, data);
    return response.data;
  },

  // Delete a task
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/employee-tasks/${id}`);
  },

  // Get my KPI metrics
  getMyKPI: async (params?: { startDate?: string; endDate?: string }): Promise<KPIMetrics> => {
    const response = await apiClient.get('/employee-tasks/my-kpi', { params });
    return response.data;
  },

  // Get team KPI metrics (admin only)
  getTeamKPI: async (params?: { startDate?: string; endDate?: string }): Promise<TeamKPIMetrics> => {
    const response = await apiClient.get('/employee-tasks/team-kpi', { params });
    return response.data;
  },
};
