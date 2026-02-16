import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Alert,
  Badge,
  Typography,
  Spin,
  Tag,
  Space,
} from 'antd';
import {
  SecurityScanOutlined,
  UserOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExportOutlined,
  LockOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { formatDistance } from 'date-fns';

const { Title, Text } = Typography;

interface SecurityMetrics {
  failedLogins24h: number;
  failedLoginsByIp: Array<{ ip: string; count: number }>;
  activeUsers: number;
  dataExports7d: number;
  largeExports7d: number;
  recentSecurityEvents: Array<{
    action: string;
    user_id: string;
    ip_address: string;
    created_at: string;
    details: any;
  }>;
  systemUptime: number;
  uptimePercentage: number;
}

interface SecurityAlert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchSecurityData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [metricsRes, alertsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/security/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/security/alerts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (metricsRes.data.success) {
        setMetrics(metricsRes.data.data);
      }
      if (alertsRes.data.success) {
        setAlerts(alertsRes.data.data);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'gold';
      case 'low':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getActionTag = (action: string) => {
    const actionMap: Record<string, { color: string; text: string }> = {
      LOGIN_FAILED: { color: 'red', text: 'Failed Login' },
      UNAUTHORIZED_ACCESS: { color: 'red', text: 'Unauthorized' },
      PERMISSION_DENIED: { color: 'orange', text: 'Permission Denied' },
      DATA_EXPORT: { color: 'blue', text: 'Data Export' },
      PASSWORD_CHANGE: { color: 'green', text: 'Password Change' },
      ROLE_CHANGE: { color: 'purple', text: 'Role Change' },
    };
    const mapped = actionMap[action] || { color: 'default', text: action };
    return <Tag color={mapped.color}>{mapped.text}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading security metrics...</Text>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Alert
        message="Failed to load security metrics"
        description="Please check your connection and try again."
        type="error"
        showIcon
      />
    );
  }

  const failedLoginColumns = [
    {
      title: 'IP Address',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: 'Failed Attempts',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => (
        <Badge
          count={count}
          style={{ backgroundColor: count >= 10 ? '#f5222d' : '#faad14' }}
        />
      ),
    },
  ];

  const recentEventsColumns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => getActionTag(action),
    },
    {
      title: 'User ID',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (id: string) => <Text code>{id?.substring(0, 8)}...</Text>,
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDistance(new Date(date), new Date(), { addSuffix: true }),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>
          <SecurityScanOutlined /> Security Dashboard
        </Title>
        <Space>
          <Text type="secondary">
            Last updated: {formatDistance(lastUpdated, new Date(), { addSuffix: true })}
          </Text>
          <Badge status="processing" text="Live Monitoring" />
        </Space>
      </div>

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              message={alert.message}
              type={alert.severity === 'critical' || alert.severity === 'high' ? 'error' : 'warning'}
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 8 }}
              action={
                <Tag color={getSeverityColor(alert.severity)}>
                  {alert.severity.toUpperCase()}
                </Tag>
              }
            />
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="System Uptime"
              value={`${metrics.uptimePercentage}%`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix={
                <Text type="secondary" style={{ fontSize: 14 }}>
                  ({formatUptime(metrics.systemUptime)})
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Failed Logins (24h)"
              value={metrics.failedLogins24h}
              prefix={<LockOutlined style={{ color: metrics.failedLogins24h > 50 ? '#ff4d4f' : '#faad14' }} />}
              valueStyle={{ color: metrics.failedLogins24h > 50 ? '#cf1322' : '#000' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={metrics.activeUsers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Data Exports (7d)"
              value={metrics.dataExports7d}
              prefix={<ExportOutlined style={{ color: '#722ed1' }} />}
              suffix={
                metrics.largeExports7d > 0 && (
                  <Tag color="orange">{metrics.largeExports7d} large</Tag>
                )
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Failed Login Attempts by IP */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <WarningOutlined />
                <span>Failed Login Attempts by IP (24h)</span>
              </Space>
            }
          >
            {metrics.failedLoginsByIp.length > 0 ? (
              <Table
                dataSource={metrics.failedLoginsByIp}
                columns={failedLoginColumns}
                pagination={false}
                size="small"
                rowKey="ip"
              />
            ) : (
              <Alert
                message="No failed login attempts"
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            )}
          </Card>
        </Col>

        {/* Recent Security Events */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                <span>Recent Security Events (7d)</span>
              </Space>
            }
          >
            <Table
              dataSource={metrics.recentSecurityEvents}
              columns={recentEventsColumns}
              pagination={{ pageSize: 10 }}
              size="small"
              rowKey={(record) => `${record.user_id}-${record.created_at}`}
            />
          </Card>
        </Col>
      </Row>

      {/* System Status Footer */}
      <Card style={{ marginTop: 24, textAlign: 'center' }}>
        <Space size="large">
          <div>
            <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
            <div style={{ marginTop: 8 }}>
              <Text strong>All Systems Operational</Text>
            </div>
          </div>
          <div>
            <Text type="secondary">
              View public status page at{' '}
              <a href="/status" target="_blank">
                /status
              </a>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
