import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Table,
  Form,
  Input,
  DatePicker,
  Select,
  Modal,
  message,
  Progress,
  Statistic,
  Tag,
  Space,
  Tabs,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  RiseOutlined,
  CheckOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../utils/permissions';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface DailyTask {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  hoursSpent: number;
  category: string;
  employeeId: string;
  employeeName: string;
  createdAt: string;
  completedAt?: string;
}

interface EmployeeKPI {
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  tasksCompleted: number;
  totalTasks: number;
  productivityScore: number;
  averageTaskTime: number;
  onTimeCompletion: number;
}

const MyKPIPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('my-tasks');

  // My tasks state
  const [myTasks, setMyTasks] = useState<DailyTask[]>([]);
  const [myKPI, setMyKPI] = useState<EmployeeKPI | null>(null);

  // Team tasks state (for managers)
  const [teamTasks, setTeamTasks] = useState<DailyTask[]>([]);
  const [teamKPIs, setTeamKPIs] = useState<EmployeeKPI[]>([]);

  const canViewAllKPI = hasPermission(user?.role as any, 'VIEW_ALL_KPI');

  useEffect(() => {
    fetchMyTasks();
    fetchMyKPI();
    if (canViewAllKPI) {
      fetchTeamTasks();
      fetchTeamKPIs();
    }
  }, [canViewAllKPI]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await taskService.getMyTasks();
      
      // Mock data for now
      const mockTasks: DailyTask[] = [
        {
          id: '1',
          date: dayjs().format('YYYY-MM-DD'),
          title: 'Complete React component',
          description: 'Implement user dashboard with charts',
          status: 'completed',
          priority: 'high',
          hoursSpent: 4,
          category: 'Development',
          employeeId: user?.id || '',
          employeeName: `${user?.firstName} ${user?.lastName}`,
          createdAt: dayjs().subtract(1, 'day').toISOString(),
          completedAt: dayjs().toISOString(),
        },
        {
          id: '2',
          date: dayjs().format('YYYY-MM-DD'),
          title: 'Team meeting',
          description: 'Sprint planning and retrospective',
          status: 'completed',
          priority: 'medium',
          hoursSpent: 2,
          category: 'Meeting',
          employeeId: user?.id || '',
          employeeName: `${user?.firstName} ${user?.lastName}`,
          createdAt: dayjs().toISOString(),
          completedAt: dayjs().toISOString(),
        },
        {
          id: '3',
          date: dayjs().format('YYYY-MM-DD'),
          title: 'Code review',
          description: 'Review pull requests from team members',
          status: 'in-progress',
          priority: 'high',
          hoursSpent: 1.5,
          category: 'Development',
          employeeId: user?.id || '',
          employeeName: `${user?.firstName} ${user?.lastName}`,
          createdAt: dayjs().toISOString(),
        },
      ];
      setMyTasks(mockTasks);
    } catch (error) {
      message.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyKPI = async () => {
    try {
      // TODO: Replace with actual API call
      const mockKPI: EmployeeKPI = {
        employeeId: user?.id || '',
        employeeName: `${user?.firstName} ${user?.lastName}`,
        designation: user?.designation || 'Employee',
        department: user?.department || 'General',
        tasksCompleted: 45,
        totalTasks: 52,
        productivityScore: 87,
        averageTaskTime: 3.5,
        onTimeCompletion: 92,
      };
      setMyKPI(mockKPI);
    } catch (error) {
      message.error('Failed to fetch KPI data');
    }
  };

  const fetchTeamTasks = async () => {
    try {
      // TODO: API call to fetch all team tasks
      setTeamTasks([]);
    } catch (error) {
      message.error('Failed to fetch team tasks');
    }
  };

  const fetchTeamKPIs = async () => {
    try {
      // TODO: API call to fetch team KPIs
      setTeamKPIs([]);
    } catch (error) {
      message.error('Failed to fetch team KPIs');
    }
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      status: 'pending',
      priority: 'medium',
      category: 'Development',
    });
    setTaskModalVisible(true);
  };

  const handleEditTask = (task: DailyTask) => {
    setSelectedTask(task);
    form.setFieldsValue({
      ...task,
      date: dayjs(task.date),
    });
    setTaskModalVisible(true);
  };

  const handleDeleteTask = async (_taskId: string) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          // TODO: API call to delete task
          message.success('Task deleted successfully');
          fetchMyTasks();
        } catch (error) {
          message.error('Failed to delete task');
        }
      },
    });
  };

  const handleSubmitTask = async () => {
    try {
      await form.validateFields();
      setLoading(true);

      // TODO: Replace with actual API call
      // const values = await form.validateFields();
      // const taskData = {
      //   ...values,
      //   date: values.date.format('YYYY-MM-DD'),
      //   employeeId: user?.id,
      //   employeeName: `${user?.firstName} ${user?.lastName}`,
      // };

      if (selectedTask) {
        // Update existing task
        message.success('Task updated successfully');
      } else {
        // Create new task
        message.success('Task added successfully');
      }

      setTaskModalVisible(false);
      form.resetFields();
      fetchMyTasks();
      fetchMyKPI();
    } catch (error) {
      message.error('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (_taskId: string) => {
    try {
      // TODO: API call to mark task as completed
      message.success('Task marked as completed');
      fetchMyTasks();
      fetchMyKPI();
    } catch (error) {
      message.error('Failed to update task status');
    }
  };

  const taskColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: DailyTask) => (
        <Space direction="vertical" size={0}>
          <Text strong>{title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag
          color={
            priority === 'high'
              ? 'red'
              : priority === 'medium'
              ? 'orange'
              : 'green'
          }
        >
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Hours',
      dataIndex: 'hoursSpent',
      key: 'hoursSpent',
      width: 80,
      render: (hours: number) => `${hours}h`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag
          icon={
            status === 'completed' ? (
              <CheckCircleOutlined />
            ) : (
              <ClockCircleOutlined />
            )
          }
          color={
            status === 'completed'
              ? 'success'
              : status === 'in-progress'
              ? 'processing'
              : 'default'
          }
        >
          {status.replace('-', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: DailyTask) => (
        <Space>
          {record.status !== 'completed' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleMarkComplete(record.id)}
              size="small"
            >
              Complete
            </Button>
          )}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTask(record)}
            size="small"
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record.id)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  const teamKPIColumns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (name: string, record: EmployeeKPI) => (
        <Space>
          <Avatar style={{ backgroundColor: '#667eea' }}>
            {name.charAt(0)}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong>{name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.designation}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 150,
    },
    {
      title: 'Tasks Completed',
      key: 'tasks',
      width: 150,
      render: (_: any, record: EmployeeKPI) => (
        <Space direction="vertical" size={0}>
          <Text>{`${record.tasksCompleted}/${record.totalTasks}`}</Text>
          <Progress
            percent={Math.round(
              (record.tasksCompleted / record.totalTasks) * 100
            )}
            size="small"
            showInfo={false}
          />
        </Space>
      ),
    },
    {
      title: 'Productivity Score',
      dataIndex: 'productivityScore',
      key: 'productivityScore',
      width: 150,
      render: (score: number) => (
        <Progress
          type="circle"
          percent={score}
          width={50}
          strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
        />
      ),
    },
    {
      title: 'On-Time %',
      dataIndex: 'onTimeCompletion',
      key: 'onTimeCompletion',
      width: 120,
      render: (percent: number) => (
        <Tag color={percent >= 90 ? 'success' : percent >= 70 ? 'warning' : 'error'}>
          {percent}%
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Title level={2} style={{ margin: 0 }}>
                    <TrophyOutlined /> {canViewAllKPI ? 'Team KPI Dashboard' : 'My KPI Dashboard'}
                  </Title>
                  <Text type="secondary">
                    {canViewAllKPI
                      ? 'Monitor team performance and productivity'
                      : 'Track your daily tasks and performance metrics'}
                  </Text>
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddTask}
                  size="large"
                >
                  Add Daily Task
                </Button>
              </div>

              {myKPI && (
                <Row gutter={16}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Tasks Completed"
                        value={myKPI.tasksCompleted}
                        suffix={`/ ${myKPI.totalTasks}`}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Productivity Score"
                        value={myKPI.productivityScore}
                        suffix="%"
                        prefix={<RiseOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                      <Progress
                        percent={myKPI.productivityScore}
                        showInfo={false}
                        strokeColor="#52c41a"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Avg Task Time"
                        value={myKPI.averageTaskTime}
                        suffix="hours"
                        prefix={<ClockCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="On-Time Completion"
                        value={myKPI.onTimeCompletion}
                        suffix="%"
                        prefix={<CheckOutlined />}
                        valueStyle={{
                          color: myKPI.onTimeCompletion >= 90 ? '#52c41a' : '#faad14',
                        }}
                      />
                    </Card>
                  </Col>
                </Row>
              )}
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'my-tasks',
                  label: 'My Tasks',
                  children: (
                    <Table
                      columns={taskColumns}
                      dataSource={myTasks}
                      rowKey="id"
                      loading={loading}
                      pagination={{ pageSize: 10 }}
                    />
                  ),
                },
                ...(canViewAllKPI
                  ? [
                      {
                        key: 'team-kpi',
                        label: 'Team Performance',
                        children: (
                          <Table
                            columns={teamKPIColumns}
                            dataSource={teamKPIs}
                            rowKey="employeeId"
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                          />
                        ),
                      },
                      {
                        key: 'team-tasks',
                        label: 'Team Tasks',
                        children: (
                          <Table
                            columns={taskColumns.filter(col => col.key !== 'actions')}
                            dataSource={teamTasks}
                            rowKey="id"
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                          />
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Task Modal */}
      <Modal
        title={selectedTask ? 'Edit Task' : 'Add Daily Task'}
        open={taskModalVisible}
        onOk={handleSubmitTask}
        onCancel={() => {
          setTaskModalVisible(false);
          form.resetFields();
        }}
        width={600}
        okText={selectedTask ? 'Update' : 'Add Task'}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="title"
            label="Task Title"
            rules={[{ required: true, message: 'Please enter task title' }]}
          >
            <Input placeholder="e.g., Complete feature implementation" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter task description' }]}
          >
            <TextArea
              rows={3}
              placeholder="Describe what you worked on..."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select>
                  <Select.Option value="Development">Development</Select.Option>
                  <Select.Option value="Design">Design</Select.Option>
                  <Select.Option value="Marketing">Marketing</Select.Option>
                  <Select.Option value="Meeting">Meeting</Select.Option>
                  <Select.Option value="Research">Research</Select.Option>
                  <Select.Option value="Testing">Testing</Select.Option>
                  <Select.Option value="Documentation">Documentation</Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select>
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hoursSpent"
                label="Hours Spent"
                rules={[{ required: true, message: 'Please enter hours spent' }]}
              >
                <Input type="number" step="0.5" min="0" suffix="hours" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select>
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="in-progress">In Progress</Select.Option>
                  <Select.Option value="completed">Completed</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MyKPIPage;
