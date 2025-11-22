import apiClient from './api';

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  checkInLatitude?: string;
  checkInLongitude?: string;
  checkInLocation?: string;
  checkInNotes?: string;
  checkOutLatitude?: string;
  checkOutLongitude?: string;
  checkOutNotes?: string;
  hoursWorked?: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CheckInDto {
  latitude: number;
  longitude: number;
  location?: string;
  notes?: string;
}

export interface CheckOutDto {
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface TodayStatus {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  attendance?: Attendance;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  totalHours: number;
  averageHours: number;
  attendanceRate: number;
}

export const attendanceService = {
  // Check in
  checkIn: async (data: CheckInDto): Promise<{ message: string; attendance: Attendance; distance: number }> => {
    const response = await apiClient.post('/attendance/check-in', data);
    return response.data;
  },

  // Check out
  checkOut: async (data: CheckOutDto): Promise<{ message: string; attendance: Attendance; hoursWorked: number; distance: number }> => {
    const response = await apiClient.post('/attendance/check-out', data);
    return response.data;
  },

  // Get my attendance
  getMyAttendance: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Attendance[]> => {
    const response = await apiClient.get('/attendance/my-attendance', { params });
    return response.data;
  },

  // Get team attendance (admin only)
  getTeamAttendance: async (params?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
  }): Promise<Attendance[]> => {
    const response = await apiClient.get('/attendance/team-attendance', { params });
    return response.data;
  },

  // Get today's status
  getTodayStatus: async (): Promise<TodayStatus> => {
    const response = await apiClient.get('/attendance/today-status');
    return response.data;
  },

  // Get my stats
  getMyStats: async (days: number = 30): Promise<AttendanceStats> => {
    const response = await apiClient.get('/attendance/my-stats', { params: { days } });
    return response.data;
  },
};

// Helper function to get current location
export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};
