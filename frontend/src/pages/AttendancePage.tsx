import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Calendar,
  Badge,
  Select,
  Modal,
  App,
  Tooltip,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  WarningOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useAuthStore } from '../store/authStore';
import { attendanceService } from '../services/attendance.service';
import EmployeeBadgeModal from '../components/EmployeeBadgeModal';

const { Title, Text } = Typography;

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'late' | 'absent' | 'half-day';
  workingHours?: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  distance: number;
  isValid: boolean;
  timestamp: number;
}

const AttendancePage: React.FC = () => {
  const { message } = App.useApp();
  const { user } = useAuthStore();

  // RBCA: Backend will enforce permissions via API guards
  // Frontend just needs to handle error responses gracefully
  const canViewTeam = user?.role === 'ADMIN' || user?.role === 'LEAD_MANAGER';

  // Office Configuration
  const OFFICE_CONFIG = {
    location: { latitude: 18.7351, longitude: 73.6758, name: 'Main Office' },
    radiusMeters: 500,
    startTime: '09:30',
    endTime: '18:30',
    lateThresholdMinutes: 15,
  };

  // State Management
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [location, setLocation] = useState<LocationData | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'my' | 'team'>('my');
  const [teamLoading, setTeamLoading] = useState(false);

  // ============== Location Utilities ==============
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  const verifyLocationOnce = useCallback(async (): Promise<LocationData | null> => {
    if (!('geolocation' in navigator)) {
      message.error('Geolocation not supported by your browser');
      return null;
    }

    // Cache location for 30 seconds to avoid redundant calls
    if (location && Date.now() - location.timestamp < 30000) {
      return location;
    }

    return new Promise((resolve) => {
      setVerifying(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            OFFICE_CONFIG.location.latitude,
            OFFICE_CONFIG.location.longitude
          );

          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            distance: Math.round(distance),
            isValid: distance <= OFFICE_CONFIG.radiusMeters,
            timestamp: Date.now(),
          };

          setLocation(locationData);
          setVerifying(false);
          resolve(locationData);
        },
        (error) => {
          setVerifying(false);
          console.error('Location error:', error);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [location, calculateDistance, message, OFFICE_CONFIG]);

  // ============== Data Fetching ==============
  const fetchTodayStatus = useCallback(async () => {
    try {
      const status = await attendanceService.getTodayStatus();
      if (status.hasCheckedIn && status.attendance) {
        const att = status.attendance;
        const record: AttendanceRecord = {
          id: att.id,
          userId: att.userId,
          userName: att.user ? `${att.user.firstName} ${att.user.lastName}` : 'Unknown',
          date: att.date,
          checkIn: att.checkIn,
          checkOut: att.checkOut,
          status: calculateAttendanceStatus(att.checkIn),
          workingHours: att.hoursWorked,
        };
        setTodayAttendance(record);
      } else {
        setTodayAttendance(null);
      }
    } catch (error) {
      console.error('Failed to fetch today status:', error);
    }
  }, []);

  const fetchMyAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const startOfMonth = selectedMonth.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = selectedMonth.endOf('month').format('YYYY-MM-DD');

      const attendances = await attendanceService.getMyAttendance({
        startDate: startOfMonth,
        endDate: endOfMonth,
      });

      const mapped = attendances.map((att) => ({
        id: att.id,
        userId: att.userId,
        userName: att.user ? `${att.user.firstName} ${att.user.lastName}` : 'Unknown',
        date: att.date,
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        status: calculateAttendanceStatus(att.checkIn),
        workingHours: att.hoursWorked,
      }));

      setAttendanceHistory(mapped);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      message.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, message]);

  const fetchTeamAttendance = useCallback(async () => {
    if (!canViewTeam) {
      message.error('Insufficient permissions');
      return;
    }

    try {
      setTeamLoading(true);
      const startOfMonth = selectedMonth.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = selectedMonth.endOf('month').format('YYYY-MM-DD');

      const attendances = await attendanceService.getTeamAttendance({
        startDate: startOfMonth,
        endDate: endOfMonth,
      });

      const mapped = attendances.map((att) => ({
        id: att.id,
        userId: att.userId,
        userName: att.user ? `${att.user.firstName} ${att.user.lastName}` : 'Unknown',
        date: att.date,
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        status: calculateAttendanceStatus(att.checkIn),
        workingHours: att.hoursWorked,
      }));

      setAttendanceHistory(mapped);
    } catch (error) {
      console.error('Failed to fetch team attendance:', error);
      message.error('Failed to load team attendance');
    } finally {
      setTeamLoading(false);
    }
  }, [selectedMonth, viewMode]);

  // Initialize on mount only
  useEffect(() => {
    fetchTodayStatus();
    fetchMyAttendance();
    verifyLocationOnce();

    // Refresh today status every minute
    const interval = setInterval(fetchTodayStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Refetch when month changes
  useEffect(() => {
    if (viewMode === 'my') {
      fetchMyAttendance();
    } else {
      fetchTeamAttendance();
    }
  }, [selectedMonth, viewMode]);

  // ============== Helpers ==============
  const calculateAttendanceStatus = (checkInTime: string): 'present' | 'late' | 'absent' => {
    if (!checkInTime) return 'absent';
    const checkIn = dayjs(checkInTime, 'HH:mm:ss');
    const officeStart = dayjs(OFFICE_CONFIG.startTime, 'HH:mm');
    const diff = checkIn.diff(officeStart, 'minute');
    return diff > OFFICE_CONFIG.lateThresholdMinutes ? 'late' : 'present';
  };

  const calculateMonthlyStats = useCallback(() => {
    const monthRecords = attendanceHistory;
    const presentDays = monthRecords.filter(r => r.status === 'present').length;
    const lateDays = monthRecords.filter(r => r.status === 'late').length;
    const totalHours = monthRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0);
    const attendanceRate = monthRecords.length > 0 
      ? Math.round((((presentDays + lateDays) / monthRecords.length) * 100)) 
      : 0;

    return {
      presentDays,
      lateDays,
      totalHours: Math.round(totalHours * 100) / 100,
      attendanceRate,
    };
  }, [attendanceHistory]);

  // ============== Attendance Actions ==============
  const performAttendanceAction = async (action: 'check-in' | 'check-out'): Promise<boolean> => {
    try {
      setShowBadgeModal(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowBadgeModal(false);

      const locationData = await verifyLocationOnce();
      if (!locationData) {
        message.error('Failed to get location');
        return false;
      }

      if (!locationData.isValid) {
        Modal.error({
          title: 'Location Verification Failed',
          content: (
            <div>
              <p>
                <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                You must be at the office to {action === 'check-in' ? 'check in' : 'check out'}.
              </p>
              <p style={{ marginTop: 12 }}>
                <strong>Your distance from office:</strong> {locationData.distance}m
              </p>
              <p>
                <strong>Maximum allowed:</strong> {OFFICE_CONFIG.radiusMeters}m
              </p>
            </div>
          ),
        });
        return false;
      }

      if (action === 'check-in') {
        const result = await attendanceService.checkIn({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          location: OFFICE_CONFIG.location.name,
          notes: `Distance: ${locationData.distance}m`,
        });

        await fetchTodayStatus();
        await fetchMyAttendance();
        const status = calculateAttendanceStatus(result.attendance.checkIn);
        
        if (status === 'late') {
          message.warning(`Checked in at ${dayjs(result.attendance.checkIn, 'HH:mm:ss').format('hh:mm A')} - Running late`);
        } else {
          message.success(`Checked in successfully at ${dayjs(result.attendance.checkIn, 'HH:mm:ss').format('hh:mm A')}`);
        }
      } else {
        const result = await attendanceService.checkOut({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          notes: `Distance: ${locationData.distance}m`,
        });

        await fetchTodayStatus();
        await fetchMyAttendance();
        message.success(`Checked out - Total working hours: ${result.hoursWorked?.toFixed(2)}`);
      }

      return true;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || `Failed to ${action === 'check-in' ? 'check in' : 'check out'}`;
      message.error(errorMsg);
      return false;
    }
  };

  // ============== Render Helpers ==============
  const stats = calculateMonthlyStats();
  const currentTime = dayjs().format('hh:mm:ss A');
  const isCheckedIn = todayAttendance !== null;
  const isCheckedOut = todayAttendance?.checkOut !== undefined;
  const isWithinRange = location?.isValid ?? false;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: 'success',
      late: 'warning',
      absent: 'error',
      'half-day': 'default'
    };
    return colors[status] || 'default';
  };

  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const record = attendanceHistory.find(r => r.date === dateStr);
    if (!record) return [];
    return [{
      type: getStatusColor(record.status),
      content: `${record.checkIn.slice(0, 5)} - ${record.checkOut?.slice(0, 5) || 'Working'}`
    }];
  };

  const cellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type as any} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  const filteredHistory = attendanceHistory.filter(r => 
    filterStatus === 'all' ? true : r.status === filterStatus
  );

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      width: 120,
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (time: string) => (
        <Text strong>{dayjs(time, 'HH:mm:ss').format('hh:mm A')}</Text>
      ),
      width: 100,
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (time?: string) => time ? (
        <Text strong>{dayjs(time, 'HH:mm:ss').format('hh:mm A')}</Text>
      ) : (
        <Tag color="blue">Working</Tag>
      ),
      width: 100,
    },
    {
      title: 'Working Hours',
      dataIndex: 'workingHours',
      key: 'workingHours',
      render: (hours?: number) => hours ? `${hours.toFixed(2)} hrs` : '-',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
      width: 100,
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#000000', minHeight: '100vh' }}>
      <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
        <ClockCircleOutlined style={{ marginRight: 12 }} />
        Attendance System
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 14 }}>
        Professional Attendance Management with Location Verification
      </Text>

      {/* Location Status Card */}
      <Card style={{ marginBottom: 24, background: '#f0f5ff', borderColor: '#1890ff' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space direction="vertical" size={4}>
              <Text strong style={{ fontSize: 16 }}>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                GPS Location Status
              </Text>
              <Text type="secondary">
                {location 
                  ? `${location.distance}m from office - ${location.isValid ? '✓ Ready to check in' : '✗ Out of range'}`
                  : 'Fetching location...'}
              </Text>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<EnvironmentOutlined />}
              loading={verifying}
              onClick={verifyLocationOnce}
            >
              {location ? 'Refresh Location' : 'Fetch Location'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Today's Attendance Card */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={8} style={{ textAlign: 'center', color: '#fff' }}>
            <ClockCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              {currentTime}
            </Title>
            <Text style={{ color: '#fff', fontSize: 14 }}>
              {dayjs().format('dddd, MMMM DD, YYYY')}
            </Text>
          </Col>
          
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            {!isCheckedIn ? (
              <Tooltip title={!isWithinRange ? 'You must be at the office' : ''}>
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={() => performAttendanceAction('check-in')}
                  loading={verifying}
                  disabled={!isWithinRange}
                  style={{
                    height: 60,
                    fontSize: 16,
                    background: '#fff',
                    color: '#667eea',
                    border: 'none',
                    minWidth: 140,
                  }}
                >
                  Check In
                </Button>
              </Tooltip>
            ) : !isCheckedOut ? (
              <Tooltip title={!isWithinRange ? 'You must be at the office' : ''}>
                <Button
                  type="primary"
                  size="large"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => performAttendanceAction('check-out')}
                  loading={verifying}
                  disabled={!isWithinRange}
                  style={{ height: 60, fontSize: 16, minWidth: 140 }}
                >
                  Check Out
                </Button>
              </Tooltip>
            ) : (
              <div style={{ color: '#fff' }}>
                <CheckCircleOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <Text style={{ color: '#fff', fontSize: 14, display: 'block' }}>
                  Completed
                </Text>
                <Text style={{ color: '#fff', fontSize: 12 }}>
                  {todayAttendance.workingHours?.toFixed(2)} hrs
                </Text>
              </div>
            )}
          </Col>

          <Col xs={24} md={8} style={{ color: '#fff' }}>
            <Text style={{ color: '#fff', display: 'block', marginBottom: 8, fontSize: 14 }}>
              Office Hours: {OFFICE_CONFIG.startTime} - {OFFICE_CONFIG.endTime}
            </Text>
            <Text style={{ color: '#fff', display: 'block', fontSize: 14 }}>
              Status: {isCheckedIn ? (
                <Tag color={getStatusColor(todayAttendance.status)}>
                  {todayAttendance.status.toUpperCase()}
                </Tag>
              ) : (
                <Tag>NOT CHECKED IN</Tag>
              )}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Monthly Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="On Time"
              value={stats.presentDays}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Late"
              value={stats.lateDays}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Hours"
              value={stats.totalHours}
              suffix="hrs"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Attendance Rate"
              value={stats.attendanceRate}
              suffix="%"
              valueStyle={{ color: stats.attendanceRate >= 90 ? '#52c41a' : '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Calendar View */}
      <Card title="Monthly Calendar View" style={{ marginBottom: 24 }}>
        <Calendar
          value={selectedMonth}
          onSelect={setSelectedMonth}
          cellRender={cellRender}
        />
      </Card>

      {/* Attendance History */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            <HistoryOutlined /> Attendance History
          </Title>
          <Space>
            {canViewTeam && (
              <Select
                value={viewMode}
                onChange={setViewMode}
                style={{ width: 120 }}
              >
                <Select.Option value="my">My Attendance</Select.Option>
                <Select.Option value="team">Team Attendance</Select.Option>
              </Select>
            )}
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 120 }}
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="present">On Time</Select.Option>
              <Select.Option value="late">Late</Select.Option>
              <Select.Option value="absent">Absent</Select.Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => viewMode === 'my' ? fetchMyAttendance() : fetchTeamAttendance()}
              loading={loading || teamLoading}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredHistory.map(r => ({ ...r, key: r.id }))}
          loading={loading || teamLoading}
          pagination={{ pageSize: 15, showSizeChanger: true, showQuickJumper: true }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'No records found' }}
        />
      </Card>

      {/* Badge Modal */}
      <EmployeeBadgeModal
        visible={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        employeeName={user ? `${user.firstName} ${user.lastName}` : 'Employee'}
        employeeTitle={typeof user?.role === 'string' ? user.role : (user?.role as any)?.name || 'Employee'}
        employeeId={user?.employeeId || 'N/A'}
        enableWebcam={true}
        title="Identity Verification"
      />
    </div>
  );
};
export default AttendancePage;
