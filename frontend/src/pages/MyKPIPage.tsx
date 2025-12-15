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
  App,
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
  SendOutlined,
  StarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../utils/permissions';
import { employeeTaskService } from '../services/employee-task.service';
import { employeeService, Employee } from '../services/employee.service';
import TaskSubmitModal, { SubmitTaskData } from '../components/TaskSubmitModal';
import TaskApprovalModal, { ApprovalData } from '../components/TaskApprovalModal';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface DailyTask {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'submitted' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  hoursSpent: number;
  category: string;
  employeeId: string;
  employeeName: string;
  createdAt: string;
  completedAt?: string;
  // KPI Scoring fields
  estimatedHours?: number;
  actualHours?: number;
  startedAt?: string;
  complexity?: 'trivial' | 'small' | 'medium' | 'complex' | 'critical';
  proofs?: any[];
  autoChecks?: any;
  requiredChecks?: number;
  peerReviews?: any[];
  qualityScore?: number;
  penaltyPct?: number;
  taskScore?: number;
  managerApproved?: boolean;
  managerApprovedAt?: string;
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
  const { message } = App.useApp();
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
  const [employees, setEmployees] = useState<Employee[]>([]);

  // New modal states for submit/approve
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [taskForSubmit, setTaskForSubmit] = useState<DailyTask | null>(null);
  const [taskForApproval, setTaskForApproval] = useState<DailyTask | null>(null);

  const canViewAllKPI = hasPermission(user?.role as any, 'VIEW_ALL_KPI');

  useEffect(() => {
    fetchMyTasks();
    fetchMyKPI();
    fetchEmployees();
    if (canViewAllKPI) {
      fetchTeamTasks();
      fetchTeamKPIs();
    }
  }, [canViewAllKPI]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const tasks = await employeeTaskService.getMyTasks();
      
      // Map API response to component interface
      const mappedTasks: DailyTask[] = tasks.map(task => ({
        id: task.id,
        date: task.date,
        title: task.title,
        description: task.description || '',
        status: (task.status === 'in_progress' ? 'in-progress' : task.status === 'cancelled' ? 'rejected' : task.status) as DailyTask['status'],
        priority: task.priority,
        hoursSpent: task.hoursSpent,
        category: task.category || 'Other',
        employeeId: task.userId,
        employeeName: task.user ? `${task.user.firstName} ${task.user.lastName}` : 'Unknown',
        createdAt: new Date().toISOString(),
        completedAt: task.completedAt,
      }));
      
      setMyTasks(mappedTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      message.error('Failed to fetch tasks');
      setMyTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data.filter(emp => emp.status === 'active'));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchMyKPI = async () => {
    try {
      const kpiData = await employeeTaskService.getMyKPI();
      
      const mappedKPI: EmployeeKPI = {
        employeeId: user?.id || '',
        employeeName: `${user?.firstName} ${user?.lastName}`,
        designation: user?.designation || 'Employee',
        department: user?.department || 'General',
        tasksCompleted: kpiData.completedTasks,
        totalTasks: kpiData.totalTasks,
        productivityScore: Math.round(kpiData.completionRate),
        averageTaskTime: kpiData.averageHoursPerTask,
        onTimeCompletion: Math.round(kpiData.completionRate),
      };
      setMyKPI(mappedKPI);
    } catch (error) {
      console.error('Failed to fetch KPI data:', error);
      message.error('Failed to fetch KPI data');
    }
  };

  const fetchTeamTasks = async () => {
    try {
      const tasks = await employeeTaskService.getTeamTasks();
      
      // Map API response to component interface
      const mappedTasks: DailyTask[] = tasks.map(task => ({
        id: task.id,
        date: task.date,
        title: task.title,
        description: task.description || '',
        status: (task.status === 'in_progress' ? 'in-progress' : task.status === 'cancelled' ? 'rejected' : task.status) as DailyTask['status'],
        priority: task.priority,
        hoursSpent: task.hoursSpent,
        category: task.category || 'Other',
        employeeId: task.userId,
        employeeName: task.user ? `${task.user.firstName} ${task.user.lastName}` : 'Unknown',
        createdAt: new Date().toISOString(),
        completedAt: task.completedAt,
      }));
      
      setTeamTasks(mappedTasks);
    } catch (error) {
      console.error('Failed to fetch team tasks:', error);
      message.error('Failed to fetch team tasks');
      setTeamTasks([]);
    }
  };

  const fetchTeamKPIs = async () => {
    try {
      const teamData = await employeeTaskService.getTeamKPI();
      
      // Map team KPI data
      const mappedKPIs: EmployeeKPI[] = teamData.employeeStats.map(emp => ({
        employeeId: '',
        employeeName: emp.name,
        designation: 'Employee',
        department: 'General',
        tasksCompleted: emp.completedTasks,
        totalTasks: emp.totalTasks,
        productivityScore: Math.round(emp.completionRate),
        averageTaskTime: emp.totalHours / (emp.totalTasks || 1),
        onTimeCompletion: Math.round(emp.completionRate),
      }));
      
      setTeamKPIs(mappedKPIs);
    } catch (error) {
      console.error('Failed to fetch team KPIs:', error);
      message.error('Failed to fetch team KPIs');
      setTeamKPIs([]);
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
      complexity: 'medium',
      estimatedHours: 4,
      employeeId: user?.id, // Default to current user
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
          if (canViewAllKPI) fetchTeamTasks();
        } catch (error) {
          message.error('Failed to delete task');
        }
      },
    });
  };

  // New handlers for Submit and Approve
  const handleSubmitForApproval = (task: DailyTask) => {
    setTaskForSubmit(task);
    setSubmitModalVisible(true);
  };

  const handleSubmitTaskConfirm = async (submitData: SubmitTaskData) => {
    if (!taskForSubmit) return;

    try {
      setLoading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('taskId', taskForSubmit.id);
      formData.append('actualHours', submitData.actualHours.toString());
      formData.append('notes', submitData.notes);

      // Add proof files
      submitData.proofs.forEach((file) => {
        if (file.originFileObj) {
          formData.append('proofs', file.originFileObj);
        }
      });

      // TODO: Call API to submit task
      // await employeeTaskService.submitTask(taskForSubmit.id, formData);

      message.success('Task submitted for manager approval');
      setSubmitModalVisible(false);
      setTaskForSubmit(null);
      fetchMyTasks();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to submit task');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTask = (task: DailyTask) => {
    setTaskForApproval(task);
    setApprovalModalVisible(true);
  };

  const handleApproveTaskConfirm = async (approvalData: ApprovalData) => {
    if (!taskForApproval) return;

    try {
      setLoading(true);

      // TODO: Call API to approve task
      // await employeeTaskService.approveTask(taskForApproval.id, {
      //   approved: true,
      //   qualityScore: approvalData.qualityScore,
      //   feedback: approvalData.feedback,
      // });
      console.log('Approving with data:', approvalData);

      message.success('Task approved successfully');
      setApprovalModalVisible(false);
      setTaskForApproval(null);
      fetchTeamTasks();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to approve task');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTaskConfirm = async (feedback: string) => {
    if (!taskForApproval) return;

    try {
      setLoading(true);

      // TODO: Call API to reject task
      // await employeeTaskService.approveTask(taskForApproval.id, {
      //   approved: false,
      //   feedback,
      // });
      console.log('Rejecting with feedback:', feedback);

      message.warning('Task rejected and returned to employee');
      setApprovalModalVisible(false);
      setTaskForApproval(null);
      fetchTeamTasks();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to reject task');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTask = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const taskData = {
        userId: values.employeeId, // Assign to selected employee
        title: values.title,
        description: values.description,
        date: values.date.format('YYYY-MM-DD'),
        category: values.category,
        priority: values.priority || 'medium',
        hoursSpent: Number(values.hoursSpent) || 0,
        estimatedHours: Number(values.estimatedHours) || 0,
        status: 'pending' as const,
      };

      if (selectedTask) {
        // Update existing task
        await employeeTaskService.updateTask(selectedTask.id, taskData);
        message.success('Task updated successfully');
      } else {
        // Create new task
        await employeeTaskService.createTask(taskData);
        message.success('Task added successfully');
      }

      setTaskModalVisible(false);
      setSelectedTask(null);
      form.resetFields();
      
      // Refresh only task lists to prevent loop
      fetchMyTasks();
      if (canViewAllKPI) {
        fetchTeamTasks();
      }
      // KPI will be refreshed on next page load or manual refresh
    } catch (error: any) {
      console.error('Failed to save task:', error);
      message.error(error?.response?.data?.message || 'Failed to save task');
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
      render: (status: string, record: DailyTask) => {
        let displayStatus = status;
        let icon = <ClockCircleOutlined />;
        let color = 'default';

        if (status === 'completed') {
          displayStatus = record.managerApproved ? 'Approved' : 'Completed';
          icon = <CheckCircleOutlined />;
          color = record.managerApproved ? 'success' : 'processing';
        } else if (status === 'submitted') {
          displayStatus = 'Pending Approval';
          icon = <ClockCircleOutlined />;
          color = 'warning';
        } else if (status === 'in-progress') {
          displayStatus = 'In Progress';
          icon = <ClockCircleOutlined />;
          color = 'processing';
        }

        return (
          <Tag icon={icon} color={color}>
            {displayStatus.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: DailyTask) => (
        <Space>
          {/* Show Submit button for completed but not submitted tasks */}
          {record.status === 'completed' && !record.managerApproved && (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleSubmitForApproval(record)}
            >
              Submit
            </Button>
          )}

          {/* Show Approve button for managers on submitted tasks */}
          {canViewAllKPI && record.status === 'submitted' && (
            <Button
              type="primary"
              size="small"
              icon={<StarOutlined />}
              onClick={() => handleApproveTask(record)}
            >
              Review
            </Button>
          )}

          {/* Show Complete button for non-completed tasks */}
          {record.status !== 'completed' && record.status !== 'submitted' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleMarkComplete(record.id)}
              size="small"
            >
              Complete
            </Button>
          )}

          {/* Edit/Delete only for non-submitted/approved tasks */}
          {!record.managerApproved && record.status !== 'submitted' && (
            <>
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
            </>
          )}
        </Space>
      ),
    },
  ];

  const kpiColumns = [
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
                      scroll={{ x: 'max-content' }}
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
                            columns={kpiColumns}
                            dataSource={teamKPIs}
                            rowKey="employeeId"
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                            scroll={{ x: 'max-content' }}
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
                            scroll={{ x: 'max-content' }}
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
            name="employeeId"
            label="Assign To"
            rules={[{ required: true, message: 'Please select employee' }]}
          >
            <Select 
              placeholder="Select employee"
              showSearch
              filterOption={(input, option) => {
                const label = typeof option?.children === 'string'
                  ? option.children
                  : (React.isValidElement(option?.children) && typeof (option.children as any).props?.children === 'string')
                    ? (option.children as any).props.children
                    : '';
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              <Select.Option value={user?.id}>
                {`${user?.firstName} ${user?.lastName}`} (Me)
              </Select.Option>
              {employees.map((emp) => (
                <Select.Option key={emp.id} value={emp.id}>
                  {emp.fullName} - {emp.designation}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

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
                name="complexity"
                label="Complexity"
                rules={[{ required: true, message: 'Please select complexity' }]}
                initialValue="medium"
              >
                <Select>
                  <Select.Option value="trivial">Trivial (0.8x)</Select.Option>
                  <Select.Option value="small">Small (1.0x)</Select.Option>
                  <Select.Option value="medium">Medium (1.2x)</Select.Option>
                  <Select.Option value="complex">Complex (1.4x)</Select.Option>
                  <Select.Option value="critical">Critical (1.6x)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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
            <Col span={12}>
              <Form.Item
                name="estimatedHours"
                label="Estimated Hours"
                rules={[{ required: true, message: 'Please enter estimated hours' }]}
              >
                <Input type="number" min={0.25} step={0.25} placeholder="e.g., 4" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hoursSpent"
                label="Actual Hours Spent"
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

      {/* Task Submit Modal (with proof upload) */}
      {taskForSubmit && (
        <TaskSubmitModal
          visible={submitModalVisible}
          id={taskForSubmit.id}
          taskTitle={taskForSubmit.title}
          estimatedHours={taskForSubmit.estimatedHours || 0}
          complexity={taskForSubmit.complexity || 'medium'}
          onOk={handleSubmitTaskConfirm}
          onCancel={() => {
            setSubmitModalVisible(false);
            setTaskForSubmit(null);
          }}
        />
      )}

      {/* Task Approval Modal (for managers) */}
      {taskForApproval && (
        <TaskApprovalModal
          visible={approvalModalVisible}
          task={taskForApproval}
          onApprove={handleApproveTaskConfirm}
          onReject={handleRejectTaskConfirm}
          onCancel={() => {
            setApprovalModalVisible(false);
            setTaskForApproval(null);
          }}
        />
      )}
    </div>
  );
};

export default MyKPIPage;
