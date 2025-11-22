import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Select,
  Button,
  Upload,
  message,
  Switch,
  Row,
  Col,
  Divider,
  Typography,
  Space,
  InputNumber,
  Alert
} from 'antd';
import {
  UploadOutlined,
  SaveOutlined,
  SettingOutlined,
  DollarOutlined,
  MailOutlined,
  BellOutlined,
  UserOutlined,
  GlobalOutlined,
  FileTextOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async (values: any) => {
    try {
      setSaving(true);
      // TODO: Connect to API
      console.log('Saving settings:', values);
      message.success('Settings saved successfully!');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <SettingOutlined /> Settings
        </Title>
        <Text type="secondary">Manage your application preferences and configuration</Text>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} tabPosition="left">
          {/* General Settings */}
          <TabPane 
            tab={
              <span>
                <GlobalOutlined />
                General Settings
              </span>
            } 
            key="general"
          >
            <Title level={4}>General Settings</Title>
            <Paragraph type="secondary">Configure basic application settings</Paragraph>
            <Divider />

            <Form layout="vertical" onFinish={handleSaveSettings}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Application Name"
                    name="appName"
                    initialValue="TriVerse ERP/CRM"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Language"
                    name="language"
                    initialValue="en"
                  >
                    <Select>
                      <Select.Option value="en">English</Select.Option>
                      <Select.Option value="hi">Hindi</Select.Option>
                      <Select.Option value="es">Spanish</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Country"
                    name="country"
                    initialValue="India"
                  >
                    <Select showSearch>
                      <Select.Option value="India">🇮🇳 India</Select.Option>
                      <Select.Option value="USA">🇺🇸 United States</Select.Option>
                      <Select.Option value="UK">🇬🇧 United Kingdom</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Date Format"
                    name="dateFormat"
                    initialValue="DD/MM/YYYY"
                  >
                    <Select>
                      <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
                      <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
                      <Select.Option value="YYYY-MM-DD">YYYY-MM-DD</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Time Zone"
                    name="timezone"
                    initialValue="Asia/Kolkata"
                  >
                    <Select showSearch>
                      <Select.Option value="Asia/Kolkata">IST (UTC+5:30)</Select.Option>
                      <Select.Option value="America/New_York">EST (UTC-5)</Select.Option>
                      <Select.Option value="Europe/London">GMT (UTC+0)</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Support Email"
                    name="supportEmail"
                    initialValue="support@triverse.com"
                  >
                    <Input prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                Save Changes
              </Button>
            </Form>
          </TabPane>

          {/* Company Settings */}
          <TabPane 
            tab={
              <span>
                <UserOutlined />
                Company Settings
              </span>
            } 
            key="company"
          >
            <Title level={4}>Company Information</Title>
            <Paragraph type="secondary">Update your company details and branding</Paragraph>
            <Divider />

            <Form layout="vertical" onFinish={handleSaveSettings}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Company Name"
                    name="companyName"
                    initialValue="TriVerse Solutions"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Legal Name"
                    name="legalName"
                    initialValue="TriVerse Solutions Pvt Ltd"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Registration Number"
                    name="registrationNumber"
                    initialValue="U74999MH2024PTC123456"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Tax ID / GST Number"
                    name="taxId"
                    initialValue="27AABCT1234F1Z5"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Company Address"
                name="address"
                initialValue="123 Business Park, Mumbai, Maharashtra 400001"
              >
                <TextArea rows={3} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Phone"
                    name="phone"
                    initialValue="+91 1234567890"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Email"
                    name="email"
                    initialValue="info@triverse.com"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Website"
                    name="website"
                    initialValue="www.triverse.com"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Company Logo">
                <Upload>
                  <Button icon={<UploadOutlined />}>Upload Logo</Button>
                </Upload>
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Recommended size: 400x150px, Max 2MB
                </Text>
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                Save Company Details
              </Button>
            </Form>
          </TabPane>

          {/* Currency Settings */}
          <TabPane 
            tab={
              <span>
                <DollarOutlined />
                Currency Settings
              </span>
            } 
            key="currency"
          >
            <Title level={4}>Currency & Financial Settings</Title>
            <Paragraph type="secondary">Configure currency preferences and financial settings</Paragraph>
            <Divider />

            <Form layout="vertical" onFinish={handleSaveSettings}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Default Currency"
                    name="defaultCurrency"
                    initialValue="INR"
                  >
                    <Select>
                      <Select.Option value="INR">Indian Rupee (₹)</Select.Option>
                      <Select.Option value="USD">US Dollar ($)</Select.Option>
                      <Select.Option value="EUR">Euro (€)</Select.Option>
                      <Select.Option value="GBP">British Pound (£)</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Currency Format"
                    name="currencyFormat"
                    initialValue="symbol"
                  >
                    <Select>
                      <Select.Option value="symbol">Symbol (₹)</Select.Option>
                      <Select.Option value="code">Code (INR)</Select.Option>
                      <Select.Option value="both">Both (₹ INR)</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Decimal Places"
                    name="decimalPlaces"
                    initialValue={2}
                  >
                    <InputNumber min={0} max={4} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Thousand Separator"
                    name="thousandSeparator"
                    initialValue=","
                  >
                    <Select>
                      <Select.Option value=",">Comma (1,000)</Select.Option>
                      <Select.Option value=".">Period (1.000)</Select.Option>
                      <Select.Option value=" ">Space (1 000)</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Default Tax Rate (%)"
                    name="defaultTaxRate"
                    initialValue={18}
                  >
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Tax Label"
                    name="taxLabel"
                    initialValue="GST"
                  >
                    <Select>
                      <Select.Option value="GST">GST</Select.Option>
                      <Select.Option value="VAT">VAT</Select.Option>
                      <Select.Option value="Tax">Tax</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                Save Currency Settings
              </Button>
            </Form>
          </TabPane>

          {/* Invoice Settings */}
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Invoice Settings
              </span>
            } 
            key="invoice"
          >
            <Title level={4}>Invoice Configuration</Title>
            <Paragraph type="secondary">Customize invoice numbering and default settings</Paragraph>
            <Divider />

            <Form layout="vertical" onFinish={handleSaveSettings}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Invoice Prefix"
                    name="invoicePrefix"
                    initialValue="INV-"
                  >
                    <Input placeholder="e.g., INV-" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Starting Number"
                    name="invoiceStartNumber"
                    initialValue={1001}
                  >
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Quote Prefix"
                    name="quotePrefix"
                    initialValue="QT-"
                  >
                    <Input placeholder="e.g., QT-" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Proposal Prefix"
                    name="proposalPrefix"
                    initialValue="PROP-"
                  >
                    <Input placeholder="e.g., PROP-" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Default Payment Terms (Days)"
                    name="paymentTerms"
                    initialValue={30}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Late Fee (%)"
                    name="lateFeePercent"
                    initialValue={2}
                  >
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Invoice Footer Note"
                name="invoiceFooter"
                initialValue="Thank you for your business!"
              >
                <TextArea rows={3} />
              </Form.Item>

              <Form.Item
                label="Payment Instructions"
                name="paymentInstructions"
              >
                <TextArea 
                  rows={4} 
                  placeholder="Bank details, payment methods, etc."
                />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                Save Invoice Settings
              </Button>
            </Form>
          </TabPane>

          {/* Email Settings */}
          <TabPane 
            tab={
              <span>
                <MailOutlined />
                Email Settings
              </span>
            } 
            key="email"
          >
            <Title level={4}>Email Configuration</Title>
            <Paragraph type="secondary">Configure SMTP settings and email templates</Paragraph>
            <Divider />

            <Alert
              message="Email Service Configuration"
              description="Configure your SMTP server to send invoices, quotes, and notifications via email."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form layout="vertical" onFinish={handleSaveSettings}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="SMTP Host"
                    name="smtpHost"
                    initialValue="smtp.gmail.com"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="SMTP Port"
                    name="smtpPort"
                    initialValue={587}
                  >
                    <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="SMTP Username"
                    name="smtpUsername"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="SMTP Password"
                    name="smtpPassword"
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="From Email"
                    name="fromEmail"
                    initialValue="noreply@triverse.com"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="From Name"
                    name="fromName"
                    initialValue="TriVerse Solutions"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                    Save Email Settings
                  </Button>
                  <Button>Test Email</Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Notifications */}
          <TabPane 
            tab={
              <span>
                <BellOutlined />
                Notifications
              </span>
            } 
            key="notifications"
          >
            <Title level={4}>Notification Preferences</Title>
            <Paragraph type="secondary">Manage your notification settings</Paragraph>
            <Divider />

            <Form layout="vertical">
              <Card title="Email Notifications" size="small" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>Invoice Created</Text>
                      <br />
                      <Text type="secondary">Get notified when a new invoice is created</Text>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>Payment Received</Text>
                      <br />
                      <Text type="secondary">Get notified when a payment is received</Text>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>Quote Accepted</Text>
                      <br />
                      <Text type="secondary">Get notified when a quote is accepted</Text>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>Expense Approval</Text>
                      <br />
                      <Text type="secondary">Get notified when expense needs approval</Text>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </Space>
              </Card>

              <Card title="System Notifications" size="small">
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>Daily Summary</Text>
                      <br />
                      <Text type="secondary">Receive daily activity summary</Text>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>Weekly Reports</Text>
                      <br />
                      <Text type="secondary">Receive weekly performance reports</Text>
                    </div>
                    <Switch />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>Low Inventory Alert</Text>
                      <br />
                      <Text type="secondary">Alert when product stock is low</Text>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </Space>
              </Card>

              <Button type="primary" style={{ marginTop: 16 }} icon={<SaveOutlined />}>
                Save Notification Settings
              </Button>
            </Form>
          </TabPane>

          {/* Backup & Security */}
          <TabPane 
            tab={
              <span>
                <CloudUploadOutlined />
                Backup & Security
              </span>
            } 
            key="backup"
          >
            <Title level={4}>Backup & Security</Title>
            <Paragraph type="secondary">Manage data backup and security settings</Paragraph>
            <Divider />

            <Card title="Database Backup" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <Text strong>Automatic Backup</Text>
                    <br />
                    <Text type="secondary">Enable automatic daily backup</Text>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Divider />
                <Text>Last Backup: November 7, 2025 at 02:00 AM</Text>
                <br />
                <Space>
                  <Button type="primary" icon={<CloudUploadOutlined />}>
                    Backup Now
                  </Button>
                  <Button>Download Backup</Button>
                  <Button>Restore from Backup</Button>
                </Space>
              </Space>
            </Card>

            <Card title="Security Settings">
              <Form layout="vertical">
                <Form.Item
                  label="Session Timeout (minutes)"
                  name="sessionTimeout"
                  initialValue={60}
                >
                  <InputNumber min={5} max={480} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  label="Password Policy"
                  name="passwordPolicy"
                  initialValue="strong"
                >
                  <Select>
                    <Select.Option value="weak">Weak (6+ characters)</Select.Option>
                    <Select.Option value="medium">Medium (8+ with numbers)</Select.Option>
                    <Select.Option value="strong">Strong (8+ with special chars)</Select.Option>
                  </Select>
                </Form.Item>

                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>Two-Factor Authentication (2FA)</Text>
                      <br />
                      <Text type="secondary">Add extra security layer</Text>
                    </div>
                    <Switch />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>IP Whitelist</Text>
                      <br />
                      <Text type="secondary">Restrict access to specific IPs</Text>
                    </div>
                    <Switch />
                  </div>
                </Space>

                <Button type="primary" style={{ marginTop: 16 }} icon={<SaveOutlined />}>
                  Save Security Settings
                </Button>
              </Form>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SettingsPage;
