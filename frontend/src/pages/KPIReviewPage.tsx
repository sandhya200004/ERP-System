import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Progress,
  App,
} from 'antd';
import {
  TrophyOutlined,
  TeamOutlined,
  LineChartOutlined,
  DownloadOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { Line, Column } from '@ant-design/charts';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface KPIData {
  employeeName: string;
  role: string;
  department: string;
  kpiScore: number;
  normalizedScore: number;
  totalTasks: number;
  completedTasks: number;
  avgTaskScore: number;
  onTimePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface HistoryData {
  month: string;
  score: number;
  timeliness: number;
  quality: number;
  efficiency: number;
}

const KPIReviewPage: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [teamKPIs, setTeamKPIs] = useState<KPIData[]>([]);
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(3, 'months'),
    dayjs(),
  ]);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>();
  const [roleFilter, setRoleFilter] = useState<string | undefined>();

  useEffect(() => {
    fetchKPIData();
    fetchHistoryData();
  }, [dateRange]);

  const fetchKPIData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with real API call
      // const data = await kpiService.getTeamKPI(dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD'));
      
      // Mock data
      const mockData: KPIData[] = [
        {
          employeeName: 'Rahul Sharma',
          role: 'DEVELOPER',
          department: 'Engineering',
          kpiScore: 92,
          normalizedScore: 88,
          totalTasks: 58,
          completedTasks: 52,
          avgTaskScore: 90,
          onTimePercentage: 95,
          trend: 'up',
        },
        {
          employeeName: 'Priya Patel',
          role: 'DESIGNER',
          department: 'Design',
          kpiScore: 84,
          normalizedScore: 82,
          totalTasks: 45,
          completedTasks: 38,
          avgTaskScore: 85,
          onTimePercentage: 88,
          trend: 'stable',
        },
        {
          employeeName: 'Amit Kumar',
          role: 'DEVELOPER',
          department: 'Engineering',
          kpiScore: 88,
          normalizedScore: 85,
          totalTasks: 62,
          completedTasks: 55,
          avgTaskScore: 87,
          onTimePercentage: 91,
          trend: 'up',
        },
      ];
      setTeamKPIs(mockData);
    } catch (error) {
      message.error('Failed to fetch KPI data');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryData = async () => {
    try {
      // TODO: Replace with real API call
      const mockHistory: HistoryData[] = [
        { month: 'Aug', score: 82, timeliness: 85, quality: 80, efficiency: 81 },
        { month: 'Sep', score: 85, timeliness: 88, quality: 83, efficiency: 84 },
        { month: 'Oct', score: 88, timeliness: 90, quality: 87, efficiency: 87 },
        { month: 'Nov', score: 90, timeliness: 92, quality: 89, efficiency: 89 },
      ];
      setHistoryData(mockHistory);
    } catch (error) {
      message.error('Failed to fetch history data');
    }
  };

  const handleExport = () => {
    message.success('Exporting KPI report...');
    // TODO: Implement Excel export
  };

  const filteredKPIs = teamKPIs.filter((kpi) => {
    if (departmentFilter && kpi.department !== departmentFilter) return false;
    if (roleFilter && kpi.role !== roleFilter) return false;
    return true;
  });

  const avgKPI = filteredKPIs.length > 0
    ? Math.round(filteredKPIs.reduce((sum, k) => sum + k.kpiScore, 0) / filteredKPIs.length)
    : 0;

  const totalTasks = filteredKPIs.reduce((sum, k) => sum + k.totalTasks, 0);
  const totalCompleted = filteredKPIs.reduce((sum, k) => sum + k.completedTasks, 0);
  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const columns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 70,
      render: (_: any, __: any, index: number) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        return (
          <span style={{ fontSize: 18 }}>
            {medal} {index + 1}
          </span>
        );
      },
    },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 200,
      sorter: (a: KPIData, b: KPIData) => a.employeeName.localeCompare(b.employeeName),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'KPI Score',
      dataIndex: 'kpiScore',
      key: 'kpiScore',
      width: 150,
      sorter: (a: KPIData, b: KPIData) => a.kpiScore - b.kpiScore,
      defaultSortOrder: 'descend' as const,
      render: (score: number, record: KPIData) => (
        <Space>
          <Progress
            type="circle"
            percent={score}
            width={50}
            strokeColor={score >= 90 ? '#52c41a' : score >= 70 ? '#1890ff' : '#faad14'}
          />
          <span style={{ fontSize: 16, fontWeight: 600 }}>{score}</span>
          {record.trend === 'up' && <RiseOutlined style={{ color: '#52c41a' }} />}
          {record.trend === 'down' && <FallOutlined style={{ color: '#ff4d4f' }} />}
        </Space>
      ),
    },
    {
      title: 'Normalized',
      dataIndex: 'normalizedScore',
      key: 'normalizedScore',
      sorter: (a: KPIData, b: KPIData) => a.normalizedScore - b.normalizedScore,
    },
    {
      title: 'Tasks',
      key: 'tasks',
      render: (_: any, record: KPIData) => (
        <span>
          {record.completedTasks} / {record.totalTasks}
        </span>
      ),
    },
    {
      title: 'Completion %',
      key: 'completion',
      sorter: (a: KPIData, b: KPIData) =>
        (a.completedTasks / a.totalTasks) - (b.completedTasks / b.totalTasks),
      render: (_: any, record: KPIData) => {
        const pct = Math.round((record.completedTasks / record.totalTasks) * 100);
        return <Progress percent={pct} size="small" />;
      },
    },
    {
      title: 'On-Time %',
      dataIndex: 'onTimePercentage',
      key: 'onTimePercentage',
      sorter: (a: KPIData, b: KPIData) => a.onTimePercentage - b.onTimePercentage,
      render: (pct: number) => (
        <Tag color={pct >= 90 ? 'success' : pct >= 70 ? 'processing' : 'warning'}>
          {pct}%
        </Tag>
      ),
    },
  ];

  const lineConfig = {
    data: historyData.flatMap((d) => [
      { month: d.month, value: d.score, category: 'Overall' },
      { month: d.month, value: d.timeliness, category: 'Timeliness' },
      { month: d.month, value: d.quality, category: 'Quality' },
      { month: d.month, value: d.efficiency, category: 'Efficiency' },
    ]),
    xField: 'month',
    yField: 'value',
    seriesField: 'category',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  const columnConfig = {
    data: filteredKPIs.map((k) => ({
      name: k.employeeName.split(' ')[0],
      score: k.kpiScore,
    })),
    xField: 'name',
    yField: 'score',
    label: {
      position: 'top' as const,
      style: {
        fill: '#000000',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      score: {
        alias: 'KPI Score',
      },
    },
  };

  const uniqueDepartments = Array.from(new Set(teamKPIs.map((k) => k.department)));
  const uniqueRoles = Array.from(new Set(teamKPIs.map((k) => k.role)));

  return (
    <div>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="Team Average KPI"
              value={avgKPI}
              prefix={<TrophyOutlined />}
              suffix="/ 100"
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Team Members"
              value={filteredKPIs.length}
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Tasks"
              value={totalTasks}
              prefix={<LineChartOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Completion Rate"
              value={completionRate}
              suffix="%"
              valueStyle={{ color: completionRate >= 80 ? '#3f8600' : '#cf1322' }}
            />
          </Col>
        </Row>

        <Space style={{ marginBottom: 16 }} wrap>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) {
                setDateRange([dates[0]!, dates[1]!]);
              }
            }}
          />
          <Select
            placeholder="Filter by Department"
            allowClear
            style={{ width: 200 }}
            value={departmentFilter}
            onChange={setDepartmentFilter}
          >
            {uniqueDepartments.map((dept) => (
              <Option key={dept} value={dept}>
                {dept}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by Role"
            allowClear
            style={{ width: 200 }}
            value={roleFilter}
            onChange={setRoleFilter}
          >
            {uniqueRoles.map((role) => (
              <Option key={role} value={role}>
                {role}
              </Option>
            ))}
          </Select>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export Report
          </Button>
        </Space>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title="KPI Trend (Last 4 Months)" size="small">
              <Line {...lineConfig} height={250} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Team Comparison" size="small">
              <Column {...columnConfig} height={250} />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredKPIs}
          loading={loading}
          rowKey="employeeName"
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} employees`,
          }}
        />
      </Card>
    </div>
  );
};

export default KPIReviewPage;
