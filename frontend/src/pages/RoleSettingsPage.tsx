import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Switch,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Tag,
  Modal,
  Tabs,
  Checkbox,
  Row,
  Col,
  Alert,
  Divider,
  Input,
  Form,
  Tooltip,
} from 'antd';
import {
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SecurityScanOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import roleSettingsService, { Role, Feature, Permission } from '../services/role-settings.service';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../utils/permissions';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const RoleSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData, featuresData] = await Promise.all([
        roleSettingsService.getAllRolesWithPermissions(),
        roleSettingsService.getAllPermissions(),
        roleSettingsService.getFeaturesList(),
      ]);

      setRoles(rolesData);
      setPermissions(permissionsData.permissions);
      setGroupedPermissions(permissionsData.grouped);
      setFeatures(featuresData);
    } catch (error) {
      message.error('Failed to load role settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = async (featureKey: string, roleId: string, currentState: boolean) => {
    try {
      const updatedRoles = await roleSettingsService.toggleFeature(
        featureKey,
        !currentState,
        [roleId]
      );
      setRoles(updatedRoles);
      message.success(`Feature ${!currentState ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      message.error('Failed to toggle feature');
      console.error(error);
    }
  };

  const hasFeaturePermissions = (role: Role, feature: Feature): boolean => {
    const rolePermissionNames = role.permissions.map((p) => p.name);
    return feature.permissions.some((fp) => rolePermissionNames.includes(fp));
  };

  const handleEditPermissions = (role: Role) => {
    setSelectedRole(role);
    setModalVisible(true);
  };

  const handleUpdatePermissions = async (values: { permissionIds: string[] }) => {
    if (!selectedRole) return;

    try {
      setLoading(true);
      const updatedRoles = await roleSettingsService.updateRolePermissions(
        selectedRole.id,
        values.permissionIds
      );
      setRoles(updatedRoles);
      setModalVisible(false);
      message.success('Permissions updated successfully');
    } catch (error) {
      message.error('Failed to update permissions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async (values: any) => {
    try {
      setLoading(true);
      await roleSettingsService.createPermission(values);
      await loadData();
      setPermissionModalVisible(false);
      form.resetFields();
      message.success('Permission created successfully');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create permission');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const featureColumns = [
    {
      title: 'Feature',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left' as const,
      render: (name: string) => (
        <Space>
          <SecurityScanOutlined style={{ color: '#1890ff' }} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    ...roles.map((role) => ({
      title: (
        <Space direction="vertical" size={0}>
          <Text strong>{role.name}</Text>
          {role.isSystemRole && <Tag color="red">System</Tag>}
        </Space>
      ),
      dataIndex: role.id,
      key: role.id,
      width: 120,
      align: 'center' as const,
      render: (_: any, feature: Feature) => {
        const isEnabled = hasFeaturePermissions(role, feature);
        return (
          <Tooltip title={isEnabled ? 'Click to disable' : 'Click to enable'}>
            <Switch
              checked={isEnabled}
              onChange={() => handleFeatureToggle(feature.key, role.id, isEnabled)}
              checkedChildren={<CheckCircleOutlined />}
              unCheckedChildren={<CloseCircleOutlined />}
              disabled={role.isSystemRole && !hasPermission(user?.role as any, 'MANAGE_COMPANY')}
              loading={loading}
            />
          </Tooltip>
        );
      },
    })),
  ];

  const roleColumns = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, role: Role) => (
        <Space>
          <LockOutlined style={{ color: role.isSystemRole ? '#ff4d4f' : '#52c41a' }} />
          <Text strong>{name}</Text>
          {role.isSystemRole && <Tag color="red">System Role</Tag>}
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || <Text type="secondary">No description</Text>,
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: Permission[]) => (
        <Tag color="blue">{permissions.length} permissions</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, role: Role) => (
        <Space>
          <Button
            type="link"
            icon={<SettingOutlined />}
            onClick={() => handleEditPermissions(role)}
            disabled={role.isSystemRole && !hasPermission(user?.role as any, 'MANAGE_COMPANY')}
          >
            Edit Permissions
          </Button>
        </Space>
      ),
    },
  ];

  if (loading && roles.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading role settings..." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Title level={2} style={{ margin: 0 }}>
              <SecurityScanOutlined style={{ marginRight: 12 }} />
              Role Settings & Permissions
            </Title>
          </Space>
          <Space>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setPermissionModalVisible(true)}
              type="primary"
            >
              Create Permission
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              Refresh
            </Button>
          </Space>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          Manage role-based access control and feature permissions
        </Text>
      </div>

      <Alert
        message="Important: System Role Protection"
        description="System roles (like Admin, Employee) have protected permissions. Only CEO, CTO, and CMO with MANAGE_COMPANY permission can modify system roles."
        type="info"
        showIcon
        icon={<LockOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Tabs defaultActiveKey="features" size="large">
        <TabPane
          tab={
            <span>
              <UnlockOutlined />
              Feature Matrix
            </span>
          }
          key="features"
        >
          <Card>
            <Table
              columns={featureColumns}
              dataSource={features}
              rowKey="key"
              pagination={false}
              scroll={{ x: 'max-content' }}
              loading={loading}
              bordered
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <SettingOutlined />
              Role Management
            </span>
          }
          key="roles"
        >
          <Card>
            <Table
              columns={roleColumns}
              dataSource={roles}
              rowKey="id"
              pagination={false}
              loading={loading}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <SecurityScanOutlined />
              All Permissions ({permissions.length})
            </span>
          }
          key="permissions"
        >
          <Card>
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div key={resource} style={{ marginBottom: 24 }}>
                <Divider orientation="left">
                  <Text strong style={{ fontSize: 16 }}>
                    {resource.toUpperCase()}
                  </Text>
                </Divider>
                <Row gutter={[16, 16]}>
                  {perms.map((perm) => (
                    <Col span={8} key={perm.id}>
                      <Card size="small" hoverable>
                        <Space direction="vertical" size={0}>
                          <Text strong>{perm.name}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {perm.description || 'No description'}
                          </Text>
                          <Tag color="processing" style={{ marginTop: 8 }}>
                            {perm.action}
                          </Tag>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ))}
          </Card>
        </TabPane>
      </Tabs>

      {/* Edit Permissions Modal */}
      <Modal
        title={`Edit Permissions: ${selectedRole?.name}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={() => {
              const selectedPermissionIds = selectedRole?.permissions.map((p) => p.id) || [];
              handleUpdatePermissions({ permissionIds: selectedPermissionIds });
            }}
          >
            Save Changes
          </Button>,
        ]}
      >
        {selectedRole && (
          <div>
            <Alert
              message={`Editing permissions for: ${selectedRole.name}`}
              description={`Select or deselect permissions to grant or revoke access. ${
                selectedRole.isSystemRole ? 'This is a system role.' : ''
              }`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div key={resource} style={{ marginBottom: 16 }}>
                <Text strong>{resource.toUpperCase()}</Text>
                <div style={{ marginTop: 8, marginLeft: 24 }}>
                  {perms.map((perm) => {
                    const isChecked = selectedRole.permissions.some((p) => p.id === perm.id);
                    return (
                      <div key={perm.id} style={{ marginBottom: 8 }}>
                        <Checkbox
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRole({
                                ...selectedRole,
                                permissions: [...selectedRole.permissions, perm],
                              });
                            } else {
                              setSelectedRole({
                                ...selectedRole,
                                permissions: selectedRole.permissions.filter(
                                  (p) => p.id !== perm.id
                                ),
                              });
                            }
                          }}
                        >
                          <Space>
                            <Text>{perm.name}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              ({perm.action})
                            </Text>
                          </Space>
                        </Checkbox>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Create Permission Modal */}
      <Modal
        title="Create New Permission"
        open={permissionModalVisible}
        onCancel={() => {
          setPermissionModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePermission}>
          <Form.Item
            name="resource"
            label="Resource"
            rules={[{ required: true, message: 'Please enter resource name' }]}
          >
            <Input placeholder="e.g., customers, invoices, users" />
          </Form.Item>

          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Please enter action' }]}
          >
            <Input placeholder="e.g., create, read, update, delete" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Permission Name"
            rules={[{ required: true, message: 'Please enter permission name' }]}
            help="Format: resource:action (e.g., customers:create)"
          >
            <Input placeholder="e.g., customers:create" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Describe what this permission allows" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleSettingsPage;
