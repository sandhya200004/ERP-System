import apiClient from './apiClient';

export interface Employee {
  id: string;
  employeeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  designation: string;
  department: string;
  role: string;
  joiningDate: string;
  managerId?: string;
  managerName?: string;
  status: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation: string;
  department: string;
  role: string;
  managerId?: string;
  joiningDate: string;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  designation?: string;
  department?: string;
  role?: string;
  managerId?: string;
}

const employeeService = {
  async getAll(): Promise<Employee[]> {
    const response = await apiClient.get('/employees');
    return response.data;
  },

  async getById(id: string): Promise<Employee> {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  async create(data: CreateEmployeeDto): Promise<Employee> {
    const response = await apiClient.post('/employees', data);
    return response.data;
  },

  async update(id: string, data: UpdateEmployeeDto): Promise<Employee> {
    const response = await apiClient.put(`/employees/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/employees/${id}`);
  },

  async getTeam(managerId: string): Promise<Employee[]> {
    const response = await apiClient.get(`/employees/${managerId}/team`);
    return response.data;
  },

  async getHierarchy(employeeId: string): Promise<any> {
    const response = await apiClient.get(`/employees/${employeeId}/hierarchy`);
    return response.data;
  },
};

export { employeeService };
