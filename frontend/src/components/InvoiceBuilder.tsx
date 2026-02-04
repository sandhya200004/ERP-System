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
  Card,
  App,
} from 'antd';
import { PlusOutlined, DeleteOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { customerService } from '../services/customer.service';
import { itemService } from '../services/item.service';
import { invoiceService } from '../services/invoice.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    if (visible) {
      // Initialize form with default dates when modal opens
      form.setFieldsValue({
        invoiceDate: dayjs(),
        dueDate: dayjs().add(30, 'days'),
      });
      
      // Always fetch data when modal opens if not already loaded
      if (customers.length === 0 || items.length === 0) {
        fetchData();
      } else if (lines.length === 0) {
        // If data already loaded but no lines, add one
        addLine();
      }
    }
  }, [visible]);

  const fetchData = async () => {
    setFetchingData(true);
    try {
      // Fetch customers and items in parallel
      const [customersResponse, itemsResponse] = await Promise.all([
        customerService.getAll().catch(() => ({ data: [] })),
        itemService.getAll().catch(() => ({ data: [] })),
      ]);
      
      const customerData = Array.isArray(customersResponse) ? customersResponse : customersResponse.data || [];
      const itemData = Array.isArray(itemsResponse) ? itemsResponse : itemsResponse.data || [];
      
      console.log('Fetched customers:', customerData.length);
      console.log('Fetched items:', itemData.length);
      
      setCustomers(customerData);
      setItems(itemData);
      
      if (lines.length === 0) {
        addLine();
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('Failed to fetch data. Please try again.');
    } finally {
      setFetchingData(false);
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
      
      // Use invoiceData from preview if available, otherwise get from form
      let invoicePayload;
      
      if (previewMode && invoiceData) {
        // In preview mode, use the already validated data
        invoicePayload = {
          customerId: invoiceData.customerId,
          invoiceDate: dayjs(invoiceData.invoiceDate).format('YYYY-MM-DD'),
          dueDate: dayjs(invoiceData.dueDate).format('YYYY-MM-DD'),
          notes: invoiceData.notes || '',
          terms: invoiceData.terms || '',
          lines: invoiceData.lines.map((line: any) => ({
            itemId: line.itemId || undefined,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: 0,
          })),
        };
      } else {
        // Not in preview mode, get from form
        const values = await form.validateFields();
        const invoiceDate = values.invoiceDate ? dayjs(values.invoiceDate) : dayjs();
        const dueDate = values.dueDate ? dayjs(values.dueDate) : dayjs().add(30, 'days');

        invoicePayload = {
          customerId: values.customerId,
          invoiceDate: invoiceDate.format('YYYY-MM-DD'),
          dueDate: dueDate.format('YYYY-MM-DD'),
          notes: values.notes || '',
          terms: values.terms || '',
          lines: lines
            .filter((line) => line.description && line.quantity > 0)
            .map((line) => ({
              itemId: line.itemId || undefined,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              discount: 0,
            })),
        };
      }

      console.log('Creating invoice with payload:', invoicePayload);
      const response = await invoiceService.create(invoicePayload);
      console.log('Invoice created:', response);
      message.success('Invoice created successfully!');
      
      // Call onSuccess to refresh the invoice list
      console.log('Calling onSuccess callback');
      onSuccess();
      
      // Close the modal
      handleClose();
    } catch (error: any) {
      console.error('Invoice creation error:', error);
      console.error('Error response:', error.response?.data);
      
      // Display detailed validation errors
      if (error.response?.data?.message) {
        const errorMessages = Array.isArray(error.response.data.message) 
          ? error.response.data.message.join(', ')
          : error.response.data.message;
        message.error(errorMessages);
      } else {
        message.error(error.message || 'Failed to create invoice');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const invoiceElement = document.getElementById('invoice-preview');
    if (!invoiceElement) {
      message.error('Invoice preview not found');
      return;
    }

    try {
      message.loading('Generating PDF...', 0);
      
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Handle multi-page if content is too long
      const pageHeight = 297; // A4 height in mm
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
      pdf.save(`invoice-${invoiceData?.invoiceNumber || 'draft'}-${dayjs().format('YYYYMMDD')}.pdf`);
      message.success('PDF downloaded successfully!');
    } catch (error: any) {
      message.destroy();
      console.error('PDF generation error:', error);
      message.error(error.message || 'Failed to generate PDF');
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
        <div id="invoice-preview" style={{ padding: '40px', background: '#fff', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#000' }}>
          {/* Invoice Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
            <div>
              <img
                src="/triverse-logo.png"
                alt="TriVerse Solutions"
                style={{ height: 50, marginBottom: 16 }}
              />
              <Title level={4} style={{ margin: 0, color: '#2c3e7d', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                TriVerse Solutions
              </Title>
              <Text style={{ color: '#666', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ERP/CRM System</Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Title level={2} style={{ margin: 0, color: '#2c3e7d', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                INVOICE
              </Title>
              <Text style={{ color: '#666', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>#{invoiceData?.invoiceNumber || 'DRAFT'}</Text>
            </div>
          </div>

          {/* Bill To Section */}
          <Row gutter={40} style={{ marginBottom: 40 }}>
            <Col span={12}>
              <Title level={5} style={{ color: '#000', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Bill To:</Title>
              <Text strong style={{ display: 'block', color: '#000', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {invoiceData?.customer?.name}
              </Text>
              {invoiceData?.customer?.email && <Text style={{ color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{invoiceData.customer.email}</Text>}
              {invoiceData?.customer?.phone && (
                <Text style={{ display: 'block', color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{invoiceData.customer.phone}</Text>
              )}
              {invoiceData?.customer?.billingAddressLine1 && (
                <>
                  <Text style={{ display: 'block', color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{invoiceData.customer.billingAddressLine1}</Text>
                  {invoiceData?.customer?.billingCity && invoiceData?.customer?.billingCountry && (
                    <Text style={{ display: 'block', color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {invoiceData.customer.billingCity}, {invoiceData.customer.billingCountry}
                    </Text>
                  )}
                </>
              )}
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ color: '#000', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Invoice Date: </Text>
                <Text style={{ color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{dayjs(invoiceData?.invoiceDate).format('MMM DD, YYYY')}</Text>
              </div>
              <div>
                <Text strong style={{ color: '#000', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Due Date: </Text>
                <Text style={{ color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{dayjs(invoiceData?.dueDate).format('MMM DD, YYYY')}</Text>
              </div>
            </Col>
          </Row>

          {/* Invoice Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #d9d9d9', color: '#000', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Description
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    borderBottom: '2px solid #d9d9d9',
                    width: '100px',
                    color: '#000',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
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
                    color: '#000',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
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
                    color: '#000',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceData?.lines?.map((line: any, index: number) => (
                <tr key={index}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {line.description}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      borderBottom: '1px solid #f0f0f0',
                      color: '#333',
                      fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}
                  >
                    {line.quantity}
                  </td>
                  <td
                    style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0', color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    ${line.unitPrice.toFixed(2)}
                  </td>
                  <td
                    style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0', color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
                <Text style={{ color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Subtotal:</Text>
                <Text style={{ color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>${invoiceData?.subtotal.toFixed(2)}</Text>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <Text style={{ color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tax (10%):</Text>
                <Text style={{ color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>${invoiceData?.tax.toFixed(2)}</Text>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderTop: '2px solid #2c3e7d',
                }}
              >
                <Text strong style={{ fontSize: 18, color: '#000', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Total:
                </Text>
                <Text strong style={{ fontSize: 18, color: '#2c3e7d', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  ${invoiceData?.total.toFixed(2)}
                </Text>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoiceData?.notes && (
            <div>
              <Title level={5} style={{ color: '#000', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Notes:</Title>
              <Text style={{ color: '#333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{invoiceData.notes}</Text>
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
            <Text style={{ fontSize: 12, color: '#666', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
        <Button key="cancel" onClick={handleClose} disabled={fetchingData}>
          Cancel
        </Button>,
        <Button key="preview" onClick={handlePreview} disabled={fetchingData || lines.every(l => !l.description)}>
          Preview
        </Button>,
      ]}
    >
      {fetchingData ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Typography.Text>Loading customers and items...</Typography.Text>
        </div>
      ) : (
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

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Form.Item name="notes" label="Notes">
              <TextArea rows={3} placeholder="Additional notes..." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="terms" label="Payment Terms">
              <TextArea rows={3} placeholder="Payment terms and conditions..." />
            </Form.Item>
          </Col>
        </Row>
      </Form>
      )}
    </Modal>
  );
};

export default InvoiceBuilder;
