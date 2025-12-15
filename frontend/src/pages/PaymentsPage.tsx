import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Statistic,
  Descriptions,
  Alert,
  App,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { paymentService } from '../services/payment.service';
import { invoiceService } from '../services/invoice.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Payment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  notes?: string;
  status?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    customer: {
      name: string;
    };
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  customer: {
    id: string;
    name: string;
  };
}

const PaymentsPage: React.FC = () => {
  const { message } = App.useApp();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [stats, setStats] = useState({ total: 0, totalAmount: 0 });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await paymentService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await paymentService.getAll();
      setPayments(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await invoiceService.getAll();
      console.log('Invoice API response:', response);
      
      // Handle paginated response structure
      const invoiceList = response?.data || response || [];
      console.log('Invoice list:', invoiceList);
      
      // Map and filter for unpaid or partially paid invoices
      const unpaidInvoices = invoiceList
        .filter((inv: any) => {
          const status = inv.status?.toLowerCase();
          return status === 'sent' || status === 'partially_paid' || status === 'overdue' || status === 'draft';
        })
        .map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number || inv.invoiceNumber,
          totalAmount: inv.total_amount || inv.totalAmount || inv.total || 0,
          paidAmount: inv.paid_amount || inv.paidAmount || 0,
          dueAmount: inv.amount_due || inv.amountDue || inv.dueAmount || 0,
          status: inv.status,
          customer: {
            id: inv.customer_id || inv.customerId || inv.customer?.id,
            name: inv.customer?.name || inv.customerName || 'Unknown'
          }
        }));
      
      console.log('Mapped unpaid invoices:', unpaidInvoices);
      setInvoices(unpaidInvoices);
    } catch (error: any) {
      console.error('Failed to fetch invoices:', error);
      message.error('Failed to load invoices');
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setSelectedInvoiceId(null);
    setPaymentAmount(0);
    setModalVisible(true);
  };

  const handleView = (record: Payment) => {
    setSelectedPayment(record);
    setDetailModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this payment?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await paymentService.delete(id);
          message.success('Payment deleted successfully');
          fetchPayments();
          fetchStats();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Failed to delete payment');
        }
      },
    });
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      const dueAmount = invoice.totalAmount - (invoice.paidAmount || 0);
      setPaymentAmount(dueAmount);
      form.setFieldsValue({ amount: dueAmount });
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (!selectedInvoiceId || !selectedInvoice) {
        message.error('Please select an invoice');
        return;
      }

      const paymentData = {
        customerId: selectedInvoice.customer.id,
        paymentDate: values.paymentDate.toISOString(),
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        reference: values.reference || '',
        notes: values.notes || '',
        applications: [
          {
            invoiceId: selectedInvoiceId,
            amount: values.amount,
          },
        ],
      };

      await paymentService.create(paymentData);
      message.success('Payment recorded successfully');
      setModalVisible(false);
      fetchPayments();
      fetchInvoices();
      fetchStats();
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const columns = [
    {
      title: 'Payment #',
      dataIndex: 'paymentNumber',
      key: 'paymentNumber',
      width: 140,
    },
    {
      title: 'Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Customer',
      dataIndex: ['invoice', 'customer', 'name'],
      key: 'customer',
      render: (_: any, record: Payment) => record.invoice?.customer?.name || 'N/A',
    },
    {
      title: 'Invoice',
      dataIndex: ['invoice', 'invoiceNumber'],
      key: 'invoice',
      width: 140,
      render: (_: any, record: Payment) => record.invoice?.invoiceNumber || 'N/A',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (value: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 140,
      render: (method: string) => {
        const colorMap: any = {
          cash: 'green',
          bank_transfer: 'blue',
          credit_card: 'purple',
          debit_card: 'cyan',
          cheque: 'orange',
        };
        return <Tag color={colorMap[method] || 'default'}>{method.replace('_', ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      width: 160,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: any, record: Payment) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>
            View
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <DollarOutlined style={{ marginRight: 12, color: '#667eea' }} />
        Payments
      </Title>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Payments"
              value={stats.total}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Amount Received"
              value={stats.totalAmount}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pending Invoices"
              value={invoices.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <Text strong style={{ fontSize: 16 }}>
            Payment History
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
            Record Payment
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={payments}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} payments` }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Record Payment Modal */}
      <Modal
        title={
          <span>
            <DollarOutlined style={{ marginRight: 8, color: '#667eea' }} />
            Record Payment
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width="90%"
        style={{ maxWidth: 700 }}
        centered
        okText="Record Payment"
      >
        <Alert
          message="Select an invoice and enter payment details"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="invoiceId"
            label="Select Invoice"
            rules={[{ required: true, message: 'Please select an invoice' }]}
          >
            <Select
              placeholder="Select an invoice to pay"
              onChange={handleInvoiceSelect}
              size="large"
              showSearch
              optionFilterProp="children"
              loading={invoices.length === 0}
            >
              {invoices.map((invoice) => (
                <Select.Option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} - {invoice.customer?.name} - Due: ₹
                  {(invoice.totalAmount - (invoice.paidAmount || 0)).toLocaleString('en-IN')}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {selectedInvoiceId && (
            <Alert
              message={`Payment Amount: ₹${paymentAmount.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentDate"
                label="Payment Date"
                rules={[{ required: true, message: 'Please select payment date' }]}
                initialValue={dayjs()}
              >
                <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[
                  { required: true, message: 'Please enter amount' },
                  {
                    validator: (_, value) => {
                      if (value && value > 0) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Amount must be greater than 0'));
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  prefix="₹"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) => (value ? parseFloat(value.replace(/₹\s?|(,*)/g, '')) : 0) as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Select placeholder="Select payment method" size="large">
              <Select.Option value="cash">Cash</Select.Option>
              <Select.Option value="bank_transfer">Bank Transfer</Select.Option>
              <Select.Option value="credit_card">Credit Card</Select.Option>
              <Select.Option value="debit_card">Debit Card</Select.Option>
              <Select.Option value="cheque">Cheque</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="reference" label="Reference / Transaction ID">
            <Input placeholder="Enter transaction reference or cheque number" size="large" />
          </Form.Item>

          <Form.Item name="notes" label="Notes (Optional)">
            <TextArea rows={3} placeholder="Add any additional notes about this payment" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Payment Detail Modal */}
      <Modal
        title="Payment Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: 600 }}
        centered
      >
        {selectedPayment && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Payment Number">
              <Text strong>{selectedPayment.paymentNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {dayjs(selectedPayment.paymentDate).format('DD MMMM YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Customer">
              {selectedPayment.invoice?.customer?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Invoice">
              {selectedPayment.invoice?.invoiceNumber || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong style={{ color: '#52c41a', fontSize: 18 }}>
                ₹{Number(selectedPayment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Payment Method">
              <Tag color="blue">{selectedPayment.paymentMethod.replace('_', ' ').toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Reference">{selectedPayment.reference || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Notes">{selectedPayment.notes || 'No notes'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default PaymentsPage;
