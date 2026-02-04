import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  message,
  Tabs,
  Row,
  Col,
  Divider,
  Switch,
  Select,
  Typography,
  Space,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  CameraOutlined,
  SaveOutlined,
  BellOutlined,
  GlobalOutlined,
  SettingOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import ReflectiveCard from '../components/ReflectiveCard';
import type { UploadProps } from 'antd';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Password } = Input;

const ProfilePage: React.FC = () => {
  const { user, company } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();

  const handleProfileUpdate = async (values: any) => {
    try {
      setLoading(true);
      await userService.updateProfile(values);
      message.success('Profile updated successfully!');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    try {
      setLoading(true);
      if (values.newPassword !== values.confirmPassword) {
        message.error('New passwords do not match');
        return;
      }
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password changed successfully!');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (values: any) => {
    try {
      setLoading(true);
      // TODO: Connect to API
      console.log('Preferences update:', values);
      message.success('Preferences updated successfully!');
    } catch (error) {
      message.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return false;
      }

      // Create preview
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
      };
      
      return false; // Prevent auto upload
    },
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', background: '#000000', minHeight: '100vh' }}>
      <Title level={2}>
        <UserOutlined style={{ marginRight: 12, color: '#667eea' }} />
        My Profile
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <Avatar 
                  size={120} 
                  src={avatarUrl}
                  icon={!avatarUrl && <UserOutlined />}
                  style={{ 
                    border: '4px solid #fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Upload {...uploadProps}>
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<CameraOutlined />}
                    size="small"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      background: '#667eea',
                      border: 'none',
                    }}
                  />
                </Upload>
              </div>
              
              <Title level={4} style={{ marginBottom: 4 }}>
                {user?.firstName} {user?.lastName}
              </Title>
              <Text type="secondary">{user?.email}</Text>
              
              <Divider />
              
              <Space direction="vertical" size={8} style={{ width: '100%', textAlign: 'left' }}>
                <div>
                  <Text type="secondary">Company</Text>
                  <br />
                  <Text strong>{company?.name || 'N/A'}</Text>
                </div>
                <div>
                  <Text type="secondary">Role</Text>
                  <br />
                  <Text strong>Administrator</Text>
                </div>
                <div>
                  <Text type="secondary">Member Since</Text>
                  <br />
                  <Text strong>November 2025</Text>
                </div>
              </Space>
            </div>
          </Card>

          {/* Digital Employee Badge */}
          <Card 
            title={
              <Space>
                <IdcardOutlined />
                <span>Digital Employee Badge</span>
              </Space>
            }
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
            headStyle={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
              <ReflectiveCard
                employeeName={user ? `${user.firstName} ${user.lastName}` : 'Employee'}
                employeeTitle={typeof user?.role === 'string' ? user.role : (user?.role as any)?.name || 'Employee'}
                employeeId={user?.employeeId || 'N/A'}
                enableWebcam={false}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card>
            <Tabs defaultActiveKey="1">
              <TabPane 
                tab={
                  <span>
                    <UserOutlined />
                    Personal Info
                  </span>
                } 
                key="1"
              >
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleProfileUpdate}
                  initialValues={{
                    firstName: user?.firstName,
                    lastName: user?.lastName,
                    email: user?.email,
                    phone: '',
                  }}
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="firstName"
                        label="First Name"
                        rules={[{ required: true, message: 'Please enter your first name' }]}
                      >
                        <Input 
                          prefix={<UserOutlined />} 
                          placeholder="First Name"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="lastName"
                        label="Last Name"
                        rules={[{ required: true, message: 'Please enter your last name' }]}
                      >
                        <Input 
                          prefix={<UserOutlined />} 
                          placeholder="Last Name"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="email"
                    label="Email Address"
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="Email"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Phone Number"
                  >
                    <Input 
                      prefix={<PhoneOutlined />} 
                      placeholder="Phone Number"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />}
                      loading={loading}
                      size="large"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                      }}
                    >
                      Update Profile
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane 
                tab={
                  <span>
                    <LockOutlined />
                    Security
                  </span>
                } 
                key="2"
              >
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordChange}
                >
                  <Form.Item
                    name="currentPassword"
                    label="Current Password"
                    rules={[{ required: true, message: 'Please enter your current password' }]}
                  >
                    <Password 
                      prefix={<LockOutlined />} 
                      placeholder="Current Password"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label="New Password"
                    rules={[
                      { required: true, message: 'Please enter a new password' },
                      { min: 8, message: 'Password must be at least 8 characters' }
                    ]}
                  >
                    <Password 
                      prefix={<LockOutlined />} 
                      placeholder="New Password"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="Confirm New Password"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Please confirm your new password' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Passwords do not match!'));
                        },
                      }),
                    ]}
                  >
                    <Password 
                      prefix={<LockOutlined />} 
                      placeholder="Confirm New Password"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />}
                      loading={loading}
                      size="large"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                      }}
                    >
                      Change Password
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane 
                tab={
                  <span>
                    <SettingOutlined />
                    Preferences
                  </span>
                } 
                key="3"
              >
                <Form
                  form={preferencesForm}
                  layout="vertical"
                  onFinish={handlePreferencesUpdate}
                  initialValues={{
                    language: 'en',
                    timezone: 'Asia/Kolkata',
                    dateFormat: 'DD/MM/YYYY',
                    emailNotifications: true,
                    pushNotifications: true,
                  }}
                >
                  <Form.Item
                    name="language"
                    label="Language"
                  >
                    <Select size="large" suffixIcon={<GlobalOutlined />}>
                      <Select.Option value="en">English</Select.Option>
                      <Select.Option value="hi">Hindi</Select.Option>
                      <Select.Option value="mr">Marathi</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="timezone"
                    label="Timezone"
                  >
                    <Select size="large">
                      <Select.Option value="Asia/Kolkata">Asia/Kolkata (IST)</Select.Option>
                      <Select.Option value="America/New_York">America/New_York (EST)</Select.Option>
                      <Select.Option value="Europe/London">Europe/London (GMT)</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="dateFormat"
                    label="Date Format"
                  >
                    <Select size="large">
                      <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
                      <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
                      <Select.Option value="YYYY-MM-DD">YYYY-MM-DD</Select.Option>
                    </Select>
                  </Form.Item>

                  <Divider />

                  <Title level={5}>
                    <BellOutlined style={{ marginRight: 8 }} />
                    Notifications
                  </Title>

                  <Form.Item
                    name="emailNotifications"
                    label="Email Notifications"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    name="pushNotifications"
                    label="Push Notifications"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />}
                      loading={loading}
                      size="large"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                      }}
                    >
                      Save Preferences
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;
