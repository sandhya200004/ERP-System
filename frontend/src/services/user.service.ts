import apiClient from './api';

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
}

export const userService = {
  updateProfile: async (data: UpdateProfileData): Promise<{ message: string }> => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<UploadAvatarResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getProfile: async (): Promise<any> => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },
};
