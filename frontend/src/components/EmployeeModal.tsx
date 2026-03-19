import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, App } from 'antd';
import { Employee, employeeService, CreateEmployeeDto, UpdateEmployeeDto } from '../services/employee.service';
import { departmentService } from '../services/department.service';
import dayjs from 'dayjs';

const { Option } = Select;

interface EmployeeModalProps {
  visible: boolean;
  employee: Employee | null;
  employees: Employee[];
  onOk: () => void;
  onCancel: () => void;
}

const roles = [
  'CEO',
  'CTO',
  'CMO',
  'HR',
  'MANAGER',
  'DEVELOPER',
  'DESIGNER',
  'MARKETING',
  'RND',
  'EMPLOYEE',
  'STUDENT',
];

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  visible,
  employee,
  employees,
  onOk,
  onCancel,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      if (employee) {
        form.setFieldsValue({
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          designation: employee.designation,
          department: employee.department,
          role: employee.role,
          managerId: employee.managerId,
          joiningDate: employee.joiningDate ? dayjs(employee.joiningDate) : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, employee, form]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const loadDepartments = async () => {
      try {
        const data = await departmentService.getAll();
        setDepartments(data.map((department) => department.name));
      } catch (error) {
        message.error('Failed to load departments');
      }
    };

    void loadDepartments();
  }, [visible, message]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (employee) {
        // Update
        const updateDto: UpdateEmployeeDto = {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          designation: values.designation,
          department: values.department,
          role: values.role,
          managerId: values.managerId,
        };
        await employeeService.update(employee.id, updateDto);
        message.success('Employee updated successfully');
      } else {
        // Create
        const createDto: CreateEmployeeDto = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          designation: values.designation,
          department: values.department,
          role: values.role,
          managerId: values.managerId,
          joiningDate: values.joiningDate.format('YYYY-MM-DD'),
        };
        await employeeService.create(createDto);
        message.success('Employee created successfully');
      }

      onOk();
    } catch (error: any) {
      if (error.errorFields) {
        // Validation error
        return;
      }
      message.error(error.response?.data?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  // Filter out the current employee from manager options
  const managerOptions = employees.filter((emp) => emp.id !== employee?.id && emp.status === 'active');

  return (
    <Modal
      title={employee ? 'Edit Employee' : 'Add New Employee'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      okText={employee ? 'Update' : 'Create'}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          joiningDate: dayjs(),
          role: 'EMPLOYEE',
        }}
      >
        <Form.Item
          name="firstName"
          label="First Name"
          rules={[{ required: true, message: 'Please enter first name' }]}
        >
          <Input placeholder="Enter first name" />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Last Name"
          rules={[{ required: true, message: 'Please enter last name' }]}
        >
          <Input placeholder="Enter last name" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter valid email' },
          ]}
        >
          <Input placeholder="Enter email" disabled={!!employee} />
        </Form.Item>

        <Form.Item name="phone" label="Phone">
          <Input placeholder="Enter phone number" />
        </Form.Item>

        <Form.Item
          name="designation"
          label="Designation"
          rules={[{ required: true, message: 'Please enter designation' }]}
        >
          <Input placeholder="e.g. Senior Software Engineer" />
        </Form.Item>

        <Form.Item
          name="department"
          label="Department"
          rules={[{ required: true, message: 'Please select department' }]}
        >
          <Select
            placeholder="Select department"
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {departments.map((department) => (
              <Option key={department} value={department}>
                {department}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="role"
          label="Role"
          rules={[{ required: true, message: 'Please select role' }]}
        >
          <Select placeholder="Select role">
            {roles.map((role) => (
              <Option key={role} value={role}>
                {role}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="managerId" label="Reporting Manager">
          <Select
            placeholder="Select manager (optional)"
            allowClear
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {managerOptions.map((emp) => (
              <Option key={emp.id} value={emp.id}>
                {emp.fullName} - {emp.designation}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {!employee && (
          <Form.Item
            name="joiningDate"
            label="Joining Date"
            rules={[{ required: true, message: 'Please select joining date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default EmployeeModal;
