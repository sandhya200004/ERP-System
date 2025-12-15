import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Progress,
  Statistic,
  Table,
  Tag,
  Space,
  Select,
  DatePicker
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  StarOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface KPIMetric {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  attendanceScore: number;
  taskCompletionRate: number;
  performanceRating: number;
  projectsCompleted: number;
  onTimeDelivery: number;
  clientSatisfaction: number;
  teamCollaboration: number;
  overallScore: number;
}

interface Task {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'pending' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  completedDate?: string;
}

const EmployeeKPIPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [kpiData, setKpiData] = useState<KPIMetric[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchKPIData();
    fetchTasks();
  }, []);

  const fetchKPIData = () => {
    // Mock KPI data
    const mockData: KPIMetric[] = [
      {
        id: '1',
        employeeId: 'EMP001',
        employeeName: 'Rahul Sharma',
        department: 'Development',
        attendanceScore: 95,
        taskCompletionRate: 88,
        performanceRating: 4.5,
        projectsCompleted: 12,
        onTimeDelivery: 90,
        clientSatisfaction: 92,
        teamCollaboration: 85,
        overallScore: 90
      },
      {
        id: '2',
        employeeId: 'EMP002',
        employeeName: 'Priya Patel',
        department: 'Design',
        attendanceScore: 98,
        taskCompletionRate: 92,
        performanceRating: 4.8,
        projectsCompleted: 15,
        onTimeDelivery: 95,
        clientSatisfaction: 96,
        teamCollaboration: 90,
        overallScore: 94
      },
      {
        id: '3',
        employeeId: 'EMP003',
        employeeName: 'Amit Kumar',
        department: 'Marketing',
        attendanceScore: 85,
        taskCompletionRate: 75,
        performanceRating: 3.8,
        projectsCompleted: 8,
        onTimeDelivery: 78,
        clientSatisfaction: 82,
        teamCollaboration: 80,
        overallScore: 81
      }
    ];
    setKpiData(mockData);
  };

  const fetchTasks = () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Complete dashboard redesign',
        status: 'completed',
        priority: 'high',
        dueDate: '2025-11-05',
        completedDate: '2025-11-04'
      },
      {
        id: '2',
        title: 'Update API documentation',
        status: 'in-progress',
        priority: 'medium',
        dueDate: '2025-11-10'
      },
      {
        id: '3',
        title: 'Client presentation preparation',
        status: 'pending',
        priority: 'high',
        dueDate: '2025-11-08'
      }
    ];
    setTasks(mockTasks);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 75) return '#1890ff';
    if (score >= 60) return '#fa8c16';
    return '#f5222d';
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  };

  const monthlyPerformanceData = [
    { month: 'Jul', score: 82 },
    { month: 'Aug', score: 85 },
    { month: 'Sep', score: 88 },
    { month: 'Oct', score: 90 },
    { month: 'Nov', score: 92 }
  ];

  const radarData = kpiData.length > 0 ? [
    { metric: 'Attendance', value: kpiData[0].attendanceScore },
    { metric: 'Task Completion', value: kpiData[0].taskCompletionRate },
    { metric: 'On-Time Delivery', value: kpiData[0].onTimeDelivery },
    { metric: 'Client Satisfaction', value: kpiData[0].clientSatisfaction },
    { metric: 'Team Collaboration', value: kpiData[0].teamCollaboration }
  ] : [];

  const kpiColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: KPIMetric) => (
        <div>
          <Text strong>{record.employeeName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.employeeId}</Text>
        </div>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: 'Attendance',
      dataIndex: 'attendanceScore',
      key: 'attendance',
      render: (score: number) => (
        <Progress percent={score} size="small" strokeColor={getScoreColor(score)} />
      ),
      sorter: (a: KPIMetric, b: KPIMetric) => a.attendanceScore - b.attendanceScore
    },
    {
      title: 'Task Completion',
      dataIndex: 'taskCompletionRate',
      key: 'taskCompletion',
      render: (rate: number) => (
        <Progress percent={rate} size="small" strokeColor={getScoreColor(rate)} />
      ),
      sorter: (a: KPIMetric, b: KPIMetric) => a.taskCompletionRate - b.taskCompletionRate
    },
    {
      title: 'Projects',
      dataIndex: 'projectsCompleted',
      key: 'projects',
      render: (count: number) => (
        <Statistic value={count} valueStyle={{ fontSize: 16 }} />
      ),
      sorter: (a: KPIMetric, b: KPIMetric) => a.projectsCompleted - b.projectsCompleted
    },
    {
      title: 'Rating',
      dataIndex: 'performanceRating',
      key: 'rating',
      render: (rating: number) => (
        <Space>
          <StarOutlined style={{ color: '#faad14' }} />
          <Text strong>{rating.toFixed(1)}</Text>
        </Space>
      ),
      sorter: (a: KPIMetric, b: KPIMetric) => a.performanceRating - b.performanceRating
    },
    {
      title: 'Overall Score',
      dataIndex: 'overallScore',
      key: 'overall',
      render: (score: number) => (
        <Tag color={getScoreColor(score)} style={{ fontSize: 14, padding: '4px 12px' }}>
          {score}% - {getPerformanceLevel(score)}
        </Tag>
      ),
      sorter: (a: KPIMetric, b: KPIMetric) => a.overallScore - b.overallScore
    }
  ];

  const taskColumns = [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const colors = { high: 'red', medium: 'orange', low: 'blue' };
        return <Tag color={colors[priority as keyof typeof colors]}>{priority.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          completed: 'success',
          'in-progress': 'processing',
          pending: 'default',
          overdue: 'error'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY')
    }
  ];

  const topPerformer = kpiData.length > 0 ? kpiData.reduce((prev, current) => 
    prev.overallScore > current.overallScore ? prev : current
  ) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>
          <TrophyOutlined /> Employee Performance KPIs
        </Title>
        <Space>
          <Select
            defaultValue="all"
            style={{ width: 200 }}
            onChange={(value) => console.log('Employee selected:', value)}
          >
            <Select.Option value="all">All Employees</Select.Option>
            {kpiData.map(emp => (
              <Select.Option key={emp.employeeId} value={emp.employeeId}>
                {emp.employeeName}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates: any) => setDateRange(dates)}
          />
        </Space>
      </div>

      {/* Top Performer Card */}
      {topPerformer && (
        <Card 
          style={{ 
            marginBottom: 24, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff'
          }}
        >
          <Row align="middle" gutter={16}>
            <Col>
              <TrophyOutlined style={{ fontSize: 48, color: '#ffd700' }} />
            </Col>
            <Col flex="auto">
              <Title level={4} style={{ color: '#fff', margin: 0 }}>
                Top Performer of the Month
              </Title>
              <Title level={3} style={{ color: '#fff', margin: '8px 0' }}>
                {topPerformer.employeeName}
              </Title>
              <Text style={{ color: '#fff', fontSize: 16 }}>
                {topPerformer.department} • Overall Score: {topPerformer.overallScore}%
              </Text>
            </Col>
            <Col>
              <Statistic
                title={<span style={{ color: '#fff' }}>Performance Rating</span>}
                value={topPerformer.performanceRating}
                suffix="/ 5"
                valueStyle={{ color: '#ffd700', fontSize: 36 }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* KPI Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Attendance"
              value={kpiData.reduce((sum, emp) => sum + emp.attendanceScore, 0) / kpiData.length || 0}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Task Completion Rate"
              value={kpiData.reduce((sum, emp) => sum + emp.taskCompletionRate, 0) / kpiData.length || 0}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Projects"
              value={kpiData.reduce((sum, emp) => sum + emp.projectsCompleted, 0)}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Client Satisfaction"
              value={kpiData.reduce((sum, emp) => sum + emp.clientSatisfaction, 0) / kpiData.length || 0}
              precision={1}
              suffix="%"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Performance Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  name="Performance Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Performance Radar">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar 
                  name="Performance" 
                  dataKey="value" 
                  stroke="#667eea" 
                  fill="#667eea" 
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Employee KPI Table */}
      <Card title="Employee Performance Metrics" style={{ marginBottom: 24 }}>
        <Table
          columns={kpiColumns}
          dataSource={kpiData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Recent Tasks */}
      <Card title={<><ClockCircleOutlined /> Recent Tasks</>}>
        <Table
          columns={taskColumns}
          dataSource={tasks}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default EmployeeKPIPage;
