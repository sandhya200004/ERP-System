import axios from 'axios';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  key: string;
  name: string;
  permissions: string[];
}

export interface PermissionsResponse {
  permissions: Permission[];
  grouped: Record<string, Permission[]>;
  features: Feature[];
}

class RoleSettingsService {
  private getAuthHeader() {
    const token = localStorage.getItem('accessToken');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  // Get all roles with permissions
  async getAllRolesWithPermissions(): Promise<Role[]> {
    const response = await axios.get<Role[]>(
      `${API_URL}/api/v1/role-settings/roles`,
      this.getAuthHeader()
    );
    return response.data;
  }

  // Get all available permissions
  async getAllPermissions(): Promise<PermissionsResponse> {
    const response = await axios.get<PermissionsResponse>(
      `${API_URL}/api/v1/role-settings/permissions`,
      this.getAuthHeader()
    );
    return response.data;
  }

  // Get features list
  async getFeaturesList(): Promise<Feature[]> {
    const response = await axios.get<Feature[]>(
      `${API_URL}/api/v1/role-settings/features`,
      this.getAuthHeader()
    );
    return response.data;
  }

  // Get role by ID
  async getRoleWithPermissions(roleId: string): Promise<Role> {
    const response = await axios.get<Role>(
      `${API_URL}/api/v1/role-settings/roles/${roleId}`,
      this.getAuthHeader()
    );
    return response.data;
  }

  // Update role permissions
  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<Role[]> {
    const response = await axios.put<Role[]>(
      `${API_URL}/api/v1/role-settings/roles/${roleId}/permissions`,
      { permissionIds },
      this.getAuthHeader()
    );
    return response.data;
  }

  // Toggle feature for roles
  async toggleFeature(
    featureKey: string,
    enabled: boolean,
    roleIds: string[]
  ): Promise<Role[]> {
    const response = await axios.post<Role[]>(
      `${API_URL}/api/v1/role-settings/toggle-feature`,
      { featureKey, enabled, roleIds },
      this.getAuthHeader()
    );
    return response.data;
  }

  // Bulk update permissions
  async bulkUpdatePermissions(
    roleId: string,
    addPermissions: string[],
    removePermissions: string[]
  ): Promise<Role[]> {
    const response = await axios.post<Role[]>(
      `${API_URL}/api/v1/role-settings/bulk-update`,
      { roleId, addPermissions, removePermissions },
      this.getAuthHeader()
    );
    return response.data;
  }

  // Create new permission
  async createPermission(data: {
    name: string;
    resource: string;
    action: string;
    description?: string;
  }): Promise<Permission> {
    const response = await axios.post<Permission>(
      `${API_URL}/api/v1/role-settings/permissions`,
      data,
      this.getAuthHeader()
    );
    return response.data;
  }

  // Check if role has feature
  async hasFeature(roleId: string, featureKey: string): Promise<boolean> {
    const response = await axios.get<{ enabled: boolean }>(
      `${API_URL}/api/v1/role-settings/roles/${roleId}/features/${featureKey}`,
      this.getAuthHeader()
    );
    return response.data.enabled;
  }
}

export default new RoleSettingsService();
