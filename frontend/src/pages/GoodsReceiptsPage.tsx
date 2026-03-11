import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Typography,
  Popconfirm,
  Descriptions,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import goodsReceiptService, { GoodsReceipt, GRNLine } from '../services/goods-receipt.service';
import purchaseOrderService, { PurchaseOrder } from '../services/purchase-order.service';
import vendorService from '../services/vendor.service';
import { itemService } from '../services/item.service';
import warehouseService from '../services/warehouse.service';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title } = Typography;

const GoodsReceiptsPage: React.FC = () => {
  const [grns, setGRNs] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentGRN, setCurrentGRN] = useState<GoodsReceipt | null>(null);
  const [statistics, setStatistics] = useState<any>({});
  const [vendors, setVendors] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchGRNs();
    fetchStatistics();
    fetchVendors();
    fetchPurchaseOrders();
    fetchItems();
    fetchWarehouses();
  }, []);

  const fetchGRNs = async () => {
    setLoading(true);
    try {
      const data = await goodsReceiptService.findAll();
      setGRNs(data);
    } catch (error) {
      message.error('Failed to fetch goods receipts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await goodsReceiptService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to fetch statistics', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await vendorService.findAll();
      setVendors(data);
    } catch (error) {
      console.error('Failed to fetch vendors', error);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const data = await purchaseOrderService.findAll({ status: 'approved' });
      setPurchaseOrders(data);
    } catch (error) {
      console.error('Failed to fetch purchase orders', error);
    }
  };

  const fetchItems = async () => {
    try {
      const data = await itemService.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const data = await warehouseService.findAll();
      setWarehouses(data);
    } catch (error) {
      console.error('Failed to fetch warehouses', error);
    }
  };

  const handlePOSelect = async (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (po) {
      setSelectedPO(po);
      form.setFieldsValue({
        vendor_id: po.vendor_id,
        lines: po.lines.map((line: any) => ({
          item_id: line.item_id,
          description: line.description,
          ordered_qty: Number(line.quantity) - Number(line.received_qty),
          received_qty: Number(line.quantity) - Number(line.received_qty),
        })),
      });
    }
  };

  const handleCreate = () => {
    setEditMode(false);
    setCurrentGRN(null);
    setSelectedPO(null);
    form.resetFields();
    form.setFieldsValue({
      receipt_date: dayjs(),
      lines: [{ description: '', received_qty: 0 }],
    });
    setModalVisible(true);
  };

  const handleEdit = (record: GoodsReceipt) => {
    if (record.status !== 'draft') {
      message.warning('Only draft GRNs can be edited');
      return;
    }
    setEditMode(true);
    setCurrentGRN(record);
    form.setFieldsValue({
      po_id: record.po_id,
      vendor_id: record.vendor_id,
      receipt_date: dayjs(record.receipt_date),
      notes: record.notes,
      lines: record.grn_lines.map((line: any) => ({
        item_id: line.item_id,
        description: line.description,
        ordered_qty: line.ordered_qty,
        received_qty: line.received_qty,
        warehouse_id: line.warehouse_id,
        location: line.location,
        notes: line.notes,
      })),
    });
    setModalVisible(true);
  };

  const handleView = (record: GoodsReceipt) => {
    setCurrentGRN(record);
    setViewModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        receipt_date: values.receipt_date.format('YYYY-MM-DD'),
      };

      if (editMode && currentGRN) {
        await goodsReceiptService.update(currentGRN.id, data);
        message.success('GRN updated successfully');
      } else {
        await goodsReceiptService.create(data);
        message.success('GRN created successfully');
      }

      setModalVisible(false);
      fetchGRNs();
      fetchStatistics();
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await goodsReceiptService.confirm(id);
      message.success('GRN confirmed and stock updated');
      fetchGRNs();
      fetchStatistics();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to confirm GRN');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await goodsReceiptService.cancel(id);
      message.success('GRN cancelled');
      fetchGRNs();
      fetchStatistics();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to cancel GRN');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'GRN Number',
      dataIndex: 'grn_number',
      key: 'grn_number',
      fixed: 'left' as const,
    },
    {
      title: 'PO Number',
      dataIndex: ['purchase_orders', 'po_number'],
      key: 'po_number',
      render: (text: string) => text || 'N/A',
    },
    {
      title: 'Vendor',
      dataIndex: ['vendors', 'name'],
      key: 'vendor',
    },
    {
      title: 'Receipt Date',
      dataIndex: 'receipt_date',
      key: 'receipt_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Lines',
      dataIndex: 'grn_lines',
      key: 'lines',
      render: (lines: GRNLine[]) => lines.length,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      render: (_: any, record: GoodsReceipt) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
          {record.status === 'draft' && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                Edit
              </Button>
              <Popconfirm
                title="Confirm this GRN and update stock?"
                onConfirm={() => handleConfirm(record.id)}
                okText="Confirm"
                cancelText="Cancel"
              >
                <Button type="link" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>
                  Confirm
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Cancel this GRN?"
                onConfirm={() => handleCancel(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" danger icon={<CloseCircleOutlined />}>
                  Cancel
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
        <InboxOutlined /> Goods Receipt Notes (GRN)
      </Title>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total GRNs" value={statistics.total || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Draft"
              value={statistics.draft || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={statistics.completed || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="This Month"
              value={statistics.thisMonth || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card
        title="Goods Receipts"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            New GRN
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={grns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editMode ? 'Edit Goods Receipt' : 'New Goods Receipt'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={1000}
        okText={editMode ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="po_id" label="Purchase Order (Optional)">
                <Select
                  placeholder="Select PO"
                  showSearch
                  allowClear
                  filterOption={(input, option: any) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={handlePOSelect}
                >
                  {purchaseOrders.map((po) => (
                    <Select.Option key={po.id} value={po.id}>
                      {po.po_number} - {po.vendor?.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vendor_id"
                label="Vendor"
                rules={[{ required: true, message: 'Please select vendor' }]}
              >
                <Select placeholder="Select Vendor" showSearch disabled={!!selectedPO}>
                  {vendors.map((vendor) => (
                    <Select.Option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="receipt_date"
                label="Receipt Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={2} placeholder="Additional notes" />
          </Form.Item>

          <Divider>Receipt Lines</Divider>

          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    style={{ marginBottom: 8 }}
                    title={`Line ${index + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        >
                          Remove
                        </Button>
                      ) : null
                    }
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'item_id']}
                          label="Item"
                        >
                          <Select placeholder="Select Item" showSearch allowClear>
                            {items.map((item) => (
                              <Select.Option key={item.id} value={item.id}>
                                {item.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={16}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'description']}
                          label="Description"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Input placeholder="Description" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'ordered_qty']}
                          label="Ordered Qty"
                        >
                          <InputNumber style={{ width: '100%' }} min={0} disabled />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'received_qty']}
                          label="Received Qty"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <InputNumber style={{ width: '100%' }} min={0.01} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'warehouse_id']}
                          label="Warehouse"
                        >
                          <Select placeholder="Warehouse" showSearch>
                            {warehouses.map((wh) => (
                              <Select.Option key={wh.id} value={wh.id}>
                                {wh.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item {...field} name={[field.name, 'location']} label="Location">
                          <Input placeholder="Location" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item {...field} name={[field.name, 'notes']} label="Line Notes">
                      <Input placeholder="Notes" />
                    </Form.Item>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Line
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Goods Receipt Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={900}
      >
        {currentGRN && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="GRN Number">{currentGRN.grn_number}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(currentGRN.status)}>
                  {currentGRN.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="PO Number">
                {currentGRN.purchase_orders?.po_number || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Vendor">
                {currentGRN.vendors?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Receipt Date">
                {dayjs(currentGRN.receipt_date).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Received By">
                {currentGRN.users?.full_name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>
                {currentGRN.notes || 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Receipt Lines</Divider>

            <Table
              dataSource={currentGRN.grn_lines}
              rowKey="id"
              pagination={false}
              columns={[
                { title: 'Item', dataIndex: ['items', 'name'], render: (text) => text || 'N/A' },
                { title: 'Description', dataIndex: 'description' },
                { title: 'Ordered', dataIndex: 'ordered_qty', render: (val) => val || 'N/A' },
                { title: 'Received', dataIndex: 'received_qty' },
                {
                  title: 'Warehouse',
                  dataIndex: ['warehouses', 'name'],
                  render: (text) => text || 'N/A',
                },
                { title: 'Location', dataIndex: 'location', render: (text) => text || 'N/A' },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default GoodsReceiptsPage;
