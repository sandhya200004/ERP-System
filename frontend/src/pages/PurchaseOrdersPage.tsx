import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Card,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  App,
  Row,
  Col,
  Statistic,
  DatePicker,
  InputNumber,
  Popconfirm,
  Divider,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  SendOutlined,
} from '@ant-design/icons';
import purchaseOrderService, { PurchaseOrder, POLine, POStatistics } from '../services/purchase-order.service';
import vendorService, { Vendor } from '../services/vendor.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PurchaseOrdersPage: React.FC = () => {
  const { message } = App.useApp();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [statistics, setStatistics] = useState<POStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();
  const [lineItems, setLineItems] = useState<POLine[]>([{ description: '', quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchVendors();
    fetchStatistics();
  }, [statusFilter]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const data = await purchaseOrderService.findAll({
        status: statusFilter,
      });
      setPurchaseOrders(data);
    } catch (error: any) {
      message.error('Failed to fetch purchase orders');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await vendorService.findAll({ is_active: true });
      setVendors(data);
    } catch (error: any) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await purchaseOrderService.getStatistics();
      setStatistics(stats);
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
    setIsModalVisible(true);
  };

  const handleView = async (po: PurchaseOrder) => {
    try {
      const fullPO = await purchaseOrderService.findOne(po.id);
      setSelectedPO(fullPO);
      setIsViewModalVisible(true);
    } catch (error: any) {
      message.error('Failed to load purchase order details');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const poData = {
        vendor_id: values.vendor_id,
        order_date: values.order_date.format('YYYY-MM-DD'),
        expected_date: values.expected_date ? values.expected_date.format('YYYY-MM-DD') : undefined,
        currency_code: values.currency_code || 'USD',
        notes: values.notes,
        terms: values.terms,
        lines: lineItems.filter(line => line.description && line.quantity > 0),
      };

      await purchaseOrderService.create(poData);
      message.success('Purchase order created successfully');
      setIsModalVisible(false);
      fetchPurchaseOrders();
      fetchStatistics();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create purchase order');
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    try {
      await purchaseOrderService.submit(id);
      message.success('Purchase order submitted for approval');
      fetchPurchaseOrders();
      fetchStatistics();
    } catch (error: any) {
      message.error('Failed to submit purchase order');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await purchaseOrderService.approve(id);
      message.success('Purchase order approved');
      fetchPurchaseOrders();
      fetchStatistics();
      if (selectedPO?.id === id) {
        setIsViewModalVisible(false);
      }
    } catch (error: any) {
      message.error('Failed to approve purchase order');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await purchaseOrderService.reject(id);
      message.success('Purchase order rejected');
      fetchPurchaseOrders();
      fetchStatistics();
      if (selectedPO?.id === id) {
        setIsViewModalVisible(false);
      }
    } catch (error: any) {
      message.error('Failed to reject purchase order');
    }
  };



  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
  };

  const updateLineItem = (index: number, field: keyof POLine, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'default',
      SUBMITTED: 'processing',
      APPROVED: 'success',
      REJECTED: 'error',
      PARTIALLY_RECEIVED: 'warning',
      FULLY_RECEIVED: 'success',
      CANCELLED: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'APPROVED' || status === 'FULLY_RECEIVED') return <CheckCircleOutlined />;
    if (status === 'REJECTED' || status === 'CANCELLED') return <CloseCircleOutlined />;
    return undefined;
  };

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'po_number',
      key: 'po_number',
      width: 120,
    },
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'name'],
      key: 'vendor',
      width: 200,
      render: (text: string, record: PurchaseOrder) => text || record.vendor_id,
    },
    {
      title: 'Order Date',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Expected Date',
      dataIndex: 'expected_date',
      key: 'expected_date',
      width: 120,
      render: (date: string) => (date ? dayjs(date).format('MMM DD, YYYY') : '—'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      align: 'right' as const,
      render: (amount: number, record: PurchaseOrder) => (
        <Text strong>{record.currency_code} {amount.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: PurchaseOrder) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            type="link"
            onClick={() => handleView(record)}
          >
            View
          </Button>
          {record.status === 'DRAFT' && (
            <Button
              icon={<SendOutlined />}
              size="small"
              type="primary"
              onClick={() => handleSubmitForApproval(record.id)}
            >
              Submit
            </Button>
          )}
          {record.status === 'SUBMITTED' && (
            <>
              <Button
                icon={<CheckCircleOutlined />}
                size="small"
                type="primary"
                onClick={() => handleApprove(record.id)}
              >
                Approve
              </Button>
              <Popconfirm
                title="Reject PO"
                description="Are you sure you want to reject this PO?"
                onConfirm={() => handleReject(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button icon={<CloseCircleOutlined />} size="small" danger>
                  Reject
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <ShoppingCartOutlined /> Purchase Orders
      </Title>

      {/* Statistics */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="Total POs" value={statistics.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Approved" 
                value={statistics.approved}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending Approval"
                value={statistics.submitted}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Value"
                value={statistics.total_value}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Select
            placeholder="Filter by status"
            style={{ width: 200 }}
            allowClear
            onChange={setStatusFilter}
            value={statusFilter}
          >
            <Option value="DRAFT">Draft</Option>
            <Option value="SUBMITTED">Submitted</Option>
            <Option value="APPROVED">Approved</Option>
            <Option value="REJECTED">Rejected</Option>
            <Option value="PARTIALLY_RECEIVED">Partially Received</Option>
            <Option value="FULLY_RECEIVED">Fully Received</Option>
            <Option value="CANCELLED">Cancelled</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create Purchase Order
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={purchaseOrders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} purchase orders`,
          }}
        />
      </Card>

      {/* Create PO Modal */}
      <Modal
        title="Create Purchase Order"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={900}
        okText="Create"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Vendor"
                name="vendor_id"
                rules={[{ required: true, message: 'Please select a vendor' }]}
              >
                <Select placeholder="Select vendor" showSearch optionFilterProp="children">
                  {vendors.map((vendor) => (
                    <Option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Currency" name="currency_code" initialValue="USD">
                <Select>
                  <Option value="USD">USD - US Dollar</Option>
                  <Option value="EUR">EUR - Euro</Option>
                  <Option value="GBP">GBP - British Pound</Option>
                  <Option value="INR">INR - Indian Rupee</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Order Date"
                name="order_date"
                rules={[{ required: true, message: 'Please select order date' }]}
                initialValue={dayjs()}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Expected Delivery Date" name="expected_date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Line Items</Divider>

          {lineItems.map((item, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={8}>
                <Col span={10}>
                  <Form.Item label="Description" style={{ marginBottom: 0 }}>
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item label="Quantity" style={{ marginBottom: 0 }}>
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      value={item.quantity}
                      onChange={(value) => updateLineItem(index, 'quantity', value || 0)}
                    />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item label="Unit Price" style={{ marginBottom: 0 }}>
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      value={item.unit_price}
                      onChange={(value) => updateLineItem(index, 'unit_price', value || 0)}
                    />
                  </Form.Item>
                </Col>
                <Col span={2}>
                  <Form.Item label=" " style={{ marginBottom: 0 }}>
                    <Text strong>${(item.quantity * item.unit_price).toFixed(2)}</Text>
                  </Form.Item>
                </Col>
                <Col span={2}>
                  <Form.Item label=" " style={{ marginBottom: 0 }}>
                    {lineItems.length > 1 && (
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => removeLineItem(index)}
                      />
                    )}
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}

          <Button type="dashed" onClick={addLineItem} block icon={<PlusOutlined />}>
            Add Line Item
          </Button>

          <Divider />

          <Row justify="end">
            <Col>
              <Text strong style={{ fontSize: 16 }}>
                Total: ${calculateTotal().toFixed(2)}
              </Text>
            </Col>
          </Row>

          <Form.Item label="Terms & Conditions" name="terms">
            <TextArea rows={2} placeholder="Payment terms, delivery terms, etc." />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={2} placeholder="Internal notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* View PO Modal */}
      <Modal
        title={`Purchase Order ${selectedPO?.po_number}`}
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>,
          selectedPO?.status === 'SUBMITTED' && (
            <>
              <Button
                key="reject"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => selectedPO && handleReject(selectedPO.id)}
              >
                Reject
              </Button>
              <Button
                key="approve"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => selectedPO && handleApprove(selectedPO.id)}
              >
                Approve
              </Button>
            </>
          ),
        ]}
      >
        {selectedPO && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="PO Number">{selectedPO.po_number}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedPO.status)} icon={getStatusIcon(selectedPO.status)}>
                  {selectedPO.status.replace('_', ' ')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Vendor">{selectedPO.vendor?.name || selectedPO.vendor_id}</Descriptions.Item>
              <Descriptions.Item label="Currency">{selectedPO.currency_code}</Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {dayjs(selectedPO.order_date).format('MMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Expected Date">
                {selectedPO.expected_date ? dayjs(selectedPO.expected_date).format('MMM DD, YYYY') : '—'}
              </Descriptions.Item>
              {selectedPO.approved_by && (
                <>
                  <Descriptions.Item label="Approved By">{selectedPO.approved_by}</Descriptions.Item>
                  <Descriptions.Item label="Approved At">
                    {selectedPO.approved_at ? dayjs(selectedPO.approved_at).format('MMM DD, YYYY HH:mm') : '—'}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            <Divider>Line Items</Divider>

            <Table
              dataSource={selectedPO.lines}
              columns={[
                {
                  title: 'Description',
                  dataIndex: 'description',
                  key: 'description',
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  align: 'right',
                },
                {
                  title: 'Unit Price',
                  dataIndex: 'unit_price',
                  key: 'unit_price',
                  align: 'right',
                  render: (price: number) => `$${price.toFixed(2)}`,
                },
                {
                  title: 'Total',
                  key: 'line_total',
                  align: 'right',
                  render: (_: any, record: POLine) => `$${(record.quantity * record.unit_price).toFixed(2)}`,
                },
              ]}
              pagination={false}
              size="small"
            />

            <Row justify="end" style={{ marginTop: 16 }}>
              <Col>
                <Space direction="vertical" align="end">
                  <Text>Subtotal: ${selectedPO.subtotal.toFixed(2)}</Text>
                  <Text>Tax: ${selectedPO.tax_total.toFixed(2)}</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    Total: ${selectedPO.total_amount.toFixed(2)}
                  </Title>
                </Space>
              </Col>
            </Row>

            {selectedPO.terms && (
              <>
                <Divider>Terms & Conditions</Divider>
                <Text>{selectedPO.terms}</Text>
              </>
            )}

            {selectedPO.notes && (
              <>
                <Divider>Notes</Divider>
                <Text type="secondary">{selectedPO.notes}</Text>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrdersPage;
