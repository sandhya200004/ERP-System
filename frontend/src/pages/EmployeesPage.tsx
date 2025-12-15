import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Tag,
  Avatar,
  App,
  Select,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Employee, employeeService } from '../services/employee.service';
import EmployeeModal from '../components/EmployeeModal';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const EmployeesPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>();
  const [roleFilter, setRoleFilter] = useState<string | undefined>();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchText, departmentFilter, roleFilter]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (error) {
      message.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.fullName.toLowerCase().includes(search) ||
          emp.email.toLowerCase().includes(search) ||
          emp.employeeId.toLowerCase().includes(search) ||
          emp.designation.toLowerCase().includes(search)
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter((emp) => emp.department === departmentFilter);
    }

    if (roleFilter) {
      filtered = filtered.filter((emp) => emp.role === roleFilter);
    }

    setFilteredEmployees(filtered);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setModalVisible(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalVisible(true);
  };

  const handleDelete = (employee: Employee) => {
    modal.confirm({
      title: 'Delete Employee',
      content: `Are you sure you want to deactivate ${employee.fullName}?`,
      okText: 'Yes, Deactivate',
      okType: 'danger',
      onOk: async () => {
        try {
          await employeeService.delete(employee.id);
          message.success('Employee deactivated successfully');
          fetchEmployees();
        } catch (error) {
          message.error('Failed to deactivate employee');
        }
      },
    });
  };

  const handleModalOk = async () => {
    await fetchEmployees();
    setModalVisible(false);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      CEO: 'red',
      CTO: 'orange',
      CMO: 'orange',
      HR: 'blue',
      MANAGER: 'purple',
      DEVELOPER: 'green',
      DESIGNER: 'cyan',
      MARKETING: 'magenta',
      RND: 'geekblue',
      EMPLOYEE: 'default',
    };
    return colors[role] || 'default';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'error';
  };

  const uniqueDepartments = Array.from(new Set(employees.map((e) => e.department)));
  const uniqueRoles = Array.from(new Set(employees.map((e) => e.role)));

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      width: 250,
      render: (_: any, record: Employee) => (
        <Space>
          <Avatar size="large" icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.fullName}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.employeeId}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      filters: uniqueDepartments.map((dept) => ({ text: dept, value: dept })),
      onFilter: (value: any, record: Employee) => record.department === value,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color={getRoleColor(role)}>{role}</Tag>,
      filters: uniqueRoles.map((role) => ({ text: role, value: role })),
      onFilter: (value: any, record: Employee) => record.role === value,
    },
    {
      title: 'Manager',
      dataIndex: 'managerName',
      key: 'managerName',
      render: (manager: string) => manager || '-',
    },
    {
      title: 'Joining Date',
      dataIndex: 'joiningDate',
      key: 'joiningDate',
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: Employee) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="View Team">
            <Button
              type="text"
              icon={<TeamOutlined />}
              disabled={!record.managerId}
            />
          </Tooltip>
          <Tooltip title="Deactivate">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <TeamOutlined style={{ fontSize: 24 }} />
            <span style={{ fontSize: 20, fontWeight: 600 }}>Employee Management</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Employee
          </Button>
        }
      >
        <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical" size="middle">
          <Space wrap>
            <Search
              placeholder="Search by name, email, ID, or designation"
              allowClear
              style={{ width: 400 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
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
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredEmployees}
          loading={loading}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} employees`,
          }}
        />
      </Card>

      <EmployeeModal
        visible={modalVisible}
        employee={selectedEmployee}
        employees={employees}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      />
    </div>
  );
};

export default EmployeesPage;
