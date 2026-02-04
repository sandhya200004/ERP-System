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
import { quoteService } from '../services/quote.service';
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
    try {
      message.loading({ content: 'Generating PDF...', key: 'pdf' });
      const proposalElement = document.getElementById('proposal-preview');
      if (!proposalElement) {
        message.error({ content: 'Proposal preview not found', key: 'pdf' });
        return;
      }

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
      
      // Open PDF in new tab for preview instead of auto-download
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      message.success({ content: 'PDF opened in new tab for preview', key: 'pdf' });
    } catch (error: any) {
      message.destroy();
      console.error('PDF generation error:', error);
      message.error(error.message || 'Failed to generate PDF');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // If we're in preview mode, use proposalData which was already validated
      if (previewMode && proposalData) {
        const payload = {
          customerId: proposalData.customerId,
          quoteDate: dayjs().format('YYYY-MM-DD'),
          validUntil: proposalData.validUntil,
          notes: proposalData.terms || '',
          lines: proposalData.lines.map((line: ProposalLine) => ({
            description: `${line.service}: ${line.description || ''}`.trim(),
            quantity: 1,
            unitPrice: Number(line.price),
            discount: 0
          }))
        };

        console.log('Submitting proposal payload:', payload);

        if (editingProposal) {
          await quoteService.update(editingProposal.id, payload);
          message.success('Proposal updated successfully!');
        } else {
          await quoteService.create(payload);
          message.success('Proposal created successfully!');
        }
        
        // Refresh proposals list
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
        return;
      }

      // Otherwise validate form first
      const values = await form.validateFields();
      
      // Validate that we have at least one line with service and price
      const validLines = lines.filter(line => line.service && line.price > 0);
      if (validLines.length === 0) {
        message.error('Please add at least one service with a price');
        setLoading(false);
        return;
      }

      // Validate required fields
      if (!values.customerId) {
        message.error('Please select a client');
        setLoading(false);
        return;
      }

      if (!values.validUntil) {
        message.error('Please select a valid until date');
        setLoading(false);
        return;
      }
      
      const payload = {
        customerId: values.customerId,
        quoteDate: dayjs().format('YYYY-MM-DD'),
        validUntil: values.validUntil.format('YYYY-MM-DD'),
        notes: values.terms || '',
        lines: validLines.map(line => ({
          description: `${line.service}: ${line.description || ''}`.trim(),
          quantity: 1,
          unitPrice: Number(line.price),
          discount: 0
        }))
      };

      console.log('Submitting proposal payload:', payload);

      if (editingProposal) {
        await quoteService.update(editingProposal.id, payload);
        message.success('Proposal updated successfully!');
      } else {
        await quoteService.create(payload);
        message.success('Proposal created successfully!');
      }
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error saving proposal:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save proposal';
      message.error(errorMessage);
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
        width="90%"
        style={{ maxWidth: 900, top: 20 }}
        centered
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
      >
        <div id="proposal-preview" style={{ padding: '40px', background: '#fff', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#000' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, borderBottom: '3px solid #2c3e7d', paddingBottom: 20 }}>
            <div>
              <img
                src="/triverse-logo.png"
                alt="TriVerse Solutions"
                style={{ height: 50, marginBottom: 16 }}
              />
              <Title level={4} style={{ margin: 0, color: '#2c3e7d', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                TriVerse Solutions
              </Title>
              <Text style={{ color: '#666', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Digital Solutions & Consulting</Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Title level={2} style={{ margin: 0, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                PROPOSAL
              </Title>
              <Text strong style={{ fontSize: 16, color: '#000', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>#{proposalData?.proposalNumber}</Text>
              <br />
              <Text style={{ color: '#666', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Valid Until: {dayjs(proposalData?.validUntil).format('MMM DD, YYYY')}</Text>
            </div>
          </div>

          {/* Client Information */}
          <Card style={{ marginBottom: 30, background: '#f5f5f5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Row gutter={40}>
              <Col span={12}>
                <Title level={5} style={{ color: '#2c3e7d', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Prepared For:</Title>
                <Text strong style={{ display: 'block', fontSize: 16, color: '#000', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{proposalData?.customer?.name}</Text>
                {proposalData?.customer?.email && <Text style={{ color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{proposalData.customer.email}</Text>}
                {proposalData?.customer?.phone && <Text style={{ display: 'block', color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{proposalData.customer.phone}</Text>}
              </Col>
              <Col span={12}>
                <Title level={5} style={{ color: '#2c3e7d', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Proposal Date:</Title>
                <Text strong style={{ color: '#000', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{dayjs().format('MMMM DD, YYYY')}</Text>
              </Col>
            </Row>
          </Card>

          {/* Services */}
          <Title level={4} style={{ color: '#2c3e7d', marginBottom: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Proposed Services</Title>
          
          {proposalData?.lines?.map((line: ProposalLine, index: number) => (
            <Card 
              key={index}
              style={{ 
                marginBottom: 20,
                borderLeft: '4px solid #667eea',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Title level={5} style={{ margin: 0, color: '#2c3e7d', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {index + 1}. {line.service}
                </Title>
                <Text strong style={{ fontSize: 18, color: '#2c3e7d', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  ₹{line.price.toLocaleString('en-IN')}
                </Text>
              </div>
              <Paragraph style={{ color: '#666', marginBottom: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {line.description}
              </Paragraph>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong style={{ color: '#000', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Deliverables:</Text>
                  <Paragraph style={{ color: '#666', marginTop: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {line.deliverables}
                  </Paragraph>
                </Col>
                <Col span={12}>
                  <Text strong style={{ color: '#000', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Timeline:</Text>
                  <Paragraph style={{ color: '#666', marginTop: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {line.timeline}
                  </Paragraph>
                </Col>
              </Row>
            </Card>
          ))}

          {/* Total */}
          <div style={{ marginTop: 40, padding: 20, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Total Investment
              </Title>
              <Title level={2} style={{ margin: 0, color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ₹{proposalData?.totalAmount.toLocaleString('en-IN')}
              </Title>
            </div>
          </div>

          {/* Terms */}
          {proposalData?.terms && (
            <div style={{ marginTop: 30 }}>
              <Title level={5} style={{ color: '#2c3e7d', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Terms & Conditions</Title>
              <Paragraph style={{ whiteSpace: 'pre-line', color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
            <Text strong style={{ fontSize: 16, color: '#2c3e7d', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
      width="90%"
      style={{ maxWidth: 1200 }}
      centered
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
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleViewPDF = async (proposal: Proposal) => {
    try {
      // Fetch full proposal details including line items
      const fullProposal = await quoteService.getById(proposal.id);
      console.log('Full proposal data:', fullProposal);
      
      // Map the API response to our Proposal interface
      const mappedProposal: Proposal = {
        id: fullProposal.id,
        proposalNumber: fullProposal.quoteNumber || proposal.proposalNumber,
        customer: proposal.customer,
        validUntil: fullProposal.validUntil,
        status: (['draft', 'sent', 'accepted', 'rejected'] as const).includes(fullProposal.status as any)
          ? (fullProposal.status as 'draft' | 'sent' | 'accepted' | 'rejected')
          : 'draft',
        lines: ((fullProposal as any).lines || []).map((line: any) => ({
          id: line.id,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unit_price || line.unitPrice,
          discount: line.discount || 0,
        })),
        totalAmount: fullProposal.total || 0,
        terms: fullProposal.notes || '',
        createdDate: fullProposal.quoteDate || proposal.createdDate
      };
      
      setViewingProposal(mappedProposal);
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      message.error('Failed to load proposal details');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await quoteService.getAll();
      console.log('API Response:', response);
      
      // Handle both array and paginated responses
      let quotes = [];
      if (Array.isArray(response)) {
        quotes = response;
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
        quotes = (response as any).data;
      } else if (response && typeof response === 'object') {
        // Response might be a single object or have other structure
        quotes = [];
      }
      
      console.log('Quotes array:', quotes);
      
      const mappedProposals: Proposal[] = quotes.map((quote: any) => {
        console.log('Mapping quote:', quote);
        return {
          id: quote.id,
          proposalNumber: quote.quote_number || quote.quoteNumber,
          customer: { 
            id: quote.customer_id,
            name: quote.customers?.name || quote.customer?.name || 'Unknown' 
          },
          validUntil: quote.valid_until || quote.validUntil,
          status: quote.status || 'draft',
          lines: [],
          totalAmount: quote.total || 0,
          terms: quote.notes || '',
          createdDate: quote.quote_date || quote.quoteDate || dayjs().format('YYYY-MM-DD')
        };
      });
      console.log('Mapped proposals:', mappedProposals);
      setProposals(mappedProposals);
    } catch (error: any) {
      console.error('Error fetching proposals:', error);
      // Only show error if it's not a 404 (no data) or network issue
      if (error.response?.status && error.response.status !== 404) {
        message.error(error.response?.data?.message || 'Failed to fetch proposals');
      }
      setProposals([]);
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
            onClick={() => handleViewPDF(record)}
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
    <div style={{ padding: '24px', background: '#000000', minHeight: '100vh' }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .ant-modal-root, .ant-modal-root * {
            visibility: visible;
          }
          .ant-modal-wrap {
            position: absolute;
            left: 0;
            top: 0;
          }
          .ant-modal-header, .ant-modal-footer {
            display: none !important;
          }
        }
      `}</style>
      
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

      <Modal
        title="Proposal Preview"
        open={!!viewingProposal}
        onCancel={() => setViewingProposal(null)}
        width="90%"
        style={{ maxWidth: 900 }}
        centered
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print / Save as PDF
          </Button>,
          <Button key="close" onClick={() => setViewingProposal(null)}>
            Close
          </Button>
        ]}
      >
        {viewingProposal && (
          <div style={{ padding: '20px', backgroundColor: 'white' }}>
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0 }}>PROPOSAL</Title>
              <Text type="secondary">#{viewingProposal.proposalNumber}</Text>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
              <Col span={12}>
                <div>
                  <Text strong>Client:</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text>{viewingProposal.customer.name}</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Date:</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text>{dayjs(viewingProposal.createdDate).format('MMMM DD, YYYY')}</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Valid Until:</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text>{dayjs(viewingProposal.validUntil).format('MMMM DD, YYYY')}</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Status:</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Tag color={getStatusColor(viewingProposal.status)}>
                      {viewingProposal.status.toUpperCase()}
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>

            <Divider />

            <div style={{ marginBottom: '20px' }}>
              <Text strong style={{ fontSize: '16px' }}>Services</Text>
            </div>

            <Table
              dataSource={viewingProposal.lines}
              pagination={false}
              size="small"
              rowKey="id"
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
                  width: 100,
                  align: 'center' as const,
                },
                {
                  title: 'Unit Price',
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  width: 150,
                  align: 'right' as const,
                  render: (price: number) => `₹${price.toLocaleString('en-IN')}`,
                },
                {
                  title: 'Total',
                  key: 'total',
                  width: 150,
                  align: 'right' as const,
                  render: (_: any, record: any) => 
                    `₹${(record.quantity * record.unitPrice).toLocaleString('en-IN')}`,
                },
              ]}
            />

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <Title level={3}>
                Total: ₹{viewingProposal.totalAmount.toLocaleString('en-IN')}
              </Title>
            </div>

            {viewingProposal.terms && (
              <>
                <Divider />
                <div>
                  <Text strong style={{ fontSize: '16px' }}>Terms & Conditions</Text>
                  <div style={{ marginTop: '12px', whiteSpace: 'pre-wrap' }}>
                    <Text>{viewingProposal.terms}</Text>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProposalsPage;
