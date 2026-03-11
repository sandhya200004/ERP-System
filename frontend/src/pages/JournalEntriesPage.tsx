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
  DatePicker,
  InputNumber,
  Divider,
  Row,
  Col,
  Popconfirm,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import journalService, { JournalEntry, JournalLine } from '../services/journal.service';
import accountService, { Account } from '../services/account.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const JournalEntriesPage: React.FC = () => {
  const { message } = App.useApp();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();
  const [journalLines, setJournalLines] = useState<JournalLine[]>([
    { account_id: '', debit_amount: 0, credit_amount: 0 },
    { account_id: '', debit_amount: 0, credit_amount: 0 },
  ]);

  useEffect(() => {
    fetchJournalEntries();
    fetchAccounts();
  }, [statusFilter]);

  const fetchJournalEntries = async () => {
    try {
      setLoading(true);
      const data = await journalService.findAll({
        status: statusFilter,
      });
      setJournalEntries(data);
    } catch (error: any) {
      message.error('Failed to fetch journal entries');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await accountService.findAll({ is_active: true });
      setAccounts(data);
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setJournalLines([
      { account_id: '', debit_amount: 0, credit_amount: 0 },
      { account_id: '', debit_amount: 0, credit_amount: 0 },
    ]);
    setIsModalVisible(true);
  };

  const handleView = async (entry: JournalEntry) => {
    try {
      const fullEntry = await journalService.findOne(entry.id);
      setSelectedEntry(fullEntry);
      setIsViewModalVisible(true);
    } catch (error: any) {
      message.error('Failed to load journal entry details');
    }
  };

  const handlePost = async (id: string) => {
    try {
      await journalService.post(id);
      message.success('Journal entry posted successfully');
      fetchJournalEntries();
      if (selectedEntry?.id === id) {
        setIsViewModalVisible(false);
      }
    } catch (error: any) {
      message.error('Failed to post journal entry');
    }
  };

  const handleVoid = async (id: string) => {
    try {
      await journalService.void(id);
      message.success('Journal entry voided successfully');
      fetchJournalEntries();
      if (selectedEntry?.id === id) {
        setIsViewModalVisible(false);
      }
    } catch (error: any) {
      message.error('Failed to void journal entry');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Validate balanced entry
      const totalDebit = journalLines.reduce((sum, line) => sum + line.debit_amount, 0);
      const totalCredit = journalLines.reduce((sum, line) => sum + line.credit_amount, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        message.error('Journal entry is not balanced! Debits must equal credits.');
        return;
      }

      // Filter out empty lines
      const validLines = journalLines.filter(
        (line) => line.account_id && (line.debit_amount > 0 || line.credit_amount > 0)
      );

      if (validLines.length < 2) {
        message.error('Journal entry must have at least 2 lines');
        return;
      }

      const entryData = {
        entry_date: values.entry_date.format('YYYY-MM-DD'),
        reference_type: values.reference_type,
        reference_id: values.reference_id,
        description: values.description,
        lines: validLines,
      };

      await journalService.create(entryData);
      message.success('Journal entry created successfully');
      setIsModalVisible(false);
      fetchJournalEntries();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create journal entry');
    }
  };

  const addJournalLine = () => {
    setJournalLines([...journalLines, { account_id: '', debit_amount: 0, credit_amount: 0 }]);
  };

  const removeJournalLine = (index: number) => {
    if (journalLines.length > 2) {
      const newLines = journalLines.filter((_, i) => i !== index);
      setJournalLines(newLines);
    }
  };

  const updateJournalLine = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...journalLines];
    newLines[index] = { ...newLines[index], [field]: value };

    // If debit is entered, clear credit and vice versa
    if (field === 'debit_amount' && value > 0) {
      newLines[index].credit_amount = 0;
    } else if (field === 'credit_amount' && value > 0) {
      newLines[index].debit_amount = 0;
    }

    setJournalLines(newLines);
  };

  const calculateTotals = () => {
    const totalDebit = journalLines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
    const totalCredit = journalLines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
    const difference = totalDebit - totalCredit;
    return { totalDebit, totalCredit, difference };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      posted: 'success',
      voided: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'posted') return <CheckCircleOutlined />;
    if (status === 'voided') return <CloseCircleOutlined />;
    return <EditOutlined />;
  };

  const columns = [
    {
      title: 'Entry #',
      dataIndex: 'entry_number',
      key: 'entry_number',
      width: 120,
    },
    {
      title: 'Date',
      dataIndex: 'entry_date',
      key: 'entry_date',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Debit',
      dataIndex: 'total_debit',
      key: 'total_debit',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => <Text strong>${amount.toFixed(2)}</Text>,
    },
    {
      title: 'Credit',
      dataIndex: 'total_credit',
      key: 'total_credit',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => <Text strong>${amount.toFixed(2)}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: JournalEntry) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" type="link" onClick={() => handleView(record)}>
            View
          </Button>
          {record.status === 'draft' && (
            <Button
              icon={<CheckCircleOutlined />}
              size="small"
              type="primary"
              onClick={() => handlePost(record.id)}
            >
              Post
            </Button>
          )}
          {record.status === 'posted' && (
            <Popconfirm
              title="Void Entry"
              description="Are you sure you want to void this entry?"
              onConfirm={() => handleVoid(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<CloseCircleOutlined />} size="small" danger>
                Void
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const { totalDebit, totalCredit, difference } = calculateTotals();

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <BookOutlined /> Journal Entries
      </Title>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            allowClear
            onChange={setStatusFilter}
            value={statusFilter}
          >
            <Option value="draft">Draft</Option>
            <Option value="posted">Posted</Option>
            <Option value="voided">Voided</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create Journal Entry
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={journalEntries}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} entries`,
          }}
        />
      </Card>

      {/* Create Journal Entry Modal */}
      <Modal
        title="Create Journal Entry"
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
                label="Entry Date"
                name="entry_date"
                rules={[{ required: true, message: 'Please select entry date' }]}
                initialValue={dayjs()}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Reference Type" name="reference_type">
                <Input placeholder="e.g., Invoice, Payment, Adjustment" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Description" name="description">
            <TextArea rows={2} placeholder="Journal entry description" />
          </Form.Item>

          <Divider>Journal Lines</Divider>

          {journalLines.map((line, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={8}>
                <Col span={10}>
                  <Form.Item label="Account" style={{ marginBottom: 0 }}>
                    <Select
                      placeholder="Select account"
                      value={line.account_id || undefined}
                      onChange={(value) => updateJournalLine(index, 'account_id', value)}
                      showSearch
                      optionFilterProp="children"
                    >
                      {accounts.map((acc) => (
                        <Option key={acc.id} value={acc.id}>
                          {acc.account_number} - {acc.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item label="Debit" style={{ marginBottom: 0 }}>
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      value={line.debit_amount}
                      onChange={(value) => updateJournalLine(index, 'debit_amount', value || 0)}
                      prefix="$"
                    />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item label="Credit" style={{ marginBottom: 0 }}>
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      value={line.credit_amount}
                      onChange={(value) => updateJournalLine(index, 'credit_amount', value || 0)}
                      prefix="$"
                    />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label=" " style={{ marginBottom: 0 }}>
                    {journalLines.length > 2 && (
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => removeJournalLine(index)}
                      />
                    )}
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}

          <Button type="dashed" onClick={addJournalLine} block icon={<PlusOutlined />}>
            Add Line
          </Button>

          <Divider />

          <Row justify="space-between">
            <Col>
              <Space direction="vertical">
                <Text>Total Debit: ${totalDebit.toFixed(2)}</Text>
                <Text>Total Credit: ${totalCredit.toFixed(2)}</Text>
                <Text
                  strong
                  type={Math.abs(difference) < 0.01 ? 'success' : 'danger'}
                >
                  Difference: ${difference.toFixed(2)}
                </Text>
              </Space>
            </Col>
            <Col>
              {Math.abs(difference) < 0.01 ? (
                <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 14 }}>
                  BALANCED
                </Tag>
              ) : (
                <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: 14 }}>
                  NOT BALANCED
                </Tag>
              )}
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* View Journal Entry Modal */}
      <Modal
        title={`Journal Entry ${selectedEntry?.entry_number}`}
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>,
          selectedEntry?.status === 'draft' && (
            <Button
              key="post"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => selectedEntry && handlePost(selectedEntry.id)}
            >
              Post Entry
            </Button>
          ),
          selectedEntry?.status === 'posted' && (
            <Popconfirm
              title="Void Entry"
              description="Are you sure you want to void this entry?"
              onConfirm={() => selectedEntry && handleVoid(selectedEntry.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button key="void" danger icon={<CloseCircleOutlined />}>
                Void Entry
              </Button>
            </Popconfirm>
          ),
        ]}
      >
        {selectedEntry && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Entry Number">{selectedEntry.entry_number}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedEntry.status)} icon={getStatusIcon(selectedEntry.status)}>
                  {selectedEntry.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Entry Date">
                {dayjs(selectedEntry.entry_date).format('MMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Reference Type">
                {selectedEntry.reference_type || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedEntry.description || '—'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Journal Lines</Divider>

            <Table
              dataSource={selectedEntry.lines}
              columns={[
                {
                  title: 'Account',
                  key: 'account',
                  render: (_: any, record: JournalLine) => (
                    <span>
                      {record.account?.account_number} - {record.account?.name || record.account_id}
                    </span>
                  ),
                },
                {
                  title: 'Debit',
                  dataIndex: 'debit_amount',
                  key: 'debit_amount',
                  align: 'right',
                  render: (amount: number) => (amount > 0 ? `$${amount.toFixed(2)}` : '—'),
                },
                {
                  title: 'Credit',
                  dataIndex: 'credit_amount',
                  key: 'credit_amount',
                  align: 'right',
                  render: (amount: number) => (amount > 0 ? `$${amount.toFixed(2)}` : '—'),
                },
              ]}
              pagination={false}
              size="small"
            />

            <Row justify="end" style={{ marginTop: 16 }}>
              <Col>
                <Space direction="vertical" align="end">
                  <Text>Total Debit: ${selectedEntry.total_debit.toFixed(2)}</Text>
                  <Text>Total Credit: ${selectedEntry.total_credit.toFixed(2)}</Text>
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JournalEntriesPage;
