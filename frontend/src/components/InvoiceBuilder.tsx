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
} from 'antd';
import { PlusOutlined, DeleteOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { customerService } from '../services/customer.service';
import { itemService } from '../services/item.service';
import { invoiceService } from '../services/invoice.service';
import html2canvas from 'html2canvas';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface InvoiceBuilderProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InvoiceLine {
  key: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      fetchCustomers();
      fetchItems();
      addLine();
    }
  }, [visible]);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll();
      // Handle both array and object with data property
      const customerData = Array.isArray(response) ? response : response.data || [];
      setCustomers(customerData);
    } catch (error) {
      message.error('Failed to fetch customers');
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemService.getAll();
      // Handle both array and object with data property
      const itemData = Array.isArray(response) ? response : response.data || [];
      setItems(itemData);
    } catch (error) {
      message.error('Failed to fetch items');
    }
  };

  const addLine = () => {
    const newLine: InvoiceLine = {
      key: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (key: string) => {
    setLines(lines.filter((line) => line.key !== key));
  };

  const updateLine = (key: string, field: string, value: any) => {
    setLines(
      lines.map((line) => {
        if (line.key === key) {
          const updatedLine = { ...line, [field]: value };
          if (field === 'itemId') {
            const item = items.find((i) => i.id === value);
            if (item) {
              updatedLine.description = item.name;
              updatedLine.unitPrice = item.salePrice || 0;
            }
          }
          updatedLine.amount = updatedLine.quantity * updatedLine.unitPrice;
          return updatedLine;
        }
        return line;
      })
    );
  };

  const calculateTotals = () => {
    const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handlePreview = () => {
    form.validateFields().then((values) => {
      const { subtotal, tax, total } = calculateTotals();
      const selectedCustomer = customers.find((c) => c.id === values.customerId);
      
      setInvoiceData({
        ...values,
        customer: selectedCustomer,
        lines: lines.filter((line) => line.description),
        subtotal,
        tax,
        total,
        invoiceDate: values.invoiceDate?.format('YYYY-MM-DD'),
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
      });
      setPreviewMode(true);
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const invoicePayload = {
        customerId: values.customerId,
        invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        notes: values.notes,
        lines: lines
          .filter((line) => line.description)
          .map((line) => ({
            itemId: line.itemId || '',
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
      };

      await invoiceService.create(invoicePayload);
      message.success('Invoice created successfully!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const invoiceElement = document.getElementById('invoice-preview');
    if (!invoiceElement) return;

    try {
      const canvas = await html2canvas(invoiceElement, {
        useCORS: true,
        logging: false,
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF using window.jspdf (loaded via CDN)
      const { jsPDF } = (window as any);
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${invoiceData?.invoiceNumber || 'draft'}.pdf`);
      message.success('PDF downloaded successfully!');
    } catch (error) {
      message.error('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    form.resetFields();
    setLines([]);
    setPreviewMode(false);
    setInvoiceData(null);
    onClose();
  };

  const { subtotal, tax, total } = calculateTotals();

  const lineColumns = [
    {
      title: 'Item',
      dataIndex: 'itemId',
      width: '25%',
      render: (_: any, record: InvoiceLine) => (
        <Select
          showSearch
          placeholder="Select item"
          value={record.itemId}
          onChange={(value) => updateLine(record.key, 'itemId', value)}
          style={{ width: '100%' }}
          optionFilterProp="children"
        >
          {items.map((item) => (
            <Select.Option key={item.id} value={item.id}>
              {item.name}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: '30%',
      render: (_: any, record: InvoiceLine) => (
        <Input
          value={record.description}
          onChange={(e) => updateLine(record.key, 'description', e.target.value)}
          placeholder="Description"
        />
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      width: '15%',
      render: (_: any, record: InvoiceLine) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => updateLine(record.key, 'quantity', value || 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      width: '15%',
      render: (_: any, record: InvoiceLine) => (
        <InputNumber
          min={0}
          value={record.unitPrice}
          onChange={(value) => updateLine(record.key, 'unitPrice', value || 0)}
          style={{ width: '100%' }}
          prefix="$"
        />
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: '10%',
      render: (_: any, record: InvoiceLine) => <Text strong>${record.amount.toFixed(2)}</Text>,
    },
    {
      title: '',
      width: '5%',
      render: (_: any, record: InvoiceLine) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLine(record.key)}
          disabled={lines.length === 1}
        />
      ),
    },
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
          <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>,
          <Button key="pdf" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
            Download PDF
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
            Save Invoice
          </Button>,
        ]}
        style={{ top: 20 }}
      >
        <div id="invoice-preview" style={{ padding: '40px', background: '#fff' }}>
          {/* Invoice Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
            <div>
              <img
                src="/triverse-logo.png"
                alt="TriVerse Solutions"
                style={{ height: 50, marginBottom: 16 }}
              />
              <Title level={4} style={{ margin: 0, color: '#2c3e7d' }}>
                TriVerse Solutions
              </Title>
              <Text type="secondary">ERP/CRM System</Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Title level={2} style={{ margin: 0, color: '#2c3e7d' }}>
                INVOICE
              </Title>
              <Text type="secondary">#{invoiceData?.invoiceNumber || 'DRAFT'}</Text>
            </div>
          </div>

          {/* Bill To Section */}
          <Row gutter={40} style={{ marginBottom: 40 }}>
            <Col span={12}>
              <Title level={5}>Bill To:</Title>
              <Text strong style={{ display: 'block' }}>
                {invoiceData?.customer?.name}
              </Text>
              {invoiceData?.customer?.email && <Text>{invoiceData.customer.email}</Text>}
              {invoiceData?.customer?.phone && (
                <Text style={{ display: 'block' }}>{invoiceData.customer.phone}</Text>
              )}
              {invoiceData?.customer?.billingAddressLine1 && (
                <>
                  <Text style={{ display: 'block' }}>{invoiceData.customer.billingAddressLine1}</Text>
                  {invoiceData?.customer?.billingCity && invoiceData?.customer?.billingCountry && (
                    <Text style={{ display: 'block' }}>
                      {invoiceData.customer.billingCity}, {invoiceData.customer.billingCountry}
                    </Text>
                  )}
                </>
              )}
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Invoice Date: </Text>
                <Text>{dayjs(invoiceData?.invoiceDate).format('MMM DD, YYYY')}</Text>
              </div>
              <div>
                <Text strong>Due Date: </Text>
                <Text>{dayjs(invoiceData?.dueDate).format('MMM DD, YYYY')}</Text>
              </div>
            </Col>
          </Row>

          {/* Invoice Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #d9d9d9' }}>
                  Description
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    borderBottom: '2px solid #d9d9d9',
                    width: '100px',
                  }}
                >
                  Quantity
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'right',
                    borderBottom: '2px solid #d9d9d9',
                    width: '120px',
                  }}
                >
                  Unit Price
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'right',
                    borderBottom: '2px solid #d9d9d9',
                    width: '120px',
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceData?.lines?.map((line: any, index: number) => (
                <tr key={index}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    {line.description}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    {line.quantity}
                  </td>
                  <td
                    style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}
                  >
                    ${line.unitPrice.toFixed(2)}
                  </td>
                  <td
                    style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}
                  >
                    ${line.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
            <div style={{ width: 300 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <Text>Subtotal:</Text>
                <Text>${invoiceData?.subtotal.toFixed(2)}</Text>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <Text>Tax (10%):</Text>
                <Text>${invoiceData?.tax.toFixed(2)}</Text>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderTop: '2px solid #2c3e7d',
                }}
              >
                <Text strong style={{ fontSize: 18 }}>
                  Total:
                </Text>
                <Text strong style={{ fontSize: 18, color: '#2c3e7d' }}>
                  ${invoiceData?.total.toFixed(2)}
                </Text>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoiceData?.notes && (
            <div>
              <Title level={5}>Notes:</Title>
              <Text>{invoiceData.notes}</Text>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: 60,
              paddingTop: 20,
              borderTop: '1px solid #d9d9d9',
              textAlign: 'center',
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Thank you for your business!
            </Text>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Create Invoice"
      open={visible}
      onCancel={handleClose}
      width={1200}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button key="preview" onClick={handlePreview}>
          Preview
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="customerId"
              label="Customer"
              rules={[{ required: true, message: 'Please select a customer' }]}
            >
              <Select
                showSearch
                placeholder="Select customer"
                optionFilterProp="children"
              >
                {customers.map((customer) => (
                  <Select.Option key={customer.id} value={customer.id}>
                    {customer.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="invoiceDate"
              label="Invoice Date"
              rules={[{ required: true, message: 'Please select invoice date' }]}
              initialValue={dayjs()}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[{ required: true, message: 'Please select due date' }]}
              initialValue={dayjs().add(30, 'days')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Invoice Items</Divider>

        <Table
          dataSource={lines}
          columns={lineColumns}
          pagination={false}
          size="small"
          style={{ marginBottom: 16 }}
        />

        <Button type="dashed" onClick={addLine} block icon={<PlusOutlined />}>
          Add Line Item
        </Button>

        <Card style={{ marginTop: 16, background: '#fafafa' }}>
          <Row justify="end">
            <Col span={8}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Subtotal:</Text>
                <Text strong>${subtotal.toFixed(2)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Tax (10%):</Text>
                <Text strong>${tax.toFixed(2)}</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: 16 }}>
                  Total:
                </Text>
                <Text strong style={{ fontSize: 18, color: '#2c3e7d' }}>
                  ${total.toFixed(2)}
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        <Form.Item name="notes" label="Notes" style={{ marginTop: 16 }}>
          <TextArea rows={3} placeholder="Additional notes or payment terms..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InvoiceBuilder;
