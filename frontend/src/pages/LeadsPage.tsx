import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Card, Typography, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  source: string;
}

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // Mock data for demo
    setLeads([
      { id: '1', name: 'John Smith', email: 'john@example.com', phone: '555-0101', company: 'Acme Corp', status: 'new', source: 'website' },
      { id: '2', name: 'Jane Doe', email: 'jane@example.com', phone: '555-0102', company: 'Tech Inc', status: 'contacted', source: 'referral' },
    ]);
  }, []);

  const handleAdd = () => {
    setEditingLead(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Lead) => {
    setEditingLead(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setLeads(leads.filter(l => l.id !== id));
    message.success('Lead deleted successfully');
  };

  const handleSubmit = (values: any) => {
    if (editingLead) {
      setLeads(leads.map(l => l.id === editingLead.id ? { ...l, ...values } : l));
      message.success('Lead updated successfully');
    } else {
      setLeads([...leads, { ...values, id: Date.now().toString() }]);
      message.success('Lead created successfully');
    }
    setModalVisible(false);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Company', dataIndex: 'company', key: 'company' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: { [key: string]: string } = {
          new: 'blue',
          contacted: 'cyan',
          qualified: 'green',
          lost: 'red',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    { title: 'Source', dataIndex: 'source', key: 'source' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Lead) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small">View</Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Title level={2} style={{ margin: 0 }}>Leads</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Lead</Button>
        </div>
        <Table columns={columns} dataSource={leads} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={editingLead ? 'Edit Lead' : 'Add Lead'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="company" label="Company">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="new">New</Select.Option>
              <Select.Option value="contacted">Contacted</Select.Option>
              <Select.Option value="qualified">Qualified</Select.Option>
              <Select.Option value="lost">Lost</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="source" label="Source">
            <Select>
              <Select.Option value="website">Website</Select.Option>
              <Select.Option value="referral">Referral</Select.Option>
              <Select.Option value="social">Social Media</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeadsPage;
