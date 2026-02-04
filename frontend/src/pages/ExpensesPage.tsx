import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  Upload, 
  Space, 
  Card, 
  Typography, 
  Tag,
  Row,
  Col,
  Statistic,
  App
} from 'antd';
import { 
  PlusOutlined, 
  UploadOutlined, 
  EditOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Expense {
  id: string;
  expenseNumber: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor?: string;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  receipt?: string;
  notes?: string;
}

const ExpensesPage: React.FC = () => {
  const { message } = App.useApp();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form] = Form.useForm();

  const expenseCategories = [
    'Office Supplies',
    'Travel',
    'Marketing',
    'Utilities',
    'Software & Tools',
    'Salaries',
    'Rent',
    'Equipment',
    'Professional Services',
    'Entertainment',
    'Other'
  ];

  const paymentMethods = [
    'Cash',
    'Credit Card',
    'Debit Card',
    'Bank Transfer',
    'UPI',
    'Cheque'
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      // Mock data for now - will connect to API later
      const mockExpenses: Expense[] = [
        {
          id: '1',
          expenseNumber: 'EXP-001',
          category: 'Office Supplies',
          description: 'Printer Paper and Stationery',
          amount: 2500,
          expenseDate: '2025-11-01',
          vendor: 'Office Mart',
          paymentMethod: 'Credit Card',
          status: 'approved',
          notes: 'Monthly supplies'
        },
        {
          id: '2',
          expenseNumber: 'EXP-002',
          category: 'Software & Tools',
          description: 'Adobe Creative Cloud Subscription',
          amount: 3999,
          expenseDate: '2025-11-05',
          vendor: 'Adobe',
          paymentMethod: 'UPI',
          status: 'paid'
        }
      ];
      setExpenses(mockExpenses);
    } catch (error) {
      message.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    form.resetFields();
    form.setFieldsValue({ expenseDate: dayjs(), status: 'pending' });
    setModalVisible(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      ...expense,
      expenseDate: dayjs(expense.expenseDate)
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete Expense',
      content: 'Are you sure you want to delete this expense?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          setExpenses(expenses.filter(exp => exp.id !== id));
          message.success('Expense deleted successfully');
        } catch (error) {
          message.error('Failed to delete expense');
        }
      }
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const expenseData = {
        ...values,
        expenseDate: values.expenseDate.format('YYYY-MM-DD')
      };

      if (editingExpense) {
        // Update existing expense
        setExpenses(expenses.map(exp => 
          exp.id === editingExpense.id 
            ? { ...exp, ...expenseData }
            : exp
        ));
        message.success('Expense updated successfully');
      } else {
        // Add new expense
        const newExpense: Expense = {
          id: Date.now().toString(),
          expenseNumber: `EXP-${String(expenses.length + 1).padStart(3, '0')}`,
          ...expenseData
        };
        setExpenses([newExpense, ...expenses]);
        message.success('Expense added successfully');
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Please fill all required fields');
    }
  };

  const handleApprove = (id: string) => {
    setExpenses(expenses.map(exp => 
      exp.id === id ? { ...exp, status: 'approved' as const } : exp
    ));
    message.success('Expense approved');
  };

  const handleReject = (id: string) => {
    setExpenses(expenses.map(exp => 
      exp.id === id ? { ...exp, status: 'rejected' as const } : exp
    ));
    message.success('Expense rejected');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'orange',
      approved: 'blue',
      rejected: 'red',
      paid: 'green'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const calculateStats = () => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const pending = expenses.filter(exp => exp.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0);
    const approved = expenses.filter(exp => exp.status === 'approved').reduce((sum, exp) => sum + exp.amount, 0);
    const paid = expenses.filter(exp => exp.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0);
    
    return { total, pending, approved, paid };
  };

  const stats = calculateStats();

  const columns = [
    {
      title: 'Expense #',
      dataIndex: 'expenseNumber',
      key: 'expenseNumber',
      width: 120
    },
    {
      title: 'Date',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 150
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <Text strong style={{ color: '#cf1322' }}>₹{amount.toLocaleString('en-IN')}</Text>
      )
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 130
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: Expense) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record.id)}
              >
                Reject
              </Button>
            </>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#000000', minHeight: '100vh' }}>
      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Expenses"
              value={stats.total}
              prefix="₹"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Approval"
              value={stats.pending}
              prefix="₹"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Approved"
              value={stats.approved}
              prefix="₹"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Paid"
              value={stats.paid}
              prefix="₹"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={2}>Expenses</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddExpense}>
            Add Expense
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width="90%"
        style={{ maxWidth: 700 }}
        centered
        okText={editingExpense ? 'Update' : 'Add'}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  {expenseCategories.map(cat => (
                    <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expenseDate"
                label="Expense Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input placeholder="Enter expense description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount (₹)"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  prefix="₹"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vendor"
                label="Vendor"
              >
                <Input placeholder="Vendor name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                rules={[{ required: true, message: 'Please select payment method' }]}
              >
                <Select placeholder="Select payment method">
                  {paymentMethods.map(method => (
                    <Select.Option key={method} value={method}>{method}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select>
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="approved">Approved</Select.Option>
                  <Select.Option value="rejected">Rejected</Select.Option>
                  <Select.Option value="paid">Paid</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>

          <Form.Item
            name="receipt"
            label="Receipt"
          >
            <Upload>
              <Button icon={<UploadOutlined />}>Upload Receipt</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
