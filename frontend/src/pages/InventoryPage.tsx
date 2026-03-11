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
  InputNumber,
  Tabs,
} from 'antd';
import {
  InboxOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  ToolOutlined,
  WarningOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import inventoryService, {
  StockLevel,
  StockMovement,
  InventoryStatistics,
} from '../services/inventory.service';
import warehouseService, { Warehouse } from '../services/warehouse.service';
import { itemService } from '../services/item.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

type OperationType = 'stock-in' | 'stock-out' | 'transfer' | 'adjustment';

const InventoryPage: React.FC = () => {
  const { message } = App.useApp();
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [operationType, setOperationType] = useState<OperationType>('stock-in');
  const [warehouseFilter, setWarehouseFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    fetchWarehouses();
    fetchItems();
  }, [warehouseFilter]);

  const fetchData = async () => {
    await Promise.all([
      fetchStockLevels(),
      fetchStockMovements(),
      fetchStatistics(),
    ]);
  };

  const fetchStockLevels = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getStockLevels({
        warehouse_id: warehouseFilter,
      });
      setStockLevels(data);
    } catch (error: any) {
      message.error('Failed to fetch stock levels');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async () => {
    try {
      setMovementsLoading(true);
      const data = await inventoryService.getStockMovements({
        warehouse_id: warehouseFilter,
      });
      setStockMovements(data);
    } catch (error: any) {
      console.error('Failed to fetch movements:', error);
    } finally {
      setMovementsLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const data = await warehouseService.findAll({ is_active: true });
      setWarehouses(data);
    } catch (error: any) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemService.getAll({});
      setItems(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch items:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await inventoryService.getStatistics();
      setStatistics(stats);
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleOpenModal = (type: OperationType) => {
    setOperationType(type);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (operationType === 'stock-in') {
        await inventoryService.stockIn({
          movement_type: 'IN',
          warehouse_id: values.warehouse_id,
          item_id: values.item_id,
          quantity: values.quantity,
          unit_cost: values.unit_cost,
          notes: values.notes,
        });
        message.success('Stock added successfully');
      } else if (operationType === 'stock-out') {
        await inventoryService.stockOut({
          movement_type: 'OUT',
          warehouse_id: values.warehouse_id,
          item_id: values.item_id,
          quantity: values.quantity,
          notes: values.notes,
        });
        message.success('Stock removed successfully');
      } else if (operationType === 'transfer') {
        await inventoryService.transfer({
          from_warehouse_id: values.from_warehouse_id,
          to_warehouse_id: values.to_warehouse_id,
          item_id: values.item_id,
          quantity: values.quantity,
          notes: values.notes,
        });
        message.success('Stock transferred successfully');
      } else if (operationType === 'adjustment') {
        await inventoryService.adjustment({
          warehouse_id: values.warehouse_id,
          item_id: values.item_id,
          new_quantity: values.new_quantity,
          reason: values.reason,
        });
        message.success('Stock adjusted successfully');
      }

      setIsModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const getMovementIcon = (type: string) => {
    const icons: Record<string, any> = {
      IN: <ArrowDownOutlined style={{ color: '#52c41a' }} />,
      OUT: <ArrowUpOutlined style={{ color: '#f5222d' }} />,
      TRANSFER: <SwapOutlined style={{ color: '#1890ff' }} />,
      ADJUSTMENT: <ToolOutlined style={{ color: '#faad14' }} />,
    };
    return icons[type] || null;
  };

  const getMovementColor = (type: string) => {
    const colors: Record<string, string> = {
      IN: 'success',
      OUT: 'error',
      TRANSFER: 'processing',
      ADJUSTMENT: 'warning',
    };
    return colors[type] || 'default';
  };

  const stockLevelColumns = [
    {
      title: 'Item',
      dataIndex: ['item', 'name'],
      key: 'item',
      width: 200,
      render: (text: string, record: StockLevel) => text || record.item_id,
    },
    {
      title: 'SKU',
      dataIndex: ['item', 'sku'],
      key: 'sku',
      width: 120,
    },
    {
      title: 'Warehouse',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouse',
      width: 150,
      render: (text: string, record: StockLevel) => text || record.warehouse_id,
    },
    {
      title: 'On Hand',
      dataIndex: 'quantity_on_hand',
      key: 'quantity_on_hand',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => <Text strong>{qty}</Text>,
    },
    {
      title: 'Reserved',
      dataIndex: 'reserved_quantity',
      key: 'reserved_quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: 'Available',
      dataIndex: 'available_quantity',
      key: 'available_quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => {
        let color = 'success';
        if (qty <= 0) color = 'error';
        else if (qty < 10) color = 'warning';
        return <Tag color={color}>{qty}</Tag>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: any, record: StockLevel) => {
        if (record.available_quantity <= 0) {
          return <Tag icon={<WarningOutlined />} color="error">Out of Stock</Tag>;
        } else if (record.available_quantity < 10) {
          return <Tag icon={<WarningOutlined />} color="warning">Low Stock</Tag>;
        }
        return <Tag color="success">In Stock</Tag>;
      },
    },
  ];

  const movementColumns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
    {
      title: 'Type',
      dataIndex: 'movement_type',
      key: 'movement_type',
      width: 120,
      render: (type: string) => (
        <Tag icon={getMovementIcon(type)} color={getMovementColor(type)}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Item',
      dataIndex: ['item', 'name'],
      key: 'item',
      width: 200,
      render: (text: string, record: StockMovement) => text || record.item_id,
    },
    {
      title: 'Warehouse',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouse',
      width: 150,
      render: (text: string, record: StockMovement) => text || record.warehouse_id,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number, record: StockMovement) => {
        const prefix = record.movement_type === 'OUT' ? '-' : '+';
        const color = record.movement_type === 'OUT' ? '#f5222d' : '#52c41a';
        return <Text style={{ color }}>{prefix}{qty}</Text>;
      },
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unit_cost',
      key: 'unit_cost',
      width: 100,
      align: 'right' as const,
      render: (cost: number) => cost ? `$${cost.toFixed(2)}` : '—',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
  ];

  const getModalTitle = () => {
    const titles: Record<OperationType, string> = {
      'stock-in': 'Stock In',
      'stock-out': 'Stock Out',
      'transfer': 'Transfer Stock',
      'adjustment': 'Stock Adjustment',
    };
    return titles[operationType];
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <InboxOutlined /> Inventory Management
      </Title>

      {/* Statistics */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="Total Items" value={statistics.total_items} prefix={<InboxOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Stock Value"
                value={statistics.total_stock_value}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Low Stock Items"
                value={statistics.low_stock_items}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Out of Stock"
                value={statistics.out_of_stock_items}
                valueStyle={{ color: '#f5222d' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Quick Actions */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Button
            type="primary"
            icon={<ArrowDownOutlined />}
            onClick={() => handleOpenModal('stock-in')}
          >
            Stock In
          </Button>
          <Button
            danger
            icon={<ArrowUpOutlined />}
            onClick={() => handleOpenModal('stock-out')}
          >
            Stock Out
          </Button>
          <Button
            type="default"
            icon={<SwapOutlined />}
            onClick={() => handleOpenModal('transfer')}
          >
            Transfer
          </Button>
          <Button
            type="default"
            icon={<ToolOutlined />}
            onClick={() => handleOpenModal('adjustment')}
          >
            Adjustment
          </Button>
        </Space>
      </Card>

      {/* Main Content */}
      <Card>
        <Tabs defaultActiveKey="stock-levels">
          <TabPane tab="Stock Levels" key="stock-levels">
            <Space style={{ marginBottom: 16 }}>
              <Select
                placeholder="Filter by warehouse"
                style={{ width: 200 }}
                allowClear
                onChange={setWarehouseFilter}
                value={warehouseFilter}
              >
                {warehouses.map((wh) => (
                  <Option key={wh.id} value={wh.id}>
                    {wh.name}
                  </Option>
                ))}
              </Select>
            </Space>

            <Table
              columns={stockLevelColumns}
              dataSource={stockLevels}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1000 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} items`,
              }}
            />
          </TabPane>

          <TabPane tab="Stock Movements" key="movements">
            <Table
              columns={movementColumns}
              dataSource={stockMovements}
              rowKey="id"
              loading={movementsLoading}
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} movements`,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Operations Modal */}
      <Modal
        title={getModalTitle()}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {operationType === 'transfer' ? (
            <>
              <Form.Item
                label="From Warehouse"
                name="from_warehouse_id"
                rules={[{ required: true, message: 'Please select source warehouse' }]}
              >
                <Select placeholder="Select warehouse" showSearch optionFilterProp="children">
                  {warehouses.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="To Warehouse"
                name="to_warehouse_id"
                rules={[{ required: true, message: 'Please select destination warehouse' }]}
              >
                <Select placeholder="Select warehouse" showSearch optionFilterProp="children">
                  {warehouses.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          ) : (
            <Form.Item
              label="Warehouse"
              name="warehouse_id"
              rules={[{ required: true, message: 'Please select warehouse' }]}
            >
              <Select placeholder="Select warehouse" showSearch optionFilterProp="children">
                {warehouses.map((wh) => (
                  <Option key={wh.id} value={wh.id}>
                    {wh.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            label="Item"
            name="item_id"
            rules={[{ required: true, message: 'Please select item' }]}
          >
            <Select placeholder="Select item" showSearch optionFilterProp="children">
              {items.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.name} {item.sku ? `(${item.sku})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {operationType === 'adjustment' ? (
            <>
              <Form.Item
                label="New Quantity"
                name="new_quantity"
                rules={[{ required: true, message: 'Please enter new quantity' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="Reason"
                name="reason"
                rules={[{ required: true, message: 'Please provide reason' }]}
              >
                <TextArea rows={3} placeholder="Explain why you're adjusting the stock..." />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[
                  { required: true, message: 'Please enter quantity' },
                  { type: 'number', min: 1, message: 'Quantity must be at least 1' },
                ]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>

              {operationType === 'stock-in' && (
                <Form.Item label="Unit Cost" name="unit_cost">
                  <InputNumber min={0} step={0.01} prefix="$" style={{ width: '100%' }} />
                </Form.Item>
              )}

              <Form.Item label="Notes" name="notes">
                <TextArea rows={2} placeholder="Optional notes..." />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
