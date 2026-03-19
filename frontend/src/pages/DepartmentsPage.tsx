import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  CreateDepartmentDto,
  Department,
  DepartmentStatus,
  departmentService,
  UpdateDepartmentDto,
} from '../services/department.service';
import { Employee, employeeService } from '../services/employee.service';

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

interface DepartmentFormValues {
  name: string;
  code: string;
  description?: string;
  status: DepartmentStatus;
  hodProfileId?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  assignedStaffIds?: string[];
  assignedStudentIds?: string[];
}

const statusColors: Record<DepartmentStatus, string> = {
  active: 'success',
  inactive: 'warning',
  archived: 'default',
};

const DepartmentsPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [form] = Form.useForm<DepartmentFormValues>();
  const watchedDepartmentName = Form.useWatch('name', form);
  const watchedAssignedStaffIds = Form.useWatch('assignedStaffIds', form) || [];

  useEffect(() => {
    void loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    try {
      const [departmentsData, employeesData] = await Promise.all([
        departmentService.getAll(),
        employeeService.getAll(),
      ]);
      setDepartments(departmentsData);
      setEmployees(employeesData);
    } catch (error) {
      message.error('Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.status === 'active').length,
    [departments],
  );

  const totalStaff = useMemo(
    () => departments.reduce((sum, department) => sum + department.staffCount, 0),
    [departments],
  );

  const totalStudents = useMemo(
    () => departments.reduce((sum, department) => sum + department.studentCount, 0),
    [departments],
  );

  const departmentsWithoutHod = useMemo(
    () => departments.filter((department) => !department.headOfDepartment).length,
    [departments],
  );

  const targetDepartmentName = (watchedDepartmentName || editingDepartment?.name || '').trim().toLowerCase();
  const staffCandidates = employees.filter(
    (employee) => employee.status === 'active' && String(employee.role).toUpperCase() !== 'STUDENT',
  );
  const studentCandidates = employees.filter(
    (employee) => employee.status === 'active' && String(employee.role).toUpperCase() === 'STUDENT',
  );

  const eligibleHods = staffCandidates.filter((employee) => {
    if (watchedAssignedStaffIds.length > 0) {
      return watchedAssignedStaffIds.includes(employee.id);
    }

    return employee.department.trim().toLowerCase() === targetDepartmentName;
  });

  const openCreateModal = () => {
    setEditingDepartment(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setModalOpen(true);
  };

  const openEditModal = (department: Department) => {
    setEditingDepartment(department);
    form.setFieldsValue({
      name: department.name,
      code: department.code,
      description: department.description,
      status: department.status,
      hodProfileId: department.hodProfileId,
      contactEmail: department.contactEmail,
      contactPhone: department.contactPhone,
      location: department.location,
      assignedStaffIds: employees
        .filter(
          (employee) =>
            employee.department.trim().toLowerCase() === department.name.trim().toLowerCase() &&
            String(employee.role).toUpperCase() !== 'STUDENT',
        )
        .map((employee) => employee.id),
      assignedStudentIds: employees
        .filter(
          (employee) =>
            employee.department.trim().toLowerCase() === department.name.trim().toLowerCase() &&
            String(employee.role).toUpperCase() === 'STUDENT',
        )
        .map((employee) => employee.id),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDepartment(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = normalizeDepartmentPayload(values);

      if (editingDepartment) {
        const updatePayload: UpdateDepartmentDto = payload;
        await departmentService.update(editingDepartment.id, updatePayload);
        message.success('Department updated successfully');
      } else {
        const createPayload: CreateDepartmentDto = payload;
        await departmentService.create(createPayload);
        message.success('Department created successfully');
      }

      closeModal();
      await loadPageData();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }

      message.error(error.response?.data?.message || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (department: Department) => {
    modal.confirm({
      title: 'Delete Department',
      content: `Delete ${department.name}? This only works when no employees are assigned to it.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await departmentService.delete(department.id);
          message.success('Department deleted successfully');
          await loadPageData();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Failed to delete department');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Department',
      key: 'department',
      render: (_: unknown, record: Department) => (
        <div className="department-cell">
          <div className="department-cell__header">
            <div className="department-cell__title-group">
              <Text strong className="department-cell__title">
                {record.name}
              </Text>
              <Text type="secondary" className="department-cell__code">
                {record.code}
              </Text>
            </div>
            <div className="department-cell__meta">
              <Tag bordered={false} className="department-chip">
                {record.programCount} programs
              </Tag>
              <Tag bordered={false} className="department-chip department-chip--muted">
                {record.subjectCount} subjects
              </Tag>
            </div>
          </div>
          <Paragraph
            ellipsis={{ rows: 2, expandable: false }}
            className="department-cell__description"
          >
            {record.description || 'Department profile is ready for academic structure and operations setup.'}
          </Paragraph>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: DepartmentStatus) => (
        <Tag color={statusColors[status]} className="department-status-tag">
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'HOD',
      key: 'hod',
      render: (_: unknown, record: Department) =>
        record.headOfDepartment ? (
          <div className="department-person">
            <Avatar className="department-person__avatar">
              {record.headOfDepartment.fullName.charAt(0)}
            </Avatar>
            <div className="department-person__content">
              <Text className="department-person__name">{record.headOfDepartment.fullName}</Text>
              <Text type="secondary" className="department-person__role">
                {record.headOfDepartment.designation}
              </Text>
            </div>
          </div>
        ) : (
          <Tag color="warning">Unassigned</Tag>
        ),
    },
    {
      title: 'People',
      key: 'people',
      render: (_: unknown, record: Department) => (
        <div className="department-people">
          <div className="department-people__metric">
            <Text className="department-people__label">Staff</Text>
            <Text strong>{record.staffCount}</Text>
          </div>
          <div className="department-people__metric">
            <Text className="department-people__label">Students</Text>
            <Text strong>{record.studentCount}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: unknown, record: Department) => (
        <div className="department-contact">
          <div className="department-contact__line">
            <MailOutlined />
            <Text>{record.contactEmail || '-'}</Text>
          </div>
          <div className="department-contact__line">
            <PhoneOutlined />
            <Text type="secondary">{record.contactPhone || record.location || '-'}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value: string) => (
        <div className="department-updated">
          <Text>{dayjs(value).format('DD MMM YYYY')}</Text>
          <Text type="secondary">{dayjs(value).format('hh:mm A')}</Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 170,
      render: (_: unknown, record: Department) => (
        <Space className="department-actions">
          <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/departments/${record.id}`)} />
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            disabled={record.employeeCount > 0}
          />
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="departments-page">
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="departments-metric-card departments-metric-card--primary">
                <Statistic title="Total Departments" value={departments.length} prefix={<ApartmentOutlined />} />
                <Text type="secondary">Academic units currently active in the ERP workspace.</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="departments-metric-card">
                <Statistic title="Active Departments" value={activeDepartments} prefix={<TeamOutlined />} />
                <Text type="secondary">Departments available for assignments, programs, and daily operations.</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="departments-metric-card">
                <Statistic title="Staff Assigned" value={totalStaff} prefix={<UserSwitchOutlined />} />
                <Text type="secondary">Teaching and admin staff currently mapped under departments.</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="departments-metric-card">
                <Statistic title="Students Assigned" value={totalStudents} prefix={<TeamOutlined />} />
                <Text type="secondary">Students already connected to their academic home departments.</Text>
              </Card>
            </Col>
          </Row>

          <Card
            className="departments-oversight-card"
            title={
              <div className="departments-oversight-card__title">
                <Text strong>Department Oversight</Text>
                <Text type="secondary">Review leadership, contact coverage, and member distribution.</Text>
              </div>
            }
            extra={
              <Space>
                <Tag
                  color={departmentsWithoutHod > 0 ? 'warning' : 'success'}
                  className="departments-oversight-card__alert"
                >
                  {departmentsWithoutHod} without HOD
                </Tag>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                  Add Department
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={departments}
              rowKey="id"
              loading={loading}
              className="departments-table"
              rowClassName={() => 'departments-table__row'}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} departments`,
              }}
              locale={{
                emptyText: 'No departments created yet',
              }}
            />
          </Card>
        </Space>

        <Modal
          title={editingDepartment ? 'Edit Department' : 'Create Department'}
          open={modalOpen}
          onOk={() => void handleSubmit()}
          onCancel={closeModal}
          confirmLoading={submitting}
          okText={editingDepartment ? 'Update' : 'Create'}
          width={720}
        >
          <Form form={form} layout="vertical" initialValues={{ status: 'active' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Department Name"
                  rules={[
                    { required: true, message: 'Please enter a department name' },
                    { min: 2, message: 'Department name must be at least 2 characters' },
                  ]}
                >
                  <Input placeholder="e.g. Science Department" maxLength={100} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label="Department Code"
                  rules={[
                    { required: true, message: 'Please enter a department code' },
                    {
                      pattern: /^[A-Z0-9_-]+$/,
                      message: 'Use uppercase letters, numbers, hyphens, or underscores only',
                    },
                  ]}
                >
                  <Input
                    placeholder="e.g. SCI"
                    maxLength={20}
                    onChange={(event) => {
                      form.setFieldValue('code', event.target.value.toUpperCase());
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select a status' }]}>
                  <Select
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'Inactive', value: 'inactive' },
                      { label: 'Archived', value: 'archived' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="hodProfileId" label="Head of Department">
                  <Select
                    allowClear
                    placeholder={eligibleHods.length > 0 ? 'Select HOD' : 'No matching active employees in this department yet'}
                    options={eligibleHods.map((employee) => ({
                      label: `${employee.fullName} - ${employee.designation}`,
                      value: employee.id,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Description">
              <TextArea rows={3} maxLength={500} placeholder="Department purpose, goals, and responsibilities" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="contactEmail" label="Contact Email" rules={[{ type: 'email', message: 'Enter a valid email address' }]}>
                  <Input placeholder="department@school.edu" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="contactPhone" label="Contact Phone">
                  <Input placeholder="+91 9876543210" maxLength={30} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="location" label="Location">
                  <Input placeholder="Block A, First Floor" maxLength={120} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="assignedStaffIds" label="Assign Staff">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Select teachers / staff"
                    options={staffCandidates.map((employee) => ({
                      label: `${employee.fullName} - ${employee.designation} (${employee.department})`,
                      value: employee.id,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="assignedStudentIds" label="Assign Students">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Select students"
                    options={studentCandidates.map((employee) => ({
                      label: `${employee.fullName} - ${employee.employeeId}`,
                      value: employee.id,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

function normalizeDepartmentPayload(values: DepartmentFormValues): DepartmentFormValues {
  return {
    name: values.name.trim().replace(/\s+/g, ' '),
    code: values.code.trim().toUpperCase(),
    description: values.description?.trim() || undefined,
    status: values.status,
    hodProfileId: values.hodProfileId || undefined,
    contactEmail: values.contactEmail?.trim().toLowerCase() || undefined,
    contactPhone: values.contactPhone?.trim() || undefined,
    location: values.location?.trim() || undefined,
    assignedStaffIds: values.assignedStaffIds || [],
    assignedStudentIds: values.assignedStudentIds || [],
  };
}

export default DepartmentsPage;
