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
  Popconfirm,
  Tag,
  App,
  Collapse,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AccountBookOutlined,
  FolderOpenOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import accountService, { Account, CreateAccountDto } from '../services/account.service';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

const ChartOfAccountsPage: React.FC = () => {
  const { message } = App.useApp();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAccounts();
  }, [typeFilter]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.findAll({
        account_type: typeFilter,
        is_active: true,
      });
      setAccounts(data);
    } catch (error: any) {
      message.error('Failed to fetch accounts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAccount(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    form.setFieldsValue({
      name: account.name,
      account_type: account.account_type,
      parent_account_id: account.parent_account_id,
      currency_code: account.currency_code,
      description: account.description,
      is_active: account.is_active,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await accountService.delete(id);
      message.success('Account deleted successfully');
      fetchAccounts();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingAccount) {
        await accountService.update(editingAccount.id, values);
        message.success('Account updated successfully');
      } else {
        await accountService.create(values as CreateAccountDto);
        message.success('Account created successfully');
      }
      setIsModalVisible(false);
      fetchAccounts();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save account');
    }
  };

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      asset: 'blue',
      liability: 'red',
      equity: 'purple',
      revenue: 'green',
      expense: 'orange',
    };
    return colors[type] || 'default';
  };

  const getAccountTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      asset: <DollarOutlined />,
      liability: <DollarOutlined />,
      equity: <DollarOutlined />,
      revenue: <DollarOutlined />,
      expense: <DollarOutlined />,
    };
    return icons[type] || <AccountBookOutlined />;
  };

  const groupAccountsByType = () => {
    const grouped: Record<string, Account[]> = {
      asset: [],
      liability: [],
      equity: [],
      revenue: [],
      expense: [],
    };

    accounts.forEach((account) => {
      if (grouped[account.account_type]) {
        grouped[account.account_type].push(account);
      }
    });

    return grouped;
  };

  const renderAccountTree = (accountsList: Account[], parentId?: string, level: number = 0) => {
    const children = accountsList.filter(
      (acc) => acc.parent_account_id === (parentId || null)
    );

    return children.map((account) => {
      const hasChildren = accountsList.some((acc) => acc.parent_account_id === account.id);
      
      return (
        <div key={account.id} style={{ marginLeft: level * 20 }}>
          <Card
            size="small"
            style={{ marginBottom: 8 }}
            bodyStyle={{ padding: '8px 12px' }}
          >
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                {hasChildren && <FolderOpenOutlined />}
                <Text strong>{account.account_number}</Text>
                <Text>{account.name}</Text>
                {account.description && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ({account.description})
                  </Text>
                )}
              </Space>
              <Space>
                <Text strong>
                  {account.currency_code} {account.current_balance.toFixed(2)}
                </Text>
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  type="link"
                  onClick={() => handleEdit(account)}
                />
                {!hasChildren && (
                  <Popconfirm
                    title="Delete Account"
                    description="Are you sure you want to delete this account?"
                    onConfirm={() => handleDelete(account.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button icon={<DeleteOutlined />} size="small" type="link" danger />
                  </Popconfirm>
                )}
              </Space>
            </Space>
          </Card>
          {hasChildren && renderAccountTree(accountsList, account.id, level + 1)}
        </div>
      );
    });
  };

  const columns = [
    {
      title: 'Account #',
      dataIndex: 'account_number',
      key: 'account_number',
      width: 120,
    },
    {
      title: 'Account Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
    },
    {
      title: 'Type',
      dataIndex: 'account_type',
      key: 'account_type',
      width: 120,
      render: (type: string) => (
        <Tag color={getAccountTypeColor(type)} icon={getAccountTypeIcon(type)}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Parent Account',
      dataIndex: ['parent_account', 'name'],
      key: 'parent_account',
      width: 200,
      render: (text: string) => text || '—',
    },
    {
      title: 'Currency',
      dataIndex: 'currency_code',
      key: 'currency_code',
      width: 100,
    },
    {
      title: 'Balance',
      dataIndex: 'current_balance',
      key: 'current_balance',
      width: 150,
      align: 'right' as const,
      render: (balance: number, record: Account) => (
        <Text strong>
          {record.currency_code} {balance.toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Account) => {
        const hasChildren = accounts.some((acc) => acc.parent_account_id === record.id);
        return (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" type="link" />
            {!hasChildren && (
              <Popconfirm
                title="Delete Account"
                description="Are you sure you want to delete this account?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button icon={<DeleteOutlined />} danger size="small" type="link" />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const groupedAccounts = groupAccountsByType();

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <AccountBookOutlined /> Chart of Accounts
      </Title>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Select
            placeholder="Filter by type"
            style={{ width: 200 }}
            allowClear
            onChange={setTypeFilter}
            value={typeFilter}
          >
            <Option value="asset">Assets</Option>
            <Option value="liability">Liabilities</Option>
            <Option value="equity">Equity</Option>
            <Option value="revenue">Revenue</Option>
            <Option value="expense">Expenses</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Account
          </Button>
        </Space>

        {!typeFilter ? (
          <Collapse defaultActiveKey={['asset', 'liability', 'equity', 'revenue', 'expense']}>
            {Object.entries(groupedAccounts).map(([type, accts]) => (
              <Panel
                header={
                  <Space>
                    <Tag color={getAccountTypeColor(type)} icon={getAccountTypeIcon(type)}>
                      {type.toUpperCase()}
                    </Tag>
                    <Text strong>({accts.length} accounts)</Text>
                  </Space>
                }
                key={type}
              >
                {renderAccountTree(accts)}
              </Panel>
            ))}
          </Collapse>
        ) : (
          <Table
            columns={columns}
            dataSource={accounts}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} accounts`,
            }}
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingAccount ? 'Edit Account' : 'Create New Account'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        okText={editingAccount ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingAccount && (
            <Form.Item
              label="Account Number"
              name="account_number"
              help="Leave blank for auto-generation"
            >
              <Input placeholder="e.g., 1000" />
            </Form.Item>
          )}

          <Form.Item
            label="Account Name"
            name="name"
            rules={[{ required: true, message: 'Please enter account name' }]}
          >
            <Input placeholder="e.g., Cash in Bank" />
          </Form.Item>

          <Form.Item
            label="Account Type"
            name="account_type"
            rules={[{ required: true, message: 'Please select account type' }]}
          >
            <Select placeholder="Select type">
              <Option value="asset">Asset</Option>
              <Option value="liability">Liability</Option>
              <Option value="equity">Equity</Option>
              <Option value="revenue">Revenue</Option>
              <Option value="expense">Expense</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Parent Account" name="parent_account_id">
            <Select placeholder="Select parent account (optional)" allowClear>
              {accounts
                .filter((acc) => acc.id !== editingAccount?.id)
                .map((acc) => (
                  <Option key={acc.id} value={acc.id}>
                    {acc.account_number} - {acc.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Currency"
            name="currency_code"
            rules={[{ required: true, message: 'Please select currency' }]}
            initialValue="USD"
          >
            <Select>
              <Option value="USD">USD - US Dollar</Option>
              <Option value="EUR">EUR - Euro</Option>
              <Option value="GBP">GBP - British Pound</Option>
              <Option value="INR">INR - Indian Rupee</Option>
              <Option value="JPY">JPY - Japanese Yen</Option>
              <Option value="CAD">CAD - Canadian Dollar</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Account description" />
          </Form.Item>

          <Form.Item label="Status" name="is_active" initialValue={true}>
            <Select>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChartOfAccountsPage;
