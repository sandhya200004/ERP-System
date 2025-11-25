import { useState, useEffect } from 'react';
import { Card, Switch, Spin, Select, Typography, Space, Divider, Tag, App } from 'antd';
import { ControlOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import apiClient from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

interface FeatureDefinition {
  key: string;
  name: string;
  module: string;
  permissions: string[];
}

interface RoleFeature {
  featureKey: string;
  enabled: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  features: RoleFeature[];
}

interface RoleWithFeatures {
  role: Role;
  features: {
    key: string;
    name: string;
    module: string;
    enabled: boolean;
  }[];
}

export default function FeatureControlPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [allFeatures, setAllFeatures] = useState<FeatureDefinition[]>([]);
  const [rolesWithFeatures, setRolesWithFeatures] = useState<RoleWithFeatures[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [featuresRes, rolesRes] = await Promise.all([
        apiClient.get('/feature-control/features'),
        apiClient.get('/feature-control/roles/features/all'),
      ]);

      if (featuresRes.data.success) {
        setAllFeatures(featuresRes.data.data);
      }

      if (rolesRes.data.success) {
        setRolesWithFeatures(rolesRes.data.data);
        if (rolesRes.data.data.length > 0) {
          setSelectedRoleId(rolesRes.data.data[0].role.id);
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to load feature control data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (featureKey: string, currentEnabled: boolean) => {
    if (!selectedRoleId) return;

    try {
      setToggling(featureKey);
      const response = await apiClient.post(
        `/feature-control/roles/${selectedRoleId}/toggle`,
        {
          featureKey,
          enabled: !currentEnabled,
        }
      );

      if (response.data.success) {
        message.success(response.data.message);
        await loadData(); // Reload data to reflect changes
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to toggle feature');
    } finally {
      setToggling(null);
    }
  };

  const selectedRoleData = rolesWithFeatures.find((r) => r.role.id === selectedRoleId);

  // Group features by module
  const groupedFeatures = allFeatures.reduce((acc, feature) => {
    if (!acc[feature.module]) {
      acc[feature.module] = [];
    }
    acc[feature.module].push(feature);
    return acc;
  }, {} as Record<string, FeatureDefinition[]>);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>
            <ControlOutlined /> Feature Control
          </Title>
          <Text type="secondary">
            Enable or disable features for different roles. Changes take effect immediately.
          </Text>
        </div>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Select Role:</Text>
              <Select
                value={selectedRoleId}
                onChange={setSelectedRoleId}
                style={{ width: '100%', marginTop: 8 }}
                size="large"
              >
                {rolesWithFeatures.map((roleData) => (
                  <Option key={roleData.role.id} value={roleData.role.id}>
                    {roleData.role.name}
                    {roleData.role.description && (
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                        - {roleData.role.description}
                      </Text>
                    )}
                  </Option>
                ))}
              </Select>
            </div>

            {selectedRoleData && (
              <>
                <Divider />
                {Object.entries(groupedFeatures).map(([module, features]) => (
                  <Card
                    key={module}
                    type="inner"
                    title={
                      <Space>
                        <Text strong>{module}</Text>
                        <Tag color="blue">
                          {features.filter((f) => {
                            const roleFeature = selectedRoleData.features.find(
                              (rf) => rf.key === f.key
                            );
                            return roleFeature?.enabled;
                          }).length}
                          /{features.length} enabled
                        </Tag>
                      </Space>
                    }
                    style={{ marginBottom: 16 }}
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {features.map((feature) => {
                        const roleFeature = selectedRoleData.features.find(
                          (rf) => rf.key === feature.key
                        );
                        const isEnabled = roleFeature?.enabled || false;
                        const isToggling = toggling === feature.key;

                        return (
                          <div
                            key={feature.key}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 16px',
                              background: '#fafafa',
                              borderRadius: 6,
                            }}
                          >
                            <Space direction="vertical" size={0}>
                              <Space>
                                <Text strong>{feature.name}</Text>
                                {isEnabled ? (
                                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                ) : (
                                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                )}
                              </Space>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {feature.permissions.length} permission(s): {feature.permissions.join(', ')}
                              </Text>
                            </Space>
                            <Switch
                              checked={isEnabled}
                              loading={isToggling}
                              onChange={() => handleToggleFeature(feature.key, isEnabled)}
                              checkedChildren="ON"
                              unCheckedChildren="OFF"
                            />
                          </div>
                        );
                      })}
                    </Space>
                  </Card>
                ))}
              </>
            )}
          </Space>
        </Card>

        <Card title="💡 How It Works" size="small">
          <Space direction="vertical">
            <Text>
              • <strong>Immediate Effect:</strong> Changes take effect immediately for all users with the selected role
            </Text>
            <Text>
              • <strong>Permission-Based:</strong> Each feature controls multiple permissions in the system
            </Text>
            <Text>
              • <strong>Audit Trail:</strong> All changes are logged with user information and timestamps
            </Text>
            <Text>
              • <strong>Role-Based:</strong> Features are enabled/disabled per role, not per user
            </Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
}
