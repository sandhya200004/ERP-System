import React, { useState, useEffect } from 'react';
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
  DatePicker,
  Select,
  Modal,
  Alert,
  Spin,
  Divider,
  App,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  WarningOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useAuthStore } from '../store/authStore';
import { attendanceService } from '../services/attendance.service';
import EmployeeBadgeModal from '../components/EmployeeBadgeModal';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'late' | 'absent' | 'half-day';
  workingHours?: number;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

const AttendancePage: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const { user } = useAuthStore();

  // Office Location (CodeServeTech Solutions)
  // From Google Maps embed: 18.73805058239819, 73.66970757550314
  // Note: You can update these coordinates by clicking "Update Office Location" button below
  const OFFICE_LOCATION = {
    latitude: 18.73805058239819,
    longitude: 73.66970757550314,
    name: 'CodeServeTech Solutions'
  };
  
  // Maximum allowed distance from office in meters
  // Increased to 500m to account for GPS accuracy variations in buildings
  // GPS can be inaccurate by 100-500m indoors or near tall buildings
  const MAX_DISTANCE_METERS = 500;

  const OFFICE_START_TIME = '09:30';
  const OFFICE_END_TIME = '18:30';
  const LATE_THRESHOLD_MINUTES = 15;

  useEffect(() => {
    fetchTodayAttendance();
    fetchAttendanceHistory();
    requestLocationPermission();
  }, []);

  // Refetch history when selected month changes
  useEffect(() => {
    fetchAttendanceHistory();
  }, [selectedMonth]);

  // Request location permission on component mount
  const requestLocationPermission = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location permission denied:', error);
          message.warning('Location permission is required for attendance. Please enable location access.');
        }
      );
    } else {
      message.error('Geolocation is not supported by your browser');
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Verify if user is within office location
  const verifyLocation = (): Promise<{ isValid: boolean; distance: number; userLocation: { latitude: number; longitude: number } }> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      setCheckingLocation(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          
          const distance = calculateDistance(
            userLat,
            userLon,
            OFFICE_LOCATION.latitude,
            OFFICE_LOCATION.longitude
          );

          setCurrentLocation({ latitude: userLat, longitude: userLon });
          setCheckingLocation(false);

          const isValid = distance <= MAX_DISTANCE_METERS;
          
          resolve({
            isValid,
            distance: Math.round(distance),
            userLocation: { latitude: userLat, longitude: userLon }
          });
        },
        (error) => {
          setCheckingLocation(false);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const fetchTodayAttendance = async () => {
    try {
      const todayStatus = await attendanceService.getTodayStatus();
      if (todayStatus.hasCheckedIn && todayStatus.attendance) {
        const att = todayStatus.attendance;
        const record: AttendanceRecord = {
          id: att.id,
          userId: att.userId,
          userName: att.user ? `${att.user.firstName} ${att.user.lastName}` : 'Unknown',
          date: att.date,
          checkIn: att.checkIn,
          checkOut: att.checkOut,
          status: 'present', // Calculate based on time if needed
          workingHours: att.hoursWorked,
        };
        setTodayAttendance(record);
      } else {
        setTodayAttendance(null);
      }
    } catch (error) {
      console.error('Failed to fetch today attendance:', error);
      message.error('Failed to fetch attendance');
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const startOfMonth = selectedMonth.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = selectedMonth.endOf('month').format('YYYY-MM-DD');
      
      const attendances = await attendanceService.getMyAttendance({
        startDate: startOfMonth,
        endDate: endOfMonth,
      });
      
      const mappedHistory: AttendanceRecord[] = attendances.map((att) => {
        // Calculate status based on check-in time
        const checkInTime = dayjs(`${att.date} ${att.checkIn}`);
        const officeStart = dayjs(`${att.date} ${OFFICE_START_TIME}`);
        const minutesLate = checkInTime.diff(officeStart, 'minute');
        
        let status: 'present' | 'late' | 'absent' | 'half-day' = 'present';
        if (minutesLate > LATE_THRESHOLD_MINUTES) {
          status = 'late';
        }
        
        return {
          id: att.id,
          userId: att.userId,
          userName: att.user ? `${att.user.firstName} ${att.user.lastName}` : 'Unknown',
          date: att.date,
          checkIn: att.checkIn,
          checkOut: att.checkOut,
          status,
          workingHours: att.hoursWorked,
        };
      });
      
      setAttendanceHistory(mappedHistory);
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
      message.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      // Show badge verification modal first
      setShowBadgeModal(true);
      
      // Wait 2 seconds for face verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowBadgeModal(false);
      
      // First verify location
      setCheckingLocation(true);
      const locationResult = await verifyLocation();
      
      if (!locationResult.isValid) {
        Modal.error({
          title: 'Location Verification Failed',
          content: (
            <div>
              <p>
                <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                You must be at the office location to check in.
              </p>
              <p style={{ marginTop: 12 }}>
                <strong>Your distance from office:</strong> {locationResult.distance} meters
              </p>
              <p>
                <strong>Maximum allowed:</strong> {MAX_DISTANCE_METERS} meters
              </p>
              <p style={{ marginTop: 12, color: '#666' }}>
                Please move closer to <strong>{OFFICE_LOCATION.name}</strong> to mark your attendance.
              </p>
            </div>
          ),
        });
        return;
      }

      // Call API to check in
      const result = await attendanceService.checkIn({
        latitude: locationResult.userLocation.latitude,
        longitude: locationResult.userLocation.longitude,
        location: OFFICE_LOCATION.name,
        notes: `Distance from office: ${locationResult.distance}m`,
      });

      // Update local state
      await fetchTodayAttendance();
      await fetchAttendanceHistory();
      
      // Calculate if late
      const checkInTime = dayjs(`${result.attendance.date} ${result.attendance.checkIn}`);
      const officeStart = dayjs(`${result.attendance.date} ${OFFICE_START_TIME}`);
      const minutesLate = checkInTime.diff(officeStart, 'minute');
      
      if (minutesLate > LATE_THRESHOLD_MINUTES) {
        message.warning(
          `Checked in at ${checkInTime.format('HH:mm')} - You are ${minutesLate} minutes late. Distance from office: ${result.distance}m`
        );
      } else {
        message.success(
          `Checked in successfully at ${checkInTime.format('HH:mm')}! Distance from office: ${result.distance}m`
        );
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error instanceof GeolocationPositionError) {
        Modal.error({
          title: 'Location Access Required',
          content: (
            <div>
              <p>Unable to access your location. Please ensure:</p>
              <ul>
                <li>Location services are enabled on your device</li>
                <li>You have granted location permission to this website</li>
                <li>You are using a secure (HTTPS) connection</li>
              </ul>
            </div>
          ),
        });
      } else {
        message.error('Failed to check in. Please try again.');
      }
    } finally {
      setCheckingLocation(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance) {
      message.error('Please check in first');
      return;
    }

    try {
      // Show badge verification modal first
      setShowBadgeModal(true);
      
      // Wait 2 seconds for face verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowBadgeModal(false);
      
      // Verify location for checkout as well
      setCheckingLocation(true);
      const locationResult = await verifyLocation();
      
      if (!locationResult.isValid) {
        Modal.error({
          title: 'Location Verification Failed',
          content: (
            <div>
              <p>
                <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                You must be at the office location to check out.
              </p>
              <p style={{ marginTop: 12 }}>
                <strong>Your distance from office:</strong> {locationResult.distance} meters
              </p>
              <p>
                <strong>Maximum allowed:</strong> {MAX_DISTANCE_METERS} meters
              </p>
            </div>
          ),
        });
        return;
      }

      // Call API to check out
      const result = await attendanceService.checkOut({
        latitude: locationResult.userLocation.latitude,
        longitude: locationResult.userLocation.longitude,
        notes: `Distance from office: ${locationResult.distance}m`,
      });
      
      // Update local state
      await fetchTodayAttendance();
      await fetchAttendanceHistory();
      
      const hoursWorked = result.hoursWorked || 0;
      message.success(
        `Checked out - Total working hours: ${hoursWorked.toFixed(2)}. Distance from office: ${result.distance}m`
      );
    } catch (error: any) {
      console.error('Check-out error:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error instanceof GeolocationPositionError) {
        Modal.error({
          title: 'Location Access Required',
          content: 'Please enable location services to check out.',
        });
      } else {
        message.error('Failed to check out. Please try again.');
      }
    } finally {
      setCheckingLocation(false);
    }
  };

  const calculateMonthlyStats = () => {
    const monthRecords = attendanceHistory.filter(record => 
      dayjs(record.date).month() === selectedMonth.month() &&
      dayjs(record.date).year() === selectedMonth.year()
    );

    const presentDays = monthRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const lateDays = monthRecords.filter(r => r.status === 'late').length;
    const absentDays = monthRecords.filter(r => r.status === 'absent').length;
    const totalWorkingHours = monthRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0);
    
    return {
      presentDays,
      lateDays,
      absentDays,
      totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
      attendanceRate: monthRecords.length > 0 ? Math.round((presentDays / monthRecords.length) * 100) : 0
    };
  };

  const stats = calculateMonthlyStats();

  const getStatusColor = (status: string) => {
    const colors = {
      present: 'success',
      late: 'warning',
      absent: 'error',
      'half-day': 'default'
    };
    return colors[status as keyof typeof colors];
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

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (time: string) => (
        <Text strong>{dayjs(time, 'HH:mm:ss').format('hh:mm A')}</Text>
      )
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (time?: string) => time ? (
        <Text strong>{dayjs(time, 'HH:mm:ss').format('hh:mm A')}</Text>
      ) : (
        <Tag color="blue">Still Working</Tag>
      )
    },
    {
      title: 'Working Hours',
      dataIndex: 'workingHours',
      key: 'workingHours',
      render: (hours?: number) => hours ? `${hours.toFixed(2)} hrs` : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      )
    }
  ];

  const currentTime = dayjs().format('hh:mm:ss A');
  const isCheckedIn = todayAttendance !== null;
  const isCheckedOut = todayAttendance?.checkOut !== undefined;

  // Calculate distance from office if location is available
  const distanceFromOffice = currentLocation
    ? Math.round(
        calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          OFFICE_LOCATION.latitude,
          OFFICE_LOCATION.longitude
        )
      )
    : null;

  const isWithinOfficeRange = distanceFromOffice !== null && distanceFromOffice <= MAX_DISTANCE_METERS;

  return (
    <div style={{ padding: '24px', background: '#000000', minHeight: '100vh' }}>
      <Title level={2}>
        <ClockCircleOutlined style={{ marginRight: 12 }} />
        Attendance System
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Mark your attendance with location verification
      </Text>

      {/* Fetch Location Button */}
      <Card style={{ marginBottom: 24, background: '#f0f5ff', borderColor: '#1890ff' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space direction="vertical" size={4}>
              <Text strong style={{ fontSize: 16 }}>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                GPS Location Tracking
              </Text>
              <Text type="secondary">
                {currentLocation 
                  ? `Location detected: ${distanceFromOffice}m from office` 
                  : 'Click to fetch your current GPS location'}
              </Text>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<EnvironmentOutlined />}
              size="large"
              loading={checkingLocation}
              onClick={requestLocationPermission}
              style={{ minWidth: 160 }}
            >
              {currentLocation ? 'Refresh Location' : 'Fetch My Location'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Location Status Alert */}
      <Alert
        message={
          <Space>
            <EnvironmentOutlined />
            <span><strong>Office Location:</strong> {OFFICE_LOCATION.name}</span>
          </Space>
        }
        description={
          <div>
            {checkingLocation ? (
              <Space>
                <Spin size="small" />
                <Text>Verifying your location...</Text>
              </Space>
            ) : currentLocation ? (
              <div>
                <p style={{ marginBottom: 8 }}>
                  <strong>Your distance from office:</strong>{' '}
                  <Text strong style={{ color: isWithinOfficeRange ? '#52c41a' : '#ff4d4f' }}>
                    {distanceFromOffice} meters
                  </Text>
                  {isWithinOfficeRange ? (
                    <Tag color="success" style={{ marginLeft: 8 }}>
                      <CheckCircleOutlined /> Within Range
                    </Tag>
                  ) : (
                    <Tag color="error" style={{ marginLeft: 8 }}>
                      <WarningOutlined /> Out of Range
                    </Tag>
                  )}
                </p>
                <p style={{ marginTop: 8, fontSize: 12, fontFamily: 'monospace', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                  <strong>Your Current Location:</strong><br />
                  Latitude: {currentLocation.latitude.toFixed(8)}<br />
                  Longitude: {currentLocation.longitude.toFixed(8)}
                </p>
                <p style={{ marginTop: 8, fontSize: 12, fontFamily: 'monospace', background: '#f0f0f0', padding: '8px', borderRadius: '4px' }}>
                  <strong>Office Location:</strong><br />
                  Latitude: {OFFICE_LOCATION.latitude.toFixed(8)}<br />
                  Longitude: {OFFICE_LOCATION.longitude.toFixed(8)}
                </p>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    const locationInfo = `Your Current Coordinates:\nLatitude: ${currentLocation.latitude}\nLongitude: ${currentLocation.longitude}\n\nOffice Coordinates:\nLatitude: ${OFFICE_LOCATION.latitude}\nLongitude: ${OFFICE_LOCATION.longitude}\n\nDistance: ${distanceFromOffice} meters`;
                    navigator.clipboard.writeText(locationInfo);
                    message.success('Location details copied to clipboard!');
                  }}
                  style={{ padding: 0, marginTop: 8 }}
                >
                  📋 Copy Location Details
                </Button>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 8 }}>
                  You must be within {MAX_DISTANCE_METERS} meters of the office to mark attendance.
                </Text>
              </div>
            ) : (
              <Text type="warning">
                <WarningOutlined /> Location access required. Please enable location permissions.
              </Text>
            )}
          </div>
        }
        type={isWithinOfficeRange ? 'success' : currentLocation ? 'warning' : 'info'}
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Office Location Map */}
      <Card 
        title={
          <Space>
            <EnvironmentOutlined />
            <span>Office Location - {OFFICE_LOCATION.name}</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3778.346567406012!2d73.66970757550314!3d18.73805058239819!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2b14773c9f6fb%3A0x881d11b19fb4836!2sCodeServeTech%20Solutions!5e0!3m2!1sen!2sin!4v1762491294038!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ 
              border: 0,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '8px'
            }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Office Location"
          />
        </div>
        <div style={{ marginTop: 16, padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary">Latitude:</Text>
              <Text strong style={{ display: 'block' }}>{OFFICE_LOCATION.latitude}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Longitude:</Text>
              <Text strong style={{ display: 'block' }}>{OFFICE_LOCATION.longitude}</Text>
            </Col>
          </Row>
          <Divider style={{ margin: '12px 0' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            <EnvironmentOutlined /> Attendance can only be marked within {MAX_DISTANCE_METERS} meters radius of this location.
          </Text>
        </div>
      </Card>

      {/* Today's Attendance Card */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <ClockCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                {currentTime}
              </Title>
              <Text style={{ color: '#fff', fontSize: 16 }}>
                {dayjs().format('dddd, MMMM DD, YYYY')}
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              {!isCheckedIn ? (
                <Button
                  type="primary"
                  size="large"
                  icon={checkingLocation ? <Spin /> : <CheckCircleOutlined />}
                  onClick={handleCheckIn}
                  loading={checkingLocation}
                  disabled={!isWithinOfficeRange}
                  style={{ 
                    height: 60, 
                    fontSize: 18,
                    background: '#fff',
                    color: '#667eea',
                    border: 'none'
                  }}
                >
                  {checkingLocation ? 'Verifying Location...' : 'Check In'}
                </Button>
              ) : !isCheckedOut ? (
                <>
                  <Text style={{ color: '#fff', fontSize: 16, display: 'block', marginBottom: 16 }}>
                    Checked in at {dayjs(todayAttendance.checkIn, 'HH:mm:ss').format('hh:mm A')}
                  </Text>
                  <Button
                    type="primary"
                    size="large"
                    danger
                    icon={checkingLocation ? <Spin /> : <CloseCircleOutlined />}
                    onClick={handleCheckOut}
                    loading={checkingLocation}
                    disabled={!isWithinOfficeRange}
                    style={{ height: 60, fontSize: 18 }}
                  >
                    {checkingLocation ? 'Verifying Location...' : 'Check Out'}
                  </Button>
                </>
              ) : (
                <div style={{ color: '#fff' }}>
                  <CheckCircleOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                  <Text style={{ color: '#fff', fontSize: 16, display: 'block' }}>
                    Completed for today
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 14 }}>
                    {todayAttendance.workingHours?.toFixed(2)} working hours
                  </Text>
                </div>
              )}
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ color: '#fff' }}>
              <Text style={{ color: '#fff', display: 'block', marginBottom: 8 }}>
                Office Hours: {OFFICE_START_TIME} - {OFFICE_END_TIME}
              </Text>
              <Text style={{ color: '#fff', display: 'block' }}>
                Status: {isCheckedIn ? (
                  <Tag color={getStatusColor(todayAttendance.status)}>
                    {todayAttendance.status.toUpperCase()}
                  </Tag>
                ) : (
                  <Tag>NOT CHECKED IN</Tag>
                )}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Monthly Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Present Days"
              value={stats.presentDays}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Late Days"
              value={stats.lateDays}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Working Hours"
              value={stats.totalWorkingHours}
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
      <Card title="Monthly Calendar" style={{ marginBottom: 24 }}>
        <Calendar
          value={selectedMonth}
          onSelect={setSelectedMonth}
          cellRender={cellRender}
        />
      </Card>

      {/* Attendance History */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3}>
            <HistoryOutlined /> Attendance History
          </Title>
          <Space>
            <RangePicker />
            <Select defaultValue="all" style={{ width: 120 }}>
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="present">Present</Select.Option>
              <Select.Option value="late">Late</Select.Option>
              <Select.Option value="absent">Absent</Select.Option>
            </Select>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={attendanceHistory}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Employee Badge Verification Modal */}
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
