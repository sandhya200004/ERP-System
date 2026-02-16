import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Badge,
  Typography,
  Spin,
  Alert,
  Space,
  Statistic,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DatabaseOutlined,
  ApiOutlined,
  LockOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import './StatusPage.css';

const { Title, Text, Paragraph } = Typography;

interface SystemStatus {
  status: 'operational' | 'degraded' | 'down';
  database: boolean;
  uptime: number;
  uptimePercentage: number;
  lastIncident: string | null;
  services: {
    api: boolean;
    database: boolean;
    authentication: boolean;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const StatusPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/security/status`, {
        timeout: 10000, // 10 second timeout
      });

      if (response.data.success) {
        setStatus(response.data.data);
        setError(null);
      }
      setLastChecked(new Date());
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError('Unable to connect to server');
      // Set a default "down" status
      setStatus({
        status: 'down',
        database: false,
        uptime: 0,
        uptimePercentage: 0,
        lastIncident: new Date().toISOString(),
        services: {
          api: false,
          database: false,
          authentication: false,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  const getStatusBadge = (serviceStatus: 'operational' | 'degraded' | 'down') => {
    const badgeMap = {
      operational: { status: 'success' as const, text: 'Operational', icon: <CheckCircleOutlined /> },
      degraded: { status: 'warning' as const, text: 'Degraded Performance', icon: <WarningOutlined /> },
      down: { status: 'error' as const, text: 'System Down', icon: <CloseCircleOutlined /> },
    };
    const badge = badgeMap[serviceStatus];
    return (
      <Badge
        status={badge.status}
        text={
          <span style={{ fontSize: 18, fontWeight: 500 }}>
            {badge.icon} {badge.text}
          </span>
        }
      />
    );
  };

  const getServiceStatus = (isOperational: boolean) => {
    return isOperational ? (
      <Badge status="success" text={<Text strong>Operational</Text>} />
    ) : (
      <Badge status="error" text={<Text strong>Down</Text>} />
    );
  };

  if (loading) {
    return (
      <div className="status-page">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Checking system status...</Text>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="status-page">
        <div style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
          <Alert
            message="Unable to Retrieve Status"
            description="We are unable to connect to the status server. Please try again later."
            type="error"
            showIcon
          />
        </div>
      </div>
    );
  }

  return (
    <div className="status-page">
      {/* Header */}
      <div className="status-header">
        <div className="status-header-content">
          <Title level={1} style={{ color: 'white', margin: 0 }}>
            TriVerse ERP Status
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, margin: '8px 0 0 0' }}>
            Real-time system status and uptime monitoring
          </Paragraph>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Overall Status */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {error && (
              <Alert
                message="Connection Error"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: 24, textAlign: 'left' }}
              />
            )}
            <div style={{ marginBottom: 16 }}>
              {getStatusBadge(status.status)}
            </div>
            <Text type="secondary">
              Last checked: {lastChecked.toLocaleTimeString()}
            </Text>
          </div>
        </Card>

        {/* Uptime Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12}>
            <Card>
              <Statistic
                title="Current Uptime"
                value={formatUptime(status.uptime)}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card>
              <Statistic
                title="Uptime (Last 90 Days)"
                value={status.uptimePercentage}
                suffix="%"
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: status.uptimePercentage >= 99 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Service Status */}
        <Card title={<span><ApiOutlined /> Service Status</span>}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <ApiOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div>
                  <Text strong>API Server</Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  {getServiceStatus(status.services.api)}
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <DatabaseOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div>
                  <Text strong>Database</Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  {getServiceStatus(status.services.database)}
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <LockOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div>
                  <Text strong>Authentication</Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  {getServiceStatus(status.services.authentication)}
                </div>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Last Incident */}
        {status.lastIncident && (
          <Card title="Last Incident" style={{ marginTop: 24 }}>
            <Alert
              message={`Last recorded incident: ${new Date(status.lastIncident).toLocaleString()}`}
              type="info"
              showIcon
            />
          </Card>
        )}

        {status.status === 'operational' && !status.lastIncident && (
          <Card style={{ marginTop: 24, textAlign: 'center', background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4} style={{ color: '#3f8600' }}>
              All Systems Operational
            </Title>
            <Text type="secondary">
              No incidents reported in the last 90 days. We are committed to 99.9% uptime.
            </Text>
          </Card>
        )}

        <Divider />

        {/* Footer Info */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Space direction="vertical" size="small">
            <Text type="secondary">
              This page is automatically updated every 60 seconds
            </Text>
            <Text type="secondary">
              For security inquiries: <a href="mailto:security@triverse.com">security@triverse.com</a>
            </Text>
            <Text type="secondary">
              For support: <a href="mailto:support@triverse.com">support@triverse.com</a>
            </Text>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;
