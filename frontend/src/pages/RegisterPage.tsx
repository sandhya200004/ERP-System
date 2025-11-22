import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Select } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

const { Title, Text } = Typography;
const { Option } = Select;

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await authService.register({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: values.companyName,
        currencyCode: values.currencyCode || 'USD',
      });
      message.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%',
          maxWidth: 550,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img 
            src="/triverse-logo.png" 
            alt="TriVerse Solutions" 
            style={{ 
              width: 200, 
              height: 'auto', 
              marginBottom: 16 
            }} 
          />
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#2c3e7d' }}>Create Account</Title>
          <Text type="secondary">Get started with TriVerse ERP/CRM System</Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[{ required: true, message: 'Please input your first name!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="John" />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[{ required: true, message: 'Please input your last name!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Doe" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="john.doe@example.com" />
          </Form.Item>

          <Form.Item
            label="Company Name"
            name="companyName"
            rules={[{ required: true, message: 'Please input your company name!' }]}
          >
            <Input prefix={<BankOutlined />} placeholder="Acme Corporation" />
          </Form.Item>

          <Form.Item
            label="Currency"
            name="currencyCode"
            initialValue="USD"
            rules={[{ required: true, message: 'Please select a currency!' }]}
          >
            <Select placeholder="Select currency">
              <Option value="USD">USD - US Dollar</Option>
              <Option value="EUR">EUR - Euro</Option>
              <Option value="GBP">GBP - British Pound</Option>
              <Option value="JPY">JPY - Japanese Yen</Option>
              <Option value="AUD">AUD - Australian Dollar</Option>
              <Option value="CAD">CAD - Canadian Dollar</Option>
              <Option value="INR">INR - Indian Rupee</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                height: 45,
                fontSize: 16,
                fontWeight: 600
              }}
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: '#667eea', fontWeight: 600 }}>
              Login here
            </a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
