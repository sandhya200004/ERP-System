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
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  DollarOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import supplierInvoiceService, {
  SupplierInvoice,
  InvoiceLine,
  RecordPaymentDto,
} from '../services/supplier-invoice.service';
import vendorService, { Vendor } from '../services/vendor.service';
import purchaseOrderService, { PurchaseOrder } from '../services/purchase-order.service';
import goodsReceiptService from '../services/goods-receipt.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SupplierInvoicesPage: React.FC = () => {
  const { message } = App.useApp();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [lineItems, setLineItems] = useState<InvoiceLine[]>([
    { description: '', quantity: 1, unit_price: 0, tax_amount: 0 },
  ]);

  useEffect(() => {
    fetchInvoices();
    fetchVendors();
    fetchPurchaseOrders();
    fetchGoodsReceipts();
  }, [statusFilter, paymentStatusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await supplierInvoiceService.findAll({
        status: statusFilter,
        payment_status: paymentStatusFilter,
      });
      setInvoices(data);
    } catch (error: any) {
      message.error('Failed to fetch supplier invoices');
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

  const fetchPurchaseOrders = async () => {
    try {
      const data = await purchaseOrderService.findAll({ status: 'approved' });
      setPurchaseOrders(data);
    } catch (error: any) {
      console.error('Failed to fetch purchase orders:', error);
    }
  };

  const fetchGoodsReceipts = async () => {
    try {
      const data = await goodsReceiptService.findAll({});
      setGoodsReceipts(data);
    } catch (error: any) {
      console.error('Failed to fetch goods receipts:', error);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setLineItems([{ description: '', quantity: 1, unit_price: 0, tax_amount: 0 }]);
    setIsModalVisible(true);
  };

  const handleView = async (invoice: SupplierInvoice) => {
    try {
      const fullInvoice = await supplierInvoiceService.findOne(invoice.id);
      setSelectedInvoice(fullInvoice);
      setIsViewModalVisible(true);
    } catch (error: any) {
      message.error('Failed to load invoice details');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const createDto = {
        vendor_invoice_number: values.vendor_invoice_number,
        vendor_id: values.vendor_id,
        po_id: values.po_id,
        grn_id: values.grn_id,
        invoice_date: values.invoice_date.format('YYYY-MM-DD'),
        due_date: values.due_date.format('YYYY-MM-DD'),
        currency_code: values.currency_code || 'USD',
        notes: values.notes,
        lines: lineItems,
      };

      await supplierInvoiceService.create(createDto);
      message.success('Supplier invoice created successfully');
      setIsModalVisible(false);
      fetchInvoices();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create supplier invoice');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await supplierInvoiceService.approve(id);
      message.success('Invoice approved successfully');
      fetchInvoices();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to approve invoice');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const notes = await new Promise<string>((resolve) => {
        Modal.confirm({
          title: 'Reject Invoice',
          content: (
            <Input.TextArea
              placeholder="Enter rejection reason..."
              onChange={(e) => resolve(e.target.value)}
            />
          ),
          onOk: () => resolve(''),
        });
      });

      await supplierInvoiceService.reject(id, notes);
      message.success('Invoice rejected');
      fetchInvoices();
    } catch (error: any) {
      message.error('Failed to reject invoice');
    }
  };

  const handleRecordPayment = (invoice: SupplierInvoice) => {
    setSelectedInvoice(invoice);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      amount: invoice.total,
      payment_date: dayjs(),
    });
    setIsPaymentModalVisible(true);
  };

  const handlePaymentSubmit = async (values: any) => {
    if (!selectedInvoice) return;

    try {
      const paymentDto: RecordPaymentDto = {
        payment_date: values.payment_date.format('YYYY-MM-DD'),
        amount: values.amount,
        payment_method: values.payment_method,
        reference_number: values.reference_number,
        notes: values.notes,
      };

      await supplierInvoiceService.recordPayment(selectedInvoice.id, paymentDto);
      message.success('Payment recorded successfully');
      setIsPaymentModalVisible(false);
      fetchInvoices();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const handlePerformMatch = async (id: string) => {
    try {
      const result = await supplierInvoiceService.performMatch(id);
      if (result.match_status === 'matched') {
        message.success('3-way matching completed successfully - All matched!');
      } else {
        Modal.warning({
          title: 'Matching Discrepancies Found',
          content: (
            <div>
              <p><strong>Match Status:</strong> {result.match_status}</p>
              <p><strong>Quantity Match:</strong> {result.quantity_match ? '✓ Yes' : '✗ No'}</p>
              <p><strong>Price Match:</strong> {result.price_match ? '✓ Yes' : '✗ No'}</p>
              <p><strong>Total Match:</strong> {result.total_match ? '✓ Yes' : '✗ No'}</p>
              <Divider />
              <p><strong>PO Total:</strong> ${result.po_total.toFixed(2)}</p>
              <p><strong>GRN Total:</strong> ${result.grn_total.toFixed(2)}</p>
              <p><strong>Invoice Total:</strong> ${result.invoice_total.toFixed(2)}</p>
            </div>
          ),
        });
      }
      fetchInvoices();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to perform matching');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supplierInvoiceService.delete(id);
      message.success('Invoice deleted successfully');
      fetchInvoices();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, tax_amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
  };

  const updateLineItem = (index: number, field: keyof InvoiceLine, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + (item.quantity * item.unit_price),
      0
    );
    const taxTotal = lineItems.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    return { subtotal, taxTotal, total: subtotal + taxTotal };
  };

  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      approved: 'green',
      rejected: 'red',
      paid: 'blue',
      partially_paid: 'cyan',
      cancelled: 'default',
      draft: 'gray',
    };
    return <Tag color={colors[status] || 'default'}>{status.toUpperCase().replace('_', ' ')}</Tag>;
  };

  const getPaymentStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      unpaid: 'red',
      partially_paid: 'orange',
      paid: 'green',
      overdue: 'red',
      pending: 'blue',
    };
    return <Tag color={colors[status] || 'default'}>{status.toUpperCase().replace('_', ' ')}</Tag>;
  };

  const columns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      fixed: 'left' as const,
      width: 150,
    },
    {
      title: 'Vendor Invoice #',
      dataIndex: 'vendor_invoice_number',
      key: 'vendor_invoice_number',
      width: 150,
    },
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'name'],
      key: 'vendor',
      width: 200,
    },
    {
      title: 'Invoice Date',
      dataIndex: 'invoice_date',
      key: 'invoice_date',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      align: 'right' as const,
      render: (amount: number) => `$${Number(amount).toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Payment Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 140,
      render: (status: string) => getPaymentStatusTag(status),
    },
    {
      title: 'Match Status',
      key: 'match_status',
      width: 120,
      render: (_: any, record: SupplierInvoice) => {
        if (!record.three_way_matches) return <Tag>N/A</Tag>;
        const matchStatus = record.three_way_matches.match_status;
        const colors: Record<string, string> = {
          matched: 'green',
          discrepancy: 'red',
          pending: 'orange',
        };
        return <Tag color={colors[matchStatus]}>{matchStatus.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 250,
      render: (_: any, record: SupplierInvoice) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                Approve
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record.id)}
              >
                Reject
              </Button>
            </>
          )}
          {record.status === 'approved' && record.payment_status !== 'paid' && (
            <Button
              type="link"
              size="small"
              icon={<DollarOutlined />}
              onClick={() => handleRecordPayment(record)}
            >
              Pay
            </Button>
          )}
          {record.po_id && record.grn_id && !record.three_way_matches && (
            <Button
              type="link"
              size="small"
              icon={<SyncOutlined />}
              onClick={() => handlePerformMatch(record.id)}
            >
              Match
            </Button>
          )}
          {record.status === 'pending' && (
            <Popconfirm
              title="Delete this invoice?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const totals = calculateTotals();

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Space split={<Divider type="vertical" />}>
              <Statistic
                title="Total Invoices"
                value={invoices.length}
                prefix={<FileTextOutlined />}
              />
              <Statistic
                title="Pending Approval"
                value={invoices.filter((i) => i.status === 'pending').length}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
              <Statistic
                title="Unpaid"
                value={invoices.filter((i) => i.payment_status === 'unpaid' || i.payment_status === 'partially_paid').length}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
              <Statistic
                title="Total Amount"
                value={invoices.reduce((sum, i) => sum + Number(i.total), 0)}
                prefix="$"
                precision={2}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Supplier Invoices
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Select
              style={{ width: 150 }}
              placeholder="Filter by Status"
              allowClear
              onChange={setStatusFilter}
            >
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
              <Option value="paid">Paid</Option>
              <Option value="partially_paid">Partially Paid</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
            <Select
              style={{ width: 180 }}
              placeholder="Filter by Payment"
              allowClear
              onChange={setPaymentStatusFilter}
            >
              <Option value="unpaid">Unpaid</Option>
              <Option value="partially_paid">Partially Paid</Option>
              <Option value="paid">Paid</Option>
              <Option value="overdue">Overdue</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Create Invoice
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={invoices}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} invoices` }}
        />
      </Card>

      {/* Create/Edit Invoice Modal */}
      <Modal
        title="Create Supplier Invoice"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={900}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vendor_id"
                label="Vendor"
                rules={[{ required: true, message: 'Please select vendor' }]}
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
              <Form.Item
                name="vendor_invoice_number"
                label="Vendor Invoice Number"
                rules={[{ required: true, message: 'Please enter vendor invoice number' }]}
              >
                <Input placeholder="INV-2026-001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="po_id" label="Purchase Order (Optional)">
                <Select placeholder="Select PO" allowClear showSearch>
                  {purchaseOrders.map((po) => (
                    <Option key={po.id} value={po.id}>
                      {po.po_number}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="grn_id" label="Goods Receipt (Optional)">
                <Select placeholder="Select GRN" allowClear showSearch>
                  {goodsReceipts.map((grn: any) => (
                    <Option key={grn.id} value={grn.id}>
                      {grn.grn_number}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currency_code" label="Currency" initialValue="USD">
                <Select>
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                  <Option value="GBP">GBP</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="invoice_date"
                label="Invoice Date"
                rules={[{ required: true, message: 'Please select invoice date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="due_date"
                label="Due Date"
                rules={[{ required: true, message: 'Please select due date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Line Items</Divider>

          {lineItems.map((item, index) => (
            <Row key={index} gutter={8} align="middle">
              <Col span={10}>
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="Qty"
                  min={0}
                  style={{ width: '100%' }}
                  value={item.quantity}
                  onChange={(value) => updateLineItem(index, 'quantity', value || 0)}
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="Unit Price"
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  value={item.unit_price}
                  onChange={(value) => updateLineItem(index, 'unit_price', value || 0)}
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="Tax"
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  value={item.tax_amount}
                  onChange={(value) => updateLineItem(index, 'tax_amount', value || 0)}
                />
              </Col>
              <Col span={2}>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length === 1}
                />
              </Col>
            </Row>
          ))}

          <Button type="dashed" onClick={addLineItem} block style={{ marginTop: 16 }}>
            <PlusOutlined /> Add Line Item
          </Button>

          <Divider />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="notes" label="Notes">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Subtotal">
                  ${totals.subtotal.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Tax Total">
                  ${totals.taxTotal.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label={<strong>Total</strong>}>
                  <strong>${totals.total.toFixed(2)}</strong>
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Create Invoice
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        title={`Invoice: ${selectedInvoice?.invoice_number || ''}`}
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        width={800}
        footer={null}
      >
        {selectedInvoice && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Invoice Number">{selectedInvoice.invoice_number}</Descriptions.Item>
              <Descriptions.Item label="Vendor Invoice #">{selectedInvoice.vendor_invoice_number}</Descriptions.Item>
              <Descriptions.Item label="Vendor">{selectedInvoice.vendor?.name}</Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusTag(selectedInvoice.status)}</Descriptions.Item>
              <Descriptions.Item label="Invoice Date">
                {dayjs(selectedInvoice.invoice_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="Due Date">
                {dayjs(selectedInvoice.due_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                {getPaymentStatusTag(selectedInvoice.payment_status)}
              </Descriptions.Item>
              <Descriptions.Item label="Currency">{selectedInvoice.currency_code}</Descriptions.Item>
              {selectedInvoice.purchase_orders && (
                <Descriptions.Item label="PO Number" span={2}>
                  {selectedInvoice.purchase_orders.po_number}
                </Descriptions.Item>
              )}
              {selectedInvoice.goods_receipts && (
                <Descriptions.Item label="GRN Number" span={2}>
                  {selectedInvoice.goods_receipts.grn_number}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider>Line Items</Divider>
            <Table
              dataSource={selectedInvoice.invoice_lines}
              columns={[
                { title: 'Description', dataIndex: 'description', key: 'description' },
                { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
                { title: 'Unit Price', dataIndex: 'unit_price', key: 'unit_price', width: 120, render: (val: number) => `$${Number(val).toFixed(2)}` },
                { title: 'Tax', dataIndex: 'tax_amount', key: 'tax_amount', width: 100, render: (val: number) => `$${Number(val || 0).toFixed(2)}` },
                { title: 'Total', dataIndex: 'total', key: 'total', width: 120, render: (val: number) => `$${Number(val).toFixed(2)}` },
              ]}
              pagination={false}
              size="small"
              rowKey="id"
            />

            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                {selectedInvoice.notes && (
                  <>
                    <Text strong>Notes:</Text>
                    <p>{selectedInvoice.notes}</p>
                  </>
                )}
              </Col>
              <Col span={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Subtotal">
                    ${Number(selectedInvoice.subtotal).toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tax Total">
                    ${Number(selectedInvoice.tax_total).toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label={<strong>Total</strong>}>
                    <strong>${Number(selectedInvoice.total).toFixed(2)}</strong>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            {selectedInvoice.three_way_matches && (
              <>
                <Divider>3-Way Match Results</Divider>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Match Status">
                    <Tag
                      color={
                        selectedInvoice.three_way_matches.match_status === 'matched'
                          ? 'green'
                          : selectedInvoice.three_way_matches.match_status === 'discrepancy'
                          ? 'red'
                          : 'orange'
                      }
                    >
                      {selectedInvoice.three_way_matches.match_status.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tolerance %">
                    {selectedInvoice.three_way_matches.tolerance_pct}%
                  </Descriptions.Item>
                  <Descriptions.Item label="Quantity Match">
                    {selectedInvoice.three_way_matches.quantity_match ? '✓ Yes' : '✗ No'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Price Match">
                    {selectedInvoice.three_way_matches.price_match ? '✓ Yes' : '✗ No'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Match">
                    {selectedInvoice.three_way_matches.total_match ? '✓ Yes' : '✗ No'}
                  </Descriptions.Item>
                  <Descriptions.Item label=" ">&nbsp;</Descriptions.Item>
                  <Descriptions.Item label="PO Total">
                    ${Number(selectedInvoice.three_way_matches.po_total).toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="GRN Total">
                    ${Number(selectedInvoice.three_way_matches.grn_total).toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Invoice Total">
                    ${Number(selectedInvoice.three_way_matches.invoice_total).toFixed(2)}
                  </Descriptions.Item>
                  {selectedInvoice.three_way_matches.discrepancy_notes && (
                    <Descriptions.Item label="Discrepancies" span={2}>
                      <Text type="danger">{selectedInvoice.three_way_matches.discrepancy_notes}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}

            {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
              <>
                <Divider>Payments</Divider>
                <Table
                  dataSource={selectedInvoice.payments}
                  columns={[
                    { title: 'Date', dataIndex: 'payment_date', key: 'payment_date', render: (date: string) => dayjs(date).format('YYYY-MM-DD') },
                    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (val: number) => `$${Number(val).toFixed(2)}` },
                    { title: 'Method', dataIndex: 'payment_method', key: 'payment_method' },
                    { title: 'Reference', dataIndex: 'reference_number', key: 'reference_number' },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey="id"
                />
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        title={`Record Payment - ${selectedInvoice?.invoice_number || ''}`}
        open={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        footer={null}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handlePaymentSubmit}>
          <Form.Item
            name="payment_date"
            label="Payment Date"
            rules={[{ required: true, message: 'Please select payment date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Payment Amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
              prefix="$"
            />
          </Form.Item>

          <Form.Item
            name="payment_method"
            label="Payment Method"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Select placeholder="Select payment method">
              <Option value="bank_transfer">Bank Transfer</Option>
              <Option value="check">Check</Option>
              <Option value="cash">Cash</Option>
              <Option value="credit_card">Credit Card</Option>
              <Option value="wire_transfer">Wire Transfer</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item name="reference_number" label="Reference Number (Optional)">
            <Input placeholder="Check number, transaction ID, etc." />
          </Form.Item>

          <Form.Item name="notes" label="Notes (Optional)">
            <TextArea rows={3} placeholder="Payment notes..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsPaymentModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Record Payment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierInvoicesPage;
