import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  InputNumber,
  Divider,
  Row,
  Col,
  Typography,
  message,
  Card,
  Tag,
  Space
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  DownloadOutlined, 
  EyeOutlined,
  EditOutlined,
  PrinterOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { customerService } from '../services/customer.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ProposalLine {
  key: string;
  service: string;
  description: string;
  deliverables: string;
  timeline: string;
  price: number;
}

interface Proposal {
  id: string;
  proposalNumber: string;
  customer: any;
  validUntil: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  lines: ProposalLine[];
  totalAmount: number;
  terms: string;
  createdDate: string;
}

const SERVICE_CATALOG = [
  {
    name: 'Branding & Visual Identity',
    description: 'Complete brand identity including logo, color palette, typography, and brand guidelines',
    defaultDeliverables: 'Logo designs, Brand guidelines, Color palette, Typography system',
    defaultTimeline: '2-3 weeks',
    defaultPrice: 50000
  },
  {
    name: 'Content Strategy',
    description: 'Strategic content planning, creation, and distribution across channels',
    defaultDeliverables: 'Content calendar, SEO strategy, Blog posts, Social media content',
    defaultTimeline: '4 weeks',
    defaultPrice: 35000
  },
  {
    name: 'Digital Marketing',
    description: 'Comprehensive digital marketing including SEO, social media, and email campaigns',
    defaultDeliverables: 'SEO optimization, Social campaigns, Email marketing, Analytics reports',
    defaultTimeline: 'Monthly retainer',
    defaultPrice: 45000
  },
  {
    name: 'Paid Ads Management',
    description: 'Google Ads, Facebook Ads, LinkedIn Ads management and optimization',
    defaultDeliverables: 'Ad campaigns, A/B testing, Performance reports, Budget optimization',
    defaultTimeline: 'Monthly retainer',
    defaultPrice: 40000
  },
  {
    name: 'Web Development',
    description: 'Custom website development with modern technologies',
    defaultDeliverables: 'Responsive website, CMS integration, Security setup, Performance optimization',
    defaultTimeline: '6-8 weeks',
    defaultPrice: 150000
  },
  {
    name: 'UI/UX Design',
    description: 'User interface and experience design for web and mobile applications',
    defaultDeliverables: 'Wireframes, Prototypes, UI designs, Usability testing',
    defaultTimeline: '4-6 weeks',
    defaultPrice: 75000
  },
  {
    name: 'SaaS + Tools Development',
    description: 'Custom SaaS platform development with scalable architecture',
    defaultDeliverables: 'Full-stack application, API development, Database design, Deployment',
    defaultTimeline: '12-16 weeks',
    defaultPrice: 500000
  },
  {
    name: 'CRM Setup/Automation',
    description: 'CRM implementation, customization, and workflow automation',
    defaultDeliverables: 'CRM configuration, Workflow automation, Integration setup, Training',
    defaultTimeline: '3-4 weeks',
    defaultPrice: 60000
  },
  {
    name: 'Performance Analytics',
    description: 'Analytics setup, tracking, and performance reporting',
    defaultDeliverables: 'Analytics setup, Custom dashboards, Performance reports, Insights',
    defaultTimeline: '2 weeks',
    defaultPrice: 30000
  },
  {
    name: 'Creative Production',
    description: 'Video production, graphic design, and creative content creation',
    defaultDeliverables: 'Video content, Graphics, Animations, Brand materials',
    defaultTimeline: '3-4 weeks',
    defaultPrice: 80000
  },
  {
    name: 'Consulting & Operations Setup',
    description: 'Business consulting and operational process setup',
    defaultDeliverables: 'Process documentation, SOP creation, Team training, Implementation',
    defaultTimeline: '4-6 weeks',
    defaultPrice: 100000
  }
];

interface ProposalBuilderProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProposal?: Proposal | null;
}

const ProposalBuilder: React.FC<ProposalBuilderProps> = ({ 
  visible, 
  onClose, 
  onSuccess,
  editingProposal 
}) => {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<any[]>([]);
  const [lines, setLines] = useState<ProposalLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [proposalData, setProposalData] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      fetchCustomers();
      if (!editingProposal && lines.length === 0) {
        addLine();
      }
    }
  }, [visible]);

  useEffect(() => {
    if (editingProposal) {
      form.setFieldsValue({
        customerId: editingProposal.customer.id,
        validUntil: dayjs(editingProposal.validUntil),
        terms: editingProposal.terms,
        status: editingProposal.status
      });
      setLines(editingProposal.lines);
    }
  }, [editingProposal]);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll();
      const customerData = Array.isArray(response) ? response : response.data || [];
      setCustomers(customerData);
    } catch (error) {
      message.error('Failed to fetch customers');
    }
  };

  const addLine = () => {
    const newLine: ProposalLine = {
      key: Date.now().toString(),
      service: '',
      description: '',
      deliverables: '',
      timeline: '',
      price: 0
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (key: string) => {
    setLines(lines.filter(line => line.key !== key));
  };

  const updateLine = (key: string, field: string, value: any) => {
    setLines(lines.map(line => {
      if (line.key === key) {
        const updatedLine = { ...line, [field]: value };
        
        if (field === 'service') {
          const service = SERVICE_CATALOG.find(s => s.name === value);
          if (service) {
            updatedLine.description = service.description;
            updatedLine.deliverables = service.defaultDeliverables;
            updatedLine.timeline = service.defaultTimeline;
            updatedLine.price = service.defaultPrice;
          }
        }
        
        return updatedLine;
      }
      return line;
    }));
  };

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + (line.price || 0), 0);
  };

  const handlePreview = () => {
    form.validateFields().then((values) => {
      const selectedCustomer = customers.find(c => c.id === values.customerId);
      const total = calculateTotal();
      
      setProposalData({
        ...values,
        customer: selectedCustomer,
        lines: lines.filter(line => line.service),
        totalAmount: total,
        validUntil: values.validUntil?.format('YYYY-MM-DD'),
        proposalNumber: editingProposal?.proposalNumber || `PROP-${String(Date.now()).slice(-6)}`
      });
      setPreviewMode(true);
    });
  };

  const handleDownloadPDF = async () => {
    const proposalElement = document.getElementById('proposal-preview');
    if (!proposalElement) {
      message.error('Proposal preview not found');
      return;
    }

    try {
      message.loading('Generating PDF...', 0);
      
      const canvas = await html2canvas(proposalElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Handle multi-page proposals
      const pageHeight = 297;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      message.destroy();
      pdf.save(`proposal-${proposalData?.proposalNumber || 'draft'}-${dayjs().format('YYYYMMDD')}.pdf`);
      message.success('PDF downloaded successfully!');
    } catch (error: any) {
      message.destroy();
      console.error('PDF generation error:', error);
      message.error(error.message || 'Failed to generate PDF');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // TODO: Connect to API with payload
      console.log('Proposal payload:', {
        customerId: values.customerId,
        validUntil: values.validUntil.format('YYYY-MM-DD'),
        terms: values.terms,
        status: values.status || 'draft',
        lines: lines.filter(line => line.service).map(line => ({
          service: line.service,
          description: line.description,
          deliverables: line.deliverables,
          timeline: line.timeline,
          price: line.price
        }))
      });

      message.success(editingProposal ? 'Proposal updated successfully!' : 'Proposal created successfully!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      message.error('Please fill all required fields');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setLines([]);
    setPreviewMode(false);
    setProposalData(null);
    onClose();
  };

  const lineColumns = [
    {
      title: 'Service',
      dataIndex: 'service',
      width: '25%',
      render: (_: any, record: ProposalLine) => (
        <Select
          showSearch
          placeholder="Select service"
          value={record.service}
          onChange={(value) => updateLine(record.key, 'service', value)}
          style={{ width: '100%' }}
        >
          {SERVICE_CATALOG.map(service => (
            <Select.Option key={service.name} value={service.name}>
              {service.name}
            </Select.Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Timeline',
      dataIndex: 'timeline',
      width: '15%',
      render: (_: any, record: ProposalLine) => (
        <Input
          value={record.timeline}
          onChange={(e) => updateLine(record.key, 'timeline', e.target.value)}
          placeholder="Timeline"
        />
      )
    },
    {
      title: 'Price (₹)',
      dataIndex: 'price',
      width: '15%',
      render: (_: any, record: ProposalLine) => (
        <InputNumber
          min={0}
          value={record.price}
          onChange={(value) => updateLine(record.key, 'price', value || 0)}
          style={{ width: '100%' }}
          prefix="₹"
        />
      )
    },
    {
      title: '',
      width: '5%',
      render: (_: any, record: ProposalLine) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLine(record.key)}
          disabled={lines.length === 1}
        />
      )
    }
  ];

  if (!visible) return null;

  if (previewMode) {
    return (
      <Modal
        open={visible}
        onCancel={() => setPreviewMode(false)}
        width={900}
        footer={[
          <Button key="back" onClick={() => setPreviewMode(false)}>
            Back to Edit
          </Button>,
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print
          </Button>,
          <Button key="pdf" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
            Download PDF
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
            Save Proposal
          </Button>
        ]}
        style={{ top: 20 }}
      >
        <div id="proposal-preview" style={{ padding: '40px', background: '#fff' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, borderBottom: '3px solid #2c3e7d', paddingBottom: 20 }}>
            <div>
              <img
                src="/triverse-logo.png"
                alt="TriVerse Solutions"
                style={{ height: 50, marginBottom: 16 }}
              />
              <Title level={4} style={{ margin: 0, color: '#2c3e7d' }}>
                TriVerse Solutions
              </Title>
              <Text type="secondary">Digital Solutions & Consulting</Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Title level={2} style={{ margin: 0, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PROPOSAL
              </Title>
              <Text strong style={{ fontSize: 16 }}>#{proposalData?.proposalNumber}</Text>
              <br />
              <Text type="secondary">Valid Until: {dayjs(proposalData?.validUntil).format('MMM DD, YYYY')}</Text>
            </div>
          </div>

          {/* Client Information */}
          <Card style={{ marginBottom: 30, background: '#f5f5f5' }}>
            <Row gutter={40}>
              <Col span={12}>
                <Title level={5} style={{ color: '#2c3e7d' }}>Prepared For:</Title>
                <Text strong style={{ display: 'block', fontSize: 16 }}>{proposalData?.customer?.name}</Text>
                {proposalData?.customer?.email && <Text>{proposalData.customer.email}</Text>}
                {proposalData?.customer?.phone && <Text style={{ display: 'block' }}>{proposalData.customer.phone}</Text>}
              </Col>
              <Col span={12}>
                <Title level={5} style={{ color: '#2c3e7d' }}>Proposal Date:</Title>
                <Text strong>{dayjs().format('MMMM DD, YYYY')}</Text>
              </Col>
            </Row>
          </Card>

          {/* Services */}
          <Title level={4} style={{ color: '#2c3e7d', marginBottom: 20 }}>Proposed Services</Title>
          
          {proposalData?.lines?.map((line: ProposalLine, index: number) => (
            <Card 
              key={index}
              style={{ 
                marginBottom: 20,
                borderLeft: '4px solid #667eea'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Title level={5} style={{ margin: 0, color: '#2c3e7d' }}>
                  {index + 1}. {line.service}
                </Title>
                <Text strong style={{ fontSize: 18, color: '#2c3e7d' }}>
                  ₹{line.price.toLocaleString('en-IN')}
                </Text>
              </div>
              <Paragraph style={{ color: '#666', marginBottom: 12 }}>
                {line.description}
              </Paragraph>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Deliverables:</Text>
                  <Paragraph style={{ color: '#666', marginTop: 4 }}>
                    {line.deliverables}
                  </Paragraph>
                </Col>
                <Col span={12}>
                  <Text strong>Timeline:</Text>
                  <Paragraph style={{ color: '#666', marginTop: 4 }}>
                    {line.timeline}
                  </Paragraph>
                </Col>
              </Row>
            </Card>
          ))}

          {/* Total */}
          <div style={{ marginTop: 40, padding: 20, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#fff' }}>
                Total Investment
              </Title>
              <Title level={2} style={{ margin: 0, color: '#fff' }}>
                ₹{proposalData?.totalAmount.toLocaleString('en-IN')}
              </Title>
            </div>
          </div>

          {/* Terms */}
          {proposalData?.terms && (
            <div style={{ marginTop: 30 }}>
              <Title level={5} style={{ color: '#2c3e7d' }}>Terms & Conditions</Title>
              <Paragraph style={{ whiteSpace: 'pre-line' }}>
                {proposalData.terms}
              </Paragraph>
            </div>
          )}

          {/* Footer */}
          <div style={{ 
            marginTop: 60, 
            paddingTop: 20, 
            borderTop: '2px solid #e8e8e8',
            textAlign: 'center'
          }}>
            <Text strong style={{ fontSize: 16, color: '#2c3e7d' }}>
              Let's Build Something Amazing Together!
            </Text>
            <br />
            <Text type="secondary">
              Contact us: info@triverse.com | +91 1234567890
            </Text>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={editingProposal ? 'Edit Proposal' : 'Create Proposal'}
      open={visible}
      onCancel={handleClose}
      width={1200}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button key="preview" type="primary" onClick={handlePreview}>
          Preview & Save
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="customerId"
              label="Client"
              rules={[{ required: true, message: 'Please select client' }]}
            >
              <Select
                showSearch
                placeholder="Select client"
                optionFilterProp="children"
              >
                {customers.map(customer => (
                  <Select.Option key={customer.id} value={customer.id}>
                    {customer.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="validUntil"
              label="Valid Until"
              rules={[{ required: true, message: 'Please select validity date' }]}
              initialValue={dayjs().add(30, 'days')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              name="status"
              label="Status"
              initialValue="draft"
            >
              <Select>
                <Select.Option value="draft">Draft</Select.Option>
                <Select.Option value="sent">Sent</Select.Option>
                <Select.Option value="accepted">Accepted</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider>Services</Divider>

        <Table
          dataSource={lines}
          columns={lineColumns}
          pagination={false}
          size="small"
          style={{ marginBottom: 16 }}
          expandable={{
            expandedRowRender: (record) => (
              <div>
                <Form.Item label="Description" style={{ marginBottom: 8 }}>
                  <TextArea
                    rows={2}
                    value={record.description}
                    onChange={(e) => updateLine(record.key, 'description', e.target.value)}
                    placeholder="Service description"
                  />
                </Form.Item>
                <Form.Item label="Deliverables" style={{ marginBottom: 0 }}>
                  <TextArea
                    rows={2}
                    value={record.deliverables}
                    onChange={(e) => updateLine(record.key, 'deliverables', e.target.value)}
                    placeholder="What will be delivered"
                  />
                </Form.Item>
              </div>
            )
          }}
        />

        <Button type="dashed" onClick={addLine} block icon={<PlusOutlined />}>
          Add Service
        </Button>

        <Card style={{ marginTop: 16, background: '#fafafa' }}>
          <div style={{ textAlign: 'right' }}>
            <Text strong style={{ fontSize: 18 }}>Total: </Text>
            <Text strong style={{ fontSize: 24, color: '#2c3e7d' }}>
              ₹{calculateTotal().toLocaleString('en-IN')}
            </Text>
          </div>
        </Card>

        <Form.Item name="terms" label="Terms & Conditions" style={{ marginTop: 16 }}>
          <TextArea rows={4} placeholder="Payment terms, project timeline, conditions..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ProposalsPage: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [builderVisible, setBuilderVisible] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      // Mock data
      const mockProposals: Proposal[] = [];
      setProposals(mockProposals);
    } catch (error) {
      message.error('Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'default',
      sent: 'blue',
      accepted: 'green',
      rejected: 'red'
    };
    return colors[status as keyof typeof colors];
  };

  const columns = [
    {
      title: 'Proposal #',
      dataIndex: 'proposalNumber',
      key: 'proposalNumber'
    },
    {
      title: 'Client',
      dataIndex: ['customer', 'name'],
      key: 'customer'
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Valid Until',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => <Text strong>₹{amount.toLocaleString('en-IN')}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Proposal) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingProposal(record);
              setBuilderVisible(true);
            }}
          >
            Edit
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={2}>Proposals</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => {
              setEditingProposal(null);
              setBuilderVisible(true);
            }}
          >
            Create Proposal
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={proposals}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <ProposalBuilder
        visible={builderVisible}
        onClose={() => {
          setBuilderVisible(false);
          setEditingProposal(null);
        }}
        onSuccess={fetchProposals}
        editingProposal={editingProposal}
      />
    </div>
  );
};

export default ProposalsPage;
