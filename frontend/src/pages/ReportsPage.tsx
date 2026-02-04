import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  DatePicker,
  Button,
  Space,
  Tabs,
  Table,
  message,
  Spin,
} from 'antd';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import reportService from '../services/reportService';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// Small helper to download CSV
const downloadCSV = (filename: string, rows: string[][]) => {
  const csvContent = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ReportsPage: React.FC = () => {
  const [active, setActive] = useState<string>('pl');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);

  // Real data states
  const [plData, setPlData] = useState<any>(null);
  const [bsData, setBsData] = useState<any>(null);
  const [cfData, setCfData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [taxData, setTaxData] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      const [pl, bs, cf, chart, category, tax] = await Promise.all([
        reportService.getProfitAndLoss(startDate, endDate),
        reportService.getBalanceSheet(),
        reportService.getCashFlow(startDate, endDate),
        reportService.getRevenueExpensesChart(),
        reportService.getRevenueByCategory(),
        reportService.getTaxSummary(startDate, endDate),
      ]);

      setPlData(pl);
      setBsData(bs);
      setCfData(cf);
      setRevenueData(chart);
      setCategoryData(category);
      setTaxData(tax);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates: any) => {
    setDateRange(dates);
  };

  const handleRunReport = () => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      loadReportData(startDate, endDate);
    } else {
      loadReportData();
    }
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];

  const exportCurrentReportCSV = () => {
    try {
      if (!plData && !bsData && !cfData && !taxData) {
        message.warning('No data to export');
        return;
      }

      if (active === 'pl' && plData) downloadCSV('pnl.csv', plData.rows);
      else if (active === 'bs' && bsData) downloadCSV('balance_sheet.csv', bsData.rows);
      else if (active === 'cf' && cfData) downloadCSV('cash_flow.csv', cfData.rows);
      else if (active === 'tax' && taxData) downloadCSV('tax_report.csv', taxData.rows);
      else downloadCSV('report.csv', [['No data']]);
      
      message.success('CSV exported');
    } catch (err) {
      message.error('Export failed');
    }
  };

  // PDF export via html2canvas + jsPDF if available, otherwise print
  const exportPDF = async () => {
    try {
      // @ts-ignore
      if (window.html2canvas && window.jsPDF && printRef.current) {
        // @ts-ignore
        const canvas = await window.html2canvas(printRef.current, { scale: 2 });
        // @ts-ignore
        const pdf = new window.jsPDF('p', 'pt', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('report.pdf');
        message.success('PDF exported');
        return;
      }
      // fallback: trigger browser print
      window.print();
    } catch (err) {
      message.error('PDF export failed');
    }
  };

  const plColumns = [
    { title: 'Description', dataIndex: 0, key: 'desc' },
    { title: 'Currency', dataIndex: 1, key: 'cur' },
    { title: 'Amount', dataIndex: 2, key: 'amt', render: (v: any) => `₹${Number(v).toLocaleString('en-IN')}` },
  ];

  return (
    <div style={{ padding: '24px', background: '#000000', minHeight: '100vh' }}>
      <Title level={2}>Reports & Analytics</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <RangePicker onChange={handleDateChange} />
          <Button type="primary" onClick={handleRunReport} loading={loading}>
            Run Report
          </Button>
          <Button onClick={exportCurrentReportCSV} disabled={loading}>
            Export CSV
          </Button>
          <Button onClick={exportPDF} disabled={loading}>
            Export PDF
          </Button>
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading report data...</div>
        </div>
      ) : (
        <Tabs activeKey={active} onChange={(k) => setActive(k)}>
          <TabPane tab="Profit & Loss" key="pl">
            <div ref={(el) => (printRef.current = el)}>
              {plData && (
                <>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card>
                        <Statistic title="Revenue" value={plData.revenue} prefix="₹" />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card>
                        <Statistic title="COGS" value={plData.cogs} prefix="₹" />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card>
                        <Statistic title="Operating Expenses" value={plData.operatingExpenses} prefix="₹" />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card>
                        <Statistic
                          title="Net Profit"
                          value={plData.netProfit}
                          prefix="₹"
                          valueStyle={{ color: plData.netProfit >= 0 ? '#52c41a' : '#f5222d' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                      <Card title="Revenue vs Expenses">
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#667eea" />
                            <Bar dataKey="expenses" fill="#f093fb" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                      <Card title="Revenue by Category">
                        <ResponsiveContainer width="100%" height={320}>
                          <PieChart>
                            <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                              {categoryData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                  </Row>

                  <Card title="Profit & Loss Table" style={{ marginTop: 16 }}>
                    <Table
                      dataSource={plData.rows.map((r: string[], i: number) => ({
                        key: i,
                        0: r[0],
                        1: r[1],
                        2: r[2],
                      }))}
                      columns={plColumns}
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                    />
                  </Card>
                </>
              )}
            </div>
          </TabPane>

          <TabPane tab="Balance Sheet" key="bs">
            <Card>
              {bsData && (
                <Table
                  dataSource={bsData.rows.map((r: string[], i: number) => ({
                    key: i,
                    0: r[0],
                    1: r[1],
                    2: r[2],
                  }))}
                  columns={plColumns}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
              )}
            </Card>
          </TabPane>

          <TabPane tab="Cash Flow" key="cf">
            <Card>
              {cfData && (
                <Table
                  dataSource={cfData.rows.map((r: string[], i: number) => ({
                    key: i,
                    0: r[0],
                    1: r[1],
                    2: r[2],
                  }))}
                  columns={plColumns}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
              )}
            </Card>
          </TabPane>

          <TabPane tab="Tax Reports" key="tax">
            <Card>
              {taxData ? (
                <>
                  <Text>GST / VAT summaries and tax liabilities for the selected period.</Text>
                  <div style={{ marginTop: 16 }}>
                    <Statistic title="Total Tax Collected" value={taxData.totalTax} prefix="₹" />
                  </div>
                  <Table
                    dataSource={taxData.rows.slice(1).map((r: string[], i: number) => ({
                      key: i,
                      type: r[0],
                      amount: r[1],
                    }))}
                    columns={[
                      { title: 'Tax Type', dataIndex: 'type', key: 'type' },
                      { title: 'Amount', dataIndex: 'amount', key: 'amount' },
                    ]}
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    style={{ marginTop: 16 }}
                  />
                </>
              ) : (
                <Text>No tax data available</Text>
              )}
            </Card>
          </TabPane>

          <TabPane tab="Custom Report Builder" key="custom">
            <Card>
              <Text>Create a custom report by selecting dimensions and metrics. (Builder UI coming soon)</Text>
              <div style={{ marginTop: 12 }}>
                <Button type="primary">Open Report Builder</Button>
              </div>
            </Card>
          </TabPane>
        </Tabs>
      )}
    </div>
  );
};

export default ReportsPage;
