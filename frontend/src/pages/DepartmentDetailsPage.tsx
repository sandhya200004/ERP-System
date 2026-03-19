import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  BulkRegistrationResult,
  Department,
  DepartmentProgram,
  DepartmentSubject,
  DepartmentStatus,
  CreateDepartmentProgramDto,
  CreateDepartmentSubjectDto,
  CreateCurriculumSubjectDto,
  CreateStudentEnrollmentDto,
  CreateStudentSubjectRegistrationDto,
  CreateProgramSemesterDto,
  CurriculumStatus,
  CurriculumSubject,
  departmentService,
  EnrollmentStatus,
  ProgramLevel,
  ProgramSemester,
  ProgramStatus,
  RegistrationStatus,
  SemesterStatus,
  StudentEnrollment,
  StudentSubjectRegistration,
  SubjectStatus,
  SubjectType,
  UpdateDepartmentProgramDto,
  UpdateDepartmentDto,
  UpdateCurriculumSubjectDto,
  UpdateStudentEnrollmentDto,
  UpdateStudentSubjectRegistrationDto,
  UpdateProgramSemesterDto,
  UpdateDepartmentSubjectDto,
} from '../services/department.service';
import { Employee, employeeService } from '../services/employee.service';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface DepartmentSettingsValues {
  name: string;
  code: string;
  description?: string;
  status: DepartmentStatus;
  hodProfileId?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
}

interface DepartmentSubjectFormValues {
  name: string;
  code: string;
  description?: string;
  type: SubjectType;
  status: SubjectStatus;
  teacherProfileId?: string;
}

interface DepartmentProgramFormValues {
  name: string;
  code: string;
  level: ProgramLevel;
  durationSemesters: number;
  intakeCapacity?: number;
  status: ProgramStatus;
  coordinatorProfileId?: string;
}

interface ProgramSemesterFormValues {
  semesterNumber: number;
  section?: string;
  academicYear?: string;
  studentCapacity?: number;
  status: SemesterStatus;
  advisorProfileId?: string;
}

interface CurriculumFormValues {
  subjectId: string;
  facultyProfileId?: string;
  academicYear?: string;
  credits: number;
  theoryHours: number;
  labHours: number;
  internalWeightage: number;
  externalWeightage: number;
  isElective?: string;
  status: CurriculumStatus;
}

interface EnrollmentFormValues {
  studentProfileId: string;
  programId: string;
  semesterId: string;
  rollNumber?: string;
  academicYear?: string;
  admissionDate?: string;
  status: EnrollmentStatus;
}

interface RegistrationFormValues {
  enrollmentId: string;
  curriculumSubjectId: string;
  registrationDate?: string;
  status: RegistrationStatus;
  isAutoRegistered?: string;
}

const statusColors: Record<DepartmentStatus, string> = {
  active: 'success',
  inactive: 'warning',
  archived: 'default',
};

const DepartmentDetailsPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [department, setDepartment] = useState<Department | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [registrations, setRegistrations] = useState<StudentSubjectRegistration[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [updatingMembers, setUpdatingMembers] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [savingSubject, setSavingSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<DepartmentSubject | null>(null);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const [editingProgram, setEditingProgram] = useState<DepartmentProgram | null>(null);
  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const [savingSemester, setSavingSemester] = useState(false);
  const [editingSemester, setEditingSemester] = useState<ProgramSemester | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<DepartmentProgram | null>(null);
  const [curriculumModalOpen, setCurriculumModalOpen] = useState(false);
  const [savingCurriculum, setSavingCurriculum] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<CurriculumSubject | null>(null);
  const [selectedCurriculumProgramId, setSelectedCurriculumProgramId] = useState<string | null>(null);
  const [selectedCurriculumSemesterId, setSelectedCurriculumSemesterId] = useState<string | null>(null);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [savingEnrollment, setSavingEnrollment] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<StudentEnrollment | null>(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [savingRegistration, setSavingRegistration] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<StudentSubjectRegistration | null>(null);
  const [processingAutoRegistration, setProcessingAutoRegistration] = useState(false);
  const [selectedAutoEnrollmentId, setSelectedAutoEnrollmentId] = useState<string>();
  const [selectedAutoSemesterId, setSelectedAutoSemesterId] = useState<string>();
  const [pendingStaffIds, setPendingStaffIds] = useState<string[]>([]);
  const [pendingStudentIds, setPendingStudentIds] = useState<string[]>([]);
  const [form] = Form.useForm<DepartmentSettingsValues>();
  const [subjectForm] = Form.useForm<DepartmentSubjectFormValues>();
  const [programForm] = Form.useForm<DepartmentProgramFormValues>();
  const [semesterForm] = Form.useForm<ProgramSemesterFormValues>();
  const [curriculumForm] = Form.useForm<CurriculumFormValues>();
  const [enrollmentForm] = Form.useForm<EnrollmentFormValues>();
  const [registrationForm] = Form.useForm<RegistrationFormValues>();
  const selectedEnrollmentProgramId = Form.useWatch('programId', enrollmentForm);
  const selectedRegistrationEnrollmentId = Form.useWatch('enrollmentId', registrationForm);

  useEffect(() => {
    if (!id) {
      return;
    }

    void loadPageData(id);
  }, [id]);

  const loadPageData = async (departmentId: string) => {
    setLoading(true);
    try {
      const [departmentData, employeesData, enrollmentsData, registrationsData] = await Promise.all([
        departmentService.getById(departmentId),
        employeeService.getAll(),
        departmentService.getEnrollments(departmentId),
        departmentService.getRegistrations(departmentId),
      ]);

      setDepartment(departmentData);
      setEmployees(employeesData);
      setEnrollments(enrollmentsData);
      setRegistrations(registrationsData);
      form.setFieldsValue({
        name: departmentData.name,
        code: departmentData.code,
        description: departmentData.description,
        status: departmentData.status,
        hodProfileId: departmentData.hodProfileId,
        contactEmail: departmentData.contactEmail,
        contactPhone: departmentData.contactPhone,
        location: departmentData.location,
      });
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to load department details');
      navigate('/departments');
    } finally {
      setLoading(false);
    }
  };

  const departmentMembers = useMemo(() => {
    if (!department) {
      return [];
    }

    const normalizedName = department.name.trim().toLowerCase();
    return employees.filter(
      (employee) => employee.department.trim().toLowerCase() === normalizedName,
    );
  }, [department, employees]);

  const staffMembers = useMemo(
    () => departmentMembers.filter((employee) => String(employee.role).toUpperCase() !== 'STUDENT'),
    [departmentMembers],
  );

  const studentMembers = useMemo(
    () => departmentMembers.filter((employee) => String(employee.role).toUpperCase() === 'STUDENT'),
    [departmentMembers],
  );

  const staffCandidates = useMemo(
    () =>
      employees.filter(
        (employee) => employee.status === 'active' && String(employee.role).toUpperCase() !== 'STUDENT',
      ),
    [employees],
  );

  const studentCandidates = useMemo(
    () =>
      employees.filter(
        (employee) => employee.status === 'active' && String(employee.role).toUpperCase() === 'STUDENT',
      ),
    [employees],
  );

  const currentStaffIds = useMemo(() => staffMembers.map((employee) => employee.id), [staffMembers]);
  const currentStudentIds = useMemo(() => studentMembers.map((employee) => employee.id), [studentMembers]);
  const subjects = department?.subjects || [];
  const programs = department?.programs || [];
  const curriculumItems = programs.flatMap((program) =>
    program.semesters.flatMap((semester) =>
      semester.curriculum.map((item) => ({
        ...item,
        programId: item.programId || program.id,
        programName: item.programName || program.name,
        semesterNumber: item.semesterNumber || semester.semesterNumber,
        section: item.section || semester.section,
      })),
    ),
  );
  const studentProfiles = studentMembers;

  const staffColumns = [
    {
      title: 'Staff Member',
      key: 'staffMember',
      render: (_: unknown, record: Employee) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.fullName}</Text>
          <Text type="secondary">{record.employeeId}</Text>
        </Space>
      ),
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag>{role}</Tag>,
    },
    {
      title: 'Current Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Employee) => (
        <Button
          danger
          type="link"
          onClick={() => void updateMembers(currentStaffIds.filter((memberId) => memberId !== record.id), currentStudentIds)}
        >
          Unassign
        </Button>
      ),
    },
  ];

  const studentColumns = [
    {
      title: 'Student',
      key: 'student',
      render: (_: unknown, record: Employee) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.fullName}</Text>
          <Text type="secondary">{record.employeeId}</Text>
        </Space>
      ),
    },
    {
      title: 'Program / Designation',
      dataIndex: 'designation',
      key: 'designation',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === 'active' ? 'success' : 'default'}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Current Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Employee) => (
        <Button
          danger
          type="link"
          onClick={() => void updateMembers(currentStaffIds, currentStudentIds.filter((memberId) => memberId !== record.id))}
        >
          Unassign
        </Button>
      ),
    },
  ];

  const subjectColumns = [
    {
      title: 'Subject',
      key: 'subject',
      render: (_: unknown, record: DepartmentSubject) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary">{record.code}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: SubjectType) => <Tag color="blue">{type.toUpperCase()}</Tag>,
    },
    {
      title: 'Teacher',
      key: 'teacher',
      render: (_: unknown, record: DepartmentSubject) =>
        record.teacher ? (
          <Space direction="vertical" size={0}>
            <Text>{record.teacher.fullName}</Text>
            <Text type="secondary">{record.teacher.designation}</Text>
          </Space>
        ) : (
          <Tag color="default">Unassigned</Tag>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: SubjectStatus) => (
        <Tag color={status === 'active' ? 'success' : status === 'inactive' ? 'warning' : 'default'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: unknown, record: DepartmentSubject) => (
        <Space>
          <Button type="link" onClick={() => openSubjectModal(record)}>
            Edit
          </Button>
          <Button danger type="link" onClick={() => handleDeleteSubject(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const programColumns = [
    {
      title: 'Program',
      key: 'program',
      render: (_: unknown, record: DepartmentProgram) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary">{record.code}</Text>
        </Space>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: (level: ProgramLevel) => <Tag color="geekblue">{level.toUpperCase()}</Tag>,
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: unknown, record: DepartmentProgram) => `${record.durationSemesters} semesters`,
    },
    {
      title: 'Coordinator',
      key: 'coordinator',
      render: (_: unknown, record: DepartmentProgram) =>
        record.coordinator ? record.coordinator.fullName : <Tag color="default">Unassigned</Tag>,
    },
    {
      title: 'Semesters',
      key: 'semesters',
      render: (_: unknown, record: DepartmentProgram) => record.semesterCount,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_: unknown, record: DepartmentProgram) => (
        <Space>
          <Button type="link" onClick={() => openProgramModal(record)}>
            Edit
          </Button>
          <Button type="link" onClick={() => openSemesterModal(record)}>
            Add Semester
          </Button>
          <Button danger type="link" onClick={() => handleDeleteProgram(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const semesterColumns = [
    {
      title: 'Program',
      key: 'program',
      render: (_: unknown, record: ProgramSemester & { programName: string; programId: string }) => record.programName,
    },
    {
      title: 'Semester',
      key: 'semester',
      render: (_: unknown, record: ProgramSemester) => `Semester ${record.semesterNumber}`,
    },
    {
      title: 'Section',
      dataIndex: 'section',
      key: 'section',
      render: (section?: string) => section || '-',
    },
    {
      title: 'Academic Year',
      dataIndex: 'academicYear',
      key: 'academicYear',
      render: (academicYear?: string) => academicYear || '-',
    },
    {
      title: 'Advisor',
      key: 'advisor',
      render: (_: unknown, record: ProgramSemester) => record.advisor?.fullName || 'Unassigned',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: SemesterStatus) => <Tag color={status === 'active' ? 'success' : status === 'planned' ? 'processing' : status === 'completed' ? 'default' : 'warning'}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: ProgramSemester & { programName: string; programId: string }) => (
        <Space>
          <Button type="link" onClick={() => openSemesterModal(programs.find((program) => program.id === record.programId) || null, record)}>
            Edit
          </Button>
          <Button danger type="link" onClick={() => handleDeleteSemester(record.programId, record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const curriculumColumns = [
    {
      title: 'Program',
      key: 'program',
      render: (_: unknown, record: CurriculumSubject) => record.programName || '-',
    },
    {
      title: 'Semester',
      key: 'semester',
      render: (_: unknown, record: CurriculumSubject) =>
        `Sem ${record.semesterNumber || '-'}${record.section ? ` / ${record.section}` : ''}`,
    },
    {
      title: 'Subject',
      key: 'subject',
      render: (_: unknown, record: CurriculumSubject) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.subject?.name || '-'}</Text>
          <Text type="secondary">{record.subject?.code || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Credits / Hours',
      key: 'load',
      render: (_: unknown, record: CurriculumSubject) =>
        `${record.credits} cr | T:${record.theoryHours} L:${record.labHours}`,
    },
    {
      title: 'Faculty',
      key: 'faculty',
      render: (_: unknown, record: CurriculumSubject) => record.faculty?.fullName || 'Unassigned',
    },
    {
      title: 'Weightage',
      key: 'weightage',
      render: (_: unknown, record: CurriculumSubject) =>
        `${record.internalWeightage}/${record.externalWeightage}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: CurriculumSubject) => (
        <Space>
          <Button
            type="link"
            onClick={() =>
              openCurriculumModal(record.programId || null, record.semesterId, record)
            }
          >
            Edit
          </Button>
          <Button
            danger
            type="link"
            onClick={() =>
              handleDeleteCurriculum(record.programId || '', record.semesterId, record)
            }
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const enrollmentColumns = [
    {
      title: 'Student',
      key: 'student',
      render: (_: unknown, record: StudentEnrollment) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.student?.fullName || '-'}</Text>
          <Text type="secondary">{record.student?.employeeId || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Program',
      key: 'program',
      render: (_: unknown, record: StudentEnrollment) => record.program?.name || '-',
    },
    {
      title: 'Semester',
      key: 'semester',
      render: (_: unknown, record: StudentEnrollment) =>
        record.semester ? `Sem ${record.semester.semesterNumber}${record.semester.section ? ` / ${record.semester.section}` : ''}` : '-',
    },
    {
      title: 'Roll / Year',
      key: 'meta',
      render: (_: unknown, record: StudentEnrollment) => (
        <Space direction="vertical" size={0}>
          <Text>{record.rollNumber || '-'}</Text>
          <Text type="secondary">{record.academicYear || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: EnrollmentStatus) => <Tag color={status === 'active' ? 'success' : status === 'graduated' ? 'default' : 'warning'}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 170,
      render: (_: unknown, record: StudentEnrollment) => (
        <Space>
          <Button type="link" onClick={() => openEnrollmentModal(record)}>
            Edit
          </Button>
          <Button danger type="link" onClick={() => handleDeleteEnrollment(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const registrationColumns = [
    {
      title: 'Student',
      key: 'student',
      render: (_: unknown, record: StudentSubjectRegistration) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.student?.fullName || record.enrollment?.student?.fullName || '-'}</Text>
          <Text type="secondary">{record.student?.employeeId || record.enrollment?.student?.employeeId || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Program / Semester',
      key: 'cohort',
      render: (_: unknown, record: StudentSubjectRegistration) => {
        const program = record.enrollment?.program;
        const semester = record.enrollment?.semester;
        return (
          <Space direction="vertical" size={0}>
            <Text>{program?.name || record.curriculumSubject?.programName || '-'}</Text>
            <Text type="secondary">
              {semester
                ? `Sem ${semester.semesterNumber}${semester.section ? ` / ${semester.section}` : ''}`
                : '-'}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Registered Subject',
      key: 'subject',
      render: (_: unknown, record: StudentSubjectRegistration) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.curriculumSubject?.subject?.name || '-'}</Text>
          <Text type="secondary">{record.curriculumSubject?.subject?.code || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Registration',
      key: 'registration',
      render: (_: unknown, record: StudentSubjectRegistration) => (
        <Space direction="vertical" size={0}>
          <Tag
            color={
              record.status === 'registered'
                ? 'success'
                : record.status === 'completed'
                  ? 'processing'
                  : 'warning'
            }
          >
            {record.status.toUpperCase()}
          </Tag>
          <Text type="secondary">
            {record.registrationDate ? String(record.registrationDate).slice(0, 10) : 'No date'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Mode',
      key: 'mode',
      render: (_: unknown, record: StudentSubjectRegistration) =>
        record.isAutoRegistered ? <Tag color="purple">AUTO</Tag> : <Tag>MANUAL</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 170,
      render: (_: unknown, record: StudentSubjectRegistration) => (
        <Space>
          <Button type="link" onClick={() => openRegistrationModal(record)}>
            Edit
          </Button>
          <Button danger type="link" onClick={() => handleDeleteRegistration(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const updateMembers = async (assignedStaffIds: string[], assignedStudentIds: string[]) => {
    if (!department) {
      return;
    }

    setUpdatingMembers(true);
    try {
      await departmentService.update(department.id, {
        assignedStaffIds,
        assignedStudentIds,
        hodProfileId: department.hodProfileId,
      });
      setPendingStaffIds([]);
      setPendingStudentIds([]);
      message.success('Department members updated');
      await loadPageData(department.id);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to update members');
    } finally {
      setUpdatingMembers(false);
    }
  };

  const handleAssignStaff = async () => {
    const nextStaffIds = Array.from(new Set([...currentStaffIds, ...pendingStaffIds]));
    await updateMembers(nextStaffIds, currentStudentIds);
  };

  const handleAssignStudents = async () => {
    const nextStudentIds = Array.from(new Set([...currentStudentIds, ...pendingStudentIds]));
    await updateMembers(currentStaffIds, nextStudentIds);
  };

  const handleSaveSettings = async () => {
    if (!department) {
      return;
    }

    try {
      const values = await form.validateFields();
      setSavingSettings(true);

      const payload: UpdateDepartmentDto = {
        name: values.name.trim().replace(/\s+/g, ' '),
        code: values.code.trim().toUpperCase(),
        description: values.description?.trim() || undefined,
        status: values.status,
        hodProfileId: values.hodProfileId || undefined,
        contactEmail: values.contactEmail?.trim().toLowerCase() || undefined,
        contactPhone: values.contactPhone?.trim() || undefined,
        location: values.location?.trim() || undefined,
        assignedStaffIds: currentStaffIds,
        assignedStudentIds: currentStudentIds,
      };

      await departmentService.update(department.id, payload);
      message.success('Department settings updated');
      await loadPageData(department.id);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }

      message.error(error?.response?.data?.message || 'Failed to save department settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const openSubjectModal = (subject?: DepartmentSubject) => {
    setEditingSubject(subject || null);
    if (subject) {
      subjectForm.setFieldsValue({
        name: subject.name,
        code: subject.code,
        description: subject.description,
        type: subject.type,
        status: subject.status,
        teacherProfileId: subject.teacherProfileId,
      });
    } else {
      subjectForm.resetFields();
      subjectForm.setFieldsValue({
        type: 'core',
        status: 'active',
      });
    }
    setSubjectModalOpen(true);
  };

  const closeSubjectModal = () => {
    setSubjectModalOpen(false);
    setEditingSubject(null);
    subjectForm.resetFields();
  };

  const handleSaveSubject = async () => {
    if (!department) {
      return;
    }

    try {
      const values = await subjectForm.validateFields();
      setSavingSubject(true);

      const payload = {
        name: values.name.trim().replace(/\s+/g, ' '),
        code: values.code.trim().toUpperCase(),
        description: values.description?.trim() || undefined,
        type: values.type,
        status: values.status,
        teacherProfileId: values.teacherProfileId || undefined,
      };

      if (editingSubject) {
        await departmentService.updateSubject(department.id, editingSubject.id, payload as UpdateDepartmentSubjectDto);
        message.success('Subject updated successfully');
      } else {
        await departmentService.createSubject(department.id, payload as CreateDepartmentSubjectDto);
        message.success('Subject created successfully');
      }

      closeSubjectModal();
      await loadPageData(department.id);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }

      message.error(error?.response?.data?.message || 'Failed to save subject');
    } finally {
      setSavingSubject(false);
    }
  };

  const handleDeleteSubject = (subject: DepartmentSubject) => {
    if (!department) {
      return;
    }

    modal.confirm({
      title: 'Delete Subject',
      content: `Delete ${subject.name}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await departmentService.deleteSubject(department.id, subject.id);
          message.success('Subject deleted successfully');
          await loadPageData(department.id);
        } catch (error: any) {
          message.error(error?.response?.data?.message || 'Failed to delete subject');
        }
      },
    });
  };

  const openProgramModal = (program?: DepartmentProgram) => {
    setEditingProgram(program || null);
    if (program) {
      programForm.setFieldsValue({
        name: program.name,
        code: program.code,
        level: program.level,
        durationSemesters: program.durationSemesters,
        intakeCapacity: program.intakeCapacity,
        status: program.status,
        coordinatorProfileId: program.coordinatorProfileId,
      });
    } else {
      programForm.resetFields();
      programForm.setFieldsValue({
        level: 'undergraduate',
        durationSemesters: 8,
        status: 'active',
      });
    }
    setProgramModalOpen(true);
  };

  const closeProgramModal = () => {
    setProgramModalOpen(false);
    setEditingProgram(null);
    programForm.resetFields();
  };

  const handleSaveProgram = async () => {
    if (!department) {
      return;
    }

    try {
      const values = await programForm.validateFields();
      setSavingProgram(true);

      const payload = {
        name: values.name.trim().replace(/\s+/g, ' '),
        code: values.code.trim().toUpperCase(),
        level: values.level,
        durationSemesters: Number(values.durationSemesters),
        intakeCapacity: values.intakeCapacity ? Number(values.intakeCapacity) : undefined,
        status: values.status,
        coordinatorProfileId: values.coordinatorProfileId || undefined,
      };

      if (editingProgram) {
        await departmentService.updateProgram(department.id, editingProgram.id, payload as UpdateDepartmentProgramDto);
        message.success('Program updated successfully');
      } else {
        await departmentService.createProgram(department.id, payload as CreateDepartmentProgramDto);
        message.success('Program created successfully');
      }

      closeProgramModal();
      await loadPageData(department.id);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.response?.data?.message || 'Failed to save program');
    } finally {
      setSavingProgram(false);
    }
  };

  const handleDeleteProgram = (program: DepartmentProgram) => {
    if (!department) {
      return;
    }

    modal.confirm({
      title: 'Delete Program',
      content: `Delete ${program.name} and all of its semesters?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await departmentService.deleteProgram(department.id, program.id);
          message.success('Program deleted successfully');
          await loadPageData(department.id);
        } catch (error: any) {
          message.error(error?.response?.data?.message || 'Failed to delete program');
        }
      },
    });
  };

  const openSemesterModal = (program?: DepartmentProgram | null, semester?: ProgramSemester) => {
    setSelectedProgram(program || null);
    setEditingSemester(semester || null);

    if (semester) {
      semesterForm.setFieldsValue({
        semesterNumber: semester.semesterNumber,
        section: semester.section,
        academicYear: semester.academicYear,
        studentCapacity: semester.studentCapacity,
        status: semester.status,
        advisorProfileId: semester.advisorProfileId,
      });
    } else {
      semesterForm.resetFields();
      semesterForm.setFieldsValue({
        semesterNumber: 1,
        status: 'planned',
      });
    }

    setSemesterModalOpen(true);
  };

  const closeSemesterModal = () => {
    setSemesterModalOpen(false);
    setSelectedProgram(null);
    setEditingSemester(null);
    semesterForm.resetFields();
  };

  const handleSaveSemester = async () => {
    if (!department || !selectedProgram) {
      return;
    }

    try {
      const values = await semesterForm.validateFields();
      setSavingSemester(true);

      const payload = {
        semesterNumber: Number(values.semesterNumber),
        section: values.section?.trim().toUpperCase() || undefined,
        academicYear: values.academicYear?.trim() || undefined,
        studentCapacity: values.studentCapacity ? Number(values.studentCapacity) : undefined,
        status: values.status,
        advisorProfileId: values.advisorProfileId || undefined,
      };

      if (editingSemester) {
        await departmentService.updateProgramSemester(
          department.id,
          selectedProgram.id,
          editingSemester.id,
          payload as UpdateProgramSemesterDto,
        );
        message.success('Semester updated successfully');
      } else {
        await departmentService.createProgramSemester(
          department.id,
          selectedProgram.id,
          payload as CreateProgramSemesterDto,
        );
        message.success('Semester created successfully');
      }

      closeSemesterModal();
      await loadPageData(department.id);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.response?.data?.message || 'Failed to save semester');
    } finally {
      setSavingSemester(false);
    }
  };

  const handleDeleteSemester = (programId: string, semester: ProgramSemester) => {
    if (!department) {
      return;
    }

    modal.confirm({
      title: 'Delete Semester',
      content: `Delete Semester ${semester.semesterNumber}${semester.section ? ` - ${semester.section}` : ''}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await departmentService.deleteProgramSemester(department.id, programId, semester.id);
          message.success('Semester deleted successfully');
          await loadPageData(department.id);
        } catch (error: any) {
          message.error(error?.response?.data?.message || 'Failed to delete semester');
        }
      },
    });
  };

  const openCurriculumModal = (
    programId?: string | null,
    semesterId?: string | null,
    curriculumItem?: CurriculumSubject,
  ) => {
    setSelectedCurriculumProgramId(programId || null);
    setSelectedCurriculumSemesterId(semesterId || null);
    setEditingCurriculum(curriculumItem || null);

    if (curriculumItem) {
      curriculumForm.setFieldsValue({
        subjectId: curriculumItem.subjectId,
        facultyProfileId: curriculumItem.facultyProfileId,
        academicYear: curriculumItem.academicYear,
        credits: curriculumItem.credits,
        theoryHours: curriculumItem.theoryHours,
        labHours: curriculumItem.labHours,
        internalWeightage: curriculumItem.internalWeightage,
        externalWeightage: curriculumItem.externalWeightage,
        isElective: curriculumItem.isElective ? 'true' : 'false',
        status: curriculumItem.status,
      });
    } else {
      curriculumForm.resetFields();
      curriculumForm.setFieldsValue({
        credits: 4,
        theoryHours: 3,
        labHours: 0,
        internalWeightage: 40,
        externalWeightage: 60,
        isElective: 'false',
        status: 'active',
      });
    }

    setCurriculumModalOpen(true);
  };

  const closeCurriculumModal = () => {
    setCurriculumModalOpen(false);
    setEditingCurriculum(null);
    setSelectedCurriculumProgramId(null);
    setSelectedCurriculumSemesterId(null);
    curriculumForm.resetFields();
  };

  const handleSaveCurriculum = async () => {
    if (!department || !selectedCurriculumProgramId || !selectedCurriculumSemesterId) {
      return;
    }

    try {
      const values = await curriculumForm.validateFields();
      setSavingCurriculum(true);

      const payload = {
        subjectId: values.subjectId,
        facultyProfileId: values.facultyProfileId || undefined,
        academicYear: values.academicYear?.trim() || undefined,
        credits: Number(values.credits),
        theoryHours: Number(values.theoryHours),
        labHours: Number(values.labHours),
        internalWeightage: Number(values.internalWeightage),
        externalWeightage: Number(values.externalWeightage),
        isElective: values.isElective === 'true',
        status: values.status,
      };

      if (editingCurriculum) {
        await departmentService.updateCurriculumSubject(
          department.id,
          selectedCurriculumProgramId,
          selectedCurriculumSemesterId,
          editingCurriculum.id,
          payload as UpdateCurriculumSubjectDto,
        );
        message.success('Curriculum updated successfully');
      } else {
        await departmentService.createCurriculumSubject(
          department.id,
          selectedCurriculumProgramId,
          selectedCurriculumSemesterId,
          payload as CreateCurriculumSubjectDto,
        );
        message.success('Curriculum subject added successfully');
      }

      closeCurriculumModal();
      await loadPageData(department.id);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.response?.data?.message || 'Failed to save curriculum mapping');
    } finally {
      setSavingCurriculum(false);
    }
  };

  const handleDeleteCurriculum = (programId: string, semesterId: string, curriculumItem: CurriculumSubject) => {
    if (!department || !programId) {
      return;
    }

    modal.confirm({
      title: 'Delete Curriculum Subject',
      content: `Remove ${curriculumItem.subject?.name || 'this subject'} from the semester curriculum?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await departmentService.deleteCurriculumSubject(department.id, programId, semesterId, curriculumItem.id);
          message.success('Curriculum subject deleted successfully');
          await loadPageData(department.id);
        } catch (error: any) {
          message.error(error?.response?.data?.message || 'Failed to delete curriculum subject');
        }
      },
    });
  };

  const openEnrollmentModal = (enrollment?: StudentEnrollment) => {
    setEditingEnrollment(enrollment || null);
    if (enrollment) {
      enrollmentForm.setFieldsValue({
        studentProfileId: enrollment.studentProfileId,
        programId: enrollment.programId,
        semesterId: enrollment.semesterId,
        rollNumber: enrollment.rollNumber,
        academicYear: enrollment.academicYear,
        admissionDate: enrollment.admissionDate ? String(enrollment.admissionDate).slice(0, 10) : undefined,
        status: enrollment.status,
      });
    } else {
      enrollmentForm.resetFields();
      enrollmentForm.setFieldsValue({
        status: 'active',
      });
    }
    setEnrollmentModalOpen(true);
  };

  const closeEnrollmentModal = () => {
    setEnrollmentModalOpen(false);
    setEditingEnrollment(null);
    enrollmentForm.resetFields();
  };

  const handleSaveEnrollment = async () => {
    if (!department) {
      return;
    }

    try {
      const values = await enrollmentForm.validateFields();
      setSavingEnrollment(true);

      const payload = {
        studentProfileId: values.studentProfileId,
        programId: values.programId,
        semesterId: values.semesterId,
        rollNumber: values.rollNumber?.trim() || undefined,
        academicYear: values.academicYear?.trim() || undefined,
        admissionDate: values.admissionDate || undefined,
        status: values.status,
      };

      if (editingEnrollment) {
        await departmentService.updateEnrollment(department.id, editingEnrollment.id, payload as UpdateStudentEnrollmentDto);
        message.success('Student enrollment updated successfully');
      } else {
        await departmentService.createEnrollment(department.id, payload as CreateStudentEnrollmentDto);
        message.success('Student enrollment created successfully');
      }

      closeEnrollmentModal();
      await loadPageData(department.id);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.response?.data?.message || 'Failed to save student enrollment');
    } finally {
      setSavingEnrollment(false);
    }
  };

  const handleDeleteEnrollment = (enrollment: StudentEnrollment) => {
    if (!department) {
      return;
    }

    modal.confirm({
      title: 'Delete Enrollment',
      content: `Remove ${enrollment.student?.fullName || 'this student'} from academic enrollment?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await departmentService.deleteEnrollment(department.id, enrollment.id);
          message.success('Student enrollment deleted successfully');
          await loadPageData(department.id);
        } catch (error: any) {
          message.error(error?.response?.data?.message || 'Failed to delete enrollment');
        }
      },
    });
  };

  const openRegistrationModal = (registration?: StudentSubjectRegistration) => {
    setEditingRegistration(registration || null);
    if (registration) {
      registrationForm.setFieldsValue({
        enrollmentId: registration.enrollmentId,
        curriculumSubjectId: registration.curriculumSubjectId,
        registrationDate: registration.registrationDate
          ? String(registration.registrationDate).slice(0, 10)
          : undefined,
        status: registration.status,
        isAutoRegistered: registration.isAutoRegistered ? 'true' : 'false',
      });
    } else {
      registrationForm.resetFields();
      registrationForm.setFieldsValue({
        status: 'registered',
        isAutoRegistered: 'false',
      });
    }
    setRegistrationModalOpen(true);
  };

  const closeRegistrationModal = () => {
    setRegistrationModalOpen(false);
    setEditingRegistration(null);
    registrationForm.resetFields();
  };

  const handleSaveRegistration = async () => {
    if (!department) {
      return;
    }

    try {
      const values = await registrationForm.validateFields();
      const selectedEnrollment = enrollments.find((enrollment) => enrollment.id === values.enrollmentId);

      if (!selectedEnrollment) {
        message.error('Please select a valid enrollment');
        return;
      }

      setSavingRegistration(true);

      const payload = {
        studentProfileId: selectedEnrollment.studentProfileId,
        enrollmentId: values.enrollmentId,
        curriculumSubjectId: values.curriculumSubjectId,
        registrationDate: values.registrationDate || undefined,
        status: values.status,
        isAutoRegistered: values.isAutoRegistered === 'true',
      };

      if (editingRegistration) {
        await departmentService.updateRegistration(
          department.id,
          editingRegistration.id,
          payload as UpdateStudentSubjectRegistrationDto,
        );
        message.success('Student registration updated successfully');
      } else {
        await departmentService.createRegistration(
          department.id,
          payload as CreateStudentSubjectRegistrationDto,
        );
        message.success('Student registration created successfully');
      }

      closeRegistrationModal();
      await loadPageData(department.id);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.response?.data?.message || 'Failed to save student registration');
    } finally {
      setSavingRegistration(false);
    }
  };

  const handleDeleteRegistration = (registration: StudentSubjectRegistration) => {
    if (!department) {
      return;
    }

    modal.confirm({
      title: 'Delete Registration',
      content: `Remove ${registration.curriculumSubject?.subject?.name || 'this subject'} from ${
        registration.student?.fullName || registration.enrollment?.student?.fullName || 'this student'
      }?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await departmentService.deleteRegistration(department.id, registration.id);
          message.success('Student registration deleted successfully');
          await loadPageData(department.id);
        } catch (error: any) {
          message.error(error?.response?.data?.message || 'Failed to delete registration');
        }
      },
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  if (!department) {
    return (
      <DashboardLayout>
        <div style={{ padding: 24 }}>
          <Empty description="Department not found" />
        </div>
      </DashboardLayout>
    );
  }

  const hodOptions = staffMembers.map((employee) => ({
    label: `${employee.fullName} - ${employee.designation}`,
    value: employee.id,
  }));
  const subjectTeacherOptions = staffMembers.map((employee) => ({
    label: `${employee.fullName} - ${employee.designation}`,
    value: employee.id,
  }));
  const coordinatorOptions = subjectTeacherOptions;
  const advisorOptions = subjectTeacherOptions;
  const facultyOptions = subjectTeacherOptions;
  const flattenedSemesters = programs.flatMap((program) =>
    program.semesters.map((semester) => ({
      ...semester,
      programId: program.id,
      programName: program.name,
    })),
  );
  const curriculumSemesterOptions = programs.flatMap((program) =>
    program.semesters.map((semester) => ({
      label: `${program.name} - Semester ${semester.semesterNumber}${semester.section ? ` / ${semester.section}` : ''}`,
      programId: program.id,
      semesterId: semester.id,
    })),
  );
  const selectedSemesterSubjects = subjects.filter((subject) => {
    if (!selectedCurriculumSemesterId) {
      return true;
    }

    const alreadyMappedIds = curriculumItems
      .filter(
        (item) =>
          item.semesterId === selectedCurriculumSemesterId &&
          (!editingCurriculum || item.id !== editingCurriculum.id),
      )
      .map((item) => item.subjectId);

    return !alreadyMappedIds.includes(subject.id) || editingCurriculum?.subjectId === subject.id;
  });
  const enrollmentStudentOptions = studentProfiles.map((student) => ({
    label: `${student.fullName} - ${student.employeeId}`,
    value: student.id,
  }));
  const enrollmentProgramOptions = programs.map((program) => ({
    label: `${program.name} - ${program.code}`,
    value: program.id,
  }));
  const enrollmentSemesterOptions = programs
    .filter((program) => !selectedEnrollmentProgramId || program.id === selectedEnrollmentProgramId)
    .flatMap((program) =>
      program.semesters.map((semester) => ({
        label: `${program.name} - Semester ${semester.semesterNumber}${semester.section ? ` / ${semester.section}` : ''}`,
        value: semester.id,
      })),
    );
  const registrationEnrollmentOptions = enrollments.map((enrollment) => ({
    label: `${enrollment.student?.fullName || enrollment.student?.employeeId || 'Student'} - ${
      enrollment.program?.name || 'Program'
    } / Sem ${enrollment.semester?.semesterNumber || '-'}${enrollment.semester?.section ? ` / ${enrollment.semester.section}` : ''}`,
    value: enrollment.id,
  }));
  const selectedRegistrationEnrollment = enrollments.find(
    (enrollment) => enrollment.id === selectedRegistrationEnrollmentId,
  );
  const registrationCurriculumOptions = curriculumItems
    .filter((item) => !selectedRegistrationEnrollment || item.semesterId === selectedRegistrationEnrollment.semesterId)
    .filter((item) => {
      if (!selectedRegistrationEnrollment) {
        return true;
      }

      const isAlreadyRegistered = registrations.some(
        (registration) =>
          registration.studentProfileId === selectedRegistrationEnrollment.studentProfileId &&
          registration.curriculumSubjectId === item.id &&
          registration.id !== editingRegistration?.id,
      );

      return !isAlreadyRegistered || editingRegistration?.curriculumSubjectId === item.id;
    })
    .map((item) => ({
      label: `${item.subject?.name || 'Subject'} - ${item.subject?.code || ''}`,
      value: item.id,
    }));
  const autoRegistrationEnrollmentOptions = enrollments.map((enrollment) => ({
    label: `${enrollment.student?.fullName || 'Student'} - ${enrollment.program?.code || enrollment.program?.name || 'Program'} / Sem ${enrollment.semester?.semesterNumber || '-'}${enrollment.semester?.section ? ` / ${enrollment.semester.section}` : ''}`,
    value: enrollment.id,
  }));
  const autoRegistrationSemesterOptions = Array.from(
    new Map(
      enrollments.map((enrollment) => [
        enrollment.semesterId,
        {
          label: `${enrollment.program?.name || 'Program'} - Sem ${enrollment.semester?.semesterNumber || '-'}${enrollment.semester?.section ? ` / ${enrollment.semester.section}` : ''}`,
          value: enrollment.semesterId,
        },
      ]),
    ).values(),
  );

  const showBulkRegistrationSummary = (result: BulkRegistrationResult, title: string) => {
    modal.info({
      title,
      width: 680,
      content: (
        <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 8 }}>
          <Text>{result.message}</Text>
          <Space size={16}>
            <Tag color="success">Created: {result.createdCount}</Tag>
            <Tag color="warning">Skipped: {result.skippedCount}</Tag>
          </Space>
          {result.skippedSubjects.length > 0 ? (
            <Card size="small" title="Skipped Subjects">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {result.skippedSubjects.slice(0, 8).map((subject, index) => (
                  <Text key={`${subject.curriculumSubjectId}-${index}`}>
                    {subject.subjectName} ({subject.subjectCode}) - {subject.reason}
                  </Text>
                ))}
                {result.skippedSubjects.length > 8 ? (
                  <Text type="secondary">+{result.skippedSubjects.length - 8} more skipped items</Text>
                ) : null}
              </Space>
            </Card>
          ) : null}
        </Space>
      ),
    });
  };

  const handleAutoRegisterEnrollment = async () => {
    if (!department || !selectedAutoEnrollmentId) {
      return;
    }

    try {
      setProcessingAutoRegistration(true);
      const result = await departmentService.autoRegisterEnrollmentSubjects(department.id, {
        enrollmentId: selectedAutoEnrollmentId,
      });
      message.success(result.message);
      showBulkRegistrationSummary(result, 'Student Auto Registration');
      await loadPageData(department.id);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to auto register core subjects');
    } finally {
      setProcessingAutoRegistration(false);
    }
  };

  const handleAutoRegisterSemester = async () => {
    if (!department || !selectedAutoSemesterId) {
      return;
    }

    try {
      setProcessingAutoRegistration(true);
      const result = await departmentService.autoRegisterSemesterSubjects(department.id, {
        semesterId: selectedAutoSemesterId,
      });
      message.success(result.message);
      showBulkRegistrationSummary(result, 'Cohort Auto Registration');
      await loadPageData(department.id);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to auto register the cohort');
    } finally {
      setProcessingAutoRegistration(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: 24 }}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Breadcrumb
              items={[
                {
                  title: <a onClick={() => navigate('/departments')}>Departments</a>,
                },
                {
                  title: department.name,
                },
              ]}
            />

            <Space align="start" style={{ justifyContent: 'space-between', width: '100%' }}>
              <Space direction="vertical" size={4}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/departments')}>
                  Back to Departments
                </Button>
                <Title level={2} style={{ margin: 0 }}>
                  {department.name}
                </Title>
                <Space>
                  <Tag color={statusColors[department.status]}>{department.status.toUpperCase()}</Tag>
                  <Text type="secondary">{department.code}</Text>
                </Space>
              </Space>
            </Space>
          </Space>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Total Members" value={department.employeeCount} prefix={<ApartmentOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Staff" value={department.staffCount} prefix={<UserSwitchOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Students" value={department.studentCount} prefix={<TeamOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Programs" value={department.programCount} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic title="Subjects Offered" value={department.subjectCount} />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic title="Semester / Section Cohorts" value={department.semesterCount} />
              </Card>
            </Col>
          </Row>

          <Tabs
            items={[
              {
                key: 'overview',
                label: 'Overview',
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card title="Department Snapshot">
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Head of Department">
                          {department.headOfDepartment?.fullName || 'Not assigned'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Contact Email">{department.contactEmail || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Contact Phone">{department.contactPhone || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Location">{department.location || '-'}</Descriptions.Item>
                      </Descriptions>
                    </Card>

                    <Card title="Description">
                      <Paragraph style={{ marginBottom: 0 }}>
                        {department.description || 'No department description has been added yet.'}
                      </Paragraph>
                    </Card>

                    <Card title="Current Team Preview">
                      {departmentMembers.length > 0 ? (
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                          {departmentMembers.slice(0, 6).map((member) => (
                            <Card key={member.id} size="small">
                              <Space direction="vertical" size={0}>
                                <Text strong>{member.fullName}</Text>
                                <Text type="secondary">
                                  {member.designation} | {member.role}
                                </Text>
                                <Text type="secondary">
                                  {member.employeeId} | {member.email}
                                </Text>
                              </Space>
                            </Card>
                          ))}
                        </Space>
                      ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No members assigned yet" />
                      )}
                    </Card>
                  </Space>
                ),
              },
              {
                key: 'staff',
                label: `Staff (${staffMembers.length})`,
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card
                      title="Assign Staff"
                      extra={
                        <Button
                          type="primary"
                          onClick={() => void handleAssignStaff()}
                          loading={updatingMembers}
                          disabled={pendingStaffIds.length === 0}
                        >
                          Add Selected Staff
                        </Button>
                      }
                    >
                      <Select
                        mode="multiple"
                        allowClear
                        value={pendingStaffIds}
                        onChange={setPendingStaffIds}
                        placeholder="Select staff to assign or transfer into this department"
                        style={{ width: '100%' }}
                        options={staffCandidates
                          .filter((employee) => !currentStaffIds.includes(employee.id))
                          .map((employee) => ({
                            label: `${employee.fullName} - ${employee.designation} (${employee.department})`,
                            value: employee.id,
                          }))}
                      />
                    </Card>

                    <Card title="Assigned Staff">
                      <Table
                        rowKey="id"
                        columns={staffColumns}
                        dataSource={staffMembers}
                        loading={updatingMembers}
                        pagination={{ pageSize: 6 }}
                        locale={{ emptyText: 'No staff assigned to this department yet' }}
                      />
                    </Card>
                  </Space>
                ),
              },
              {
                key: 'students',
                label: `Students (${studentMembers.length})`,
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card
                      title="Assign Students"
                      extra={
                        <Button
                          type="primary"
                          onClick={() => void handleAssignStudents()}
                          loading={updatingMembers}
                          disabled={pendingStudentIds.length === 0}
                        >
                          Add Selected Students
                        </Button>
                      }
                    >
                      <Select
                        mode="multiple"
                        allowClear
                        value={pendingStudentIds}
                        onChange={setPendingStudentIds}
                        placeholder="Select students to assign or transfer into this department"
                        style={{ width: '100%' }}
                        options={studentCandidates
                          .filter((employee) => !currentStudentIds.includes(employee.id))
                          .map((employee) => ({
                            label: `${employee.fullName} - ${employee.employeeId} (${employee.department})`,
                            value: employee.id,
                          }))}
                      />
                    </Card>

                    <Card title="Assigned Students">
                      <Table
                        rowKey="id"
                        columns={studentColumns}
                        dataSource={studentMembers}
                        loading={updatingMembers}
                        pagination={{ pageSize: 6 }}
                        locale={{ emptyText: 'No students assigned to this department yet' }}
                      />
                    </Card>
                  </Space>
                ),
              },
              {
                key: 'academic-structure',
                label: `Academic Structure (${programs.length})`,
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card
                      title="College Programs"
                      extra={
                        <Button type="primary" onClick={() => openProgramModal()}>
                          Add Program
                        </Button>
                      }
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                          <Statistic title="Programs" value={programs.length} />
                        </Col>
                        <Col xs={24} md={8}>
                          <Statistic
                            title="Active Programs"
                            value={programs.filter((program) => program.status === 'active').length}
                          />
                        </Col>
                        <Col xs={24} md={8}>
                          <Statistic title="Semester Cohorts" value={flattenedSemesters.length} />
                        </Col>
                      </Row>
                    </Card>

                    <Card title="Program Catalog">
                      <Table
                        rowKey="id"
                        columns={programColumns}
                        dataSource={programs}
                        pagination={{ pageSize: 6 }}
                        locale={{ emptyText: 'No programs created for this department yet' }}
                      />
                    </Card>

                    <Card title="Semester / Section Planning">
                      <Table
                        rowKey="id"
                        columns={semesterColumns}
                        dataSource={flattenedSemesters}
                        pagination={{ pageSize: 8 }}
                        locale={{ emptyText: 'No semester cohorts created yet' }}
                      />
                    </Card>
                  </Space>
                ),
              },
              {
                key: 'enrollment',
                label: `Student Enrollment (${enrollments.length})`,
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card
                      title="Academic Enrollment"
                      extra={
                        <Button
                          type="primary"
                          onClick={() => openEnrollmentModal()}
                          disabled={studentProfiles.length === 0 || programs.length === 0}
                        >
                          Enroll Student
                        </Button>
                      }
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                          <Statistic title="Enrolled Students" value={enrollments.length} />
                        </Col>
                        <Col xs={24} md={8}>
                          <Statistic
                            title="Active Enrollments"
                            value={enrollments.filter((enrollment) => enrollment.status === 'active').length}
                          />
                        </Col>
                        <Col xs={24} md={8}>
                          <Statistic title="Unenrolled Students" value={Math.max(studentProfiles.length - enrollments.length, 0)} />
                        </Col>
                      </Row>
                    </Card>

                    <Card title="Enrollment Register">
                      <Table
                        rowKey="id"
                        columns={enrollmentColumns}
                        dataSource={enrollments}
                        pagination={{ pageSize: 8 }}
                        locale={{
                          emptyText:
                            studentProfiles.length === 0
                              ? 'Assign students to this department first'
                              : 'No students enrolled yet',
                        }}
                      />
                    </Card>
                  </Space>
                ),
              },
              {
                key: 'registrations',
                label: `Registrations (${registrations.length})`,
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card
                      title="Subject Registration"
                      extra={
                        <Space wrap>
                          <Select
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            placeholder="Select student enrollment"
                            style={{ minWidth: 240 }}
                            value={selectedAutoEnrollmentId}
                            onChange={setSelectedAutoEnrollmentId}
                            options={autoRegistrationEnrollmentOptions}
                          />
                          <Button
                            onClick={() => void handleAutoRegisterEnrollment()}
                            loading={processingAutoRegistration}
                            disabled={!selectedAutoEnrollmentId || enrollments.length === 0 || curriculumItems.length === 0}
                          >
                            Auto Register Student
                          </Button>
                          <Select
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            placeholder="Select cohort"
                            style={{ minWidth: 220 }}
                            value={selectedAutoSemesterId}
                            onChange={setSelectedAutoSemesterId}
                            options={autoRegistrationSemesterOptions}
                          />
                          <Button
                            onClick={() => void handleAutoRegisterSemester()}
                            loading={processingAutoRegistration}
                            disabled={!selectedAutoSemesterId || enrollments.length === 0 || curriculumItems.length === 0}
                          >
                            Auto Register Cohort
                          </Button>
                          <Button
                            type="primary"
                            onClick={() => openRegistrationModal()}
                            disabled={enrollments.length === 0 || curriculumItems.length === 0}
                          >
                            Register Subject
                          </Button>
                        </Space>
                      }
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                          <Statistic title="Total Registrations" value={registrations.length} />
                        </Col>
                        <Col xs={24} md={8}>
                          <Statistic
                            title="Active Registrations"
                            value={registrations.filter((registration) => registration.status === 'registered').length}
                          />
                        </Col>
                        <Col xs={24} md={8}>
                          <Statistic
                            title="Completed Subjects"
                            value={registrations.filter((registration) => registration.status === 'completed').length}
                          />
                        </Col>
                      </Row>
                    </Card>

                    <Card title="Student Subject Register">
                      <Table
                        rowKey="id"
                        columns={registrationColumns}
                        dataSource={registrations}
                        pagination={{ pageSize: 8 }}
                        locale={{
                          emptyText:
                            enrollments.length === 0
                              ? 'Create student enrollments first'
                              : curriculumItems.length === 0
                                ? 'Map curriculum subjects first'
                                : 'No subject registrations yet',
                        }}
                      />
                    </Card>
                  </Space>
                ),
              },
              {
                key: 'curriculum',
                label: `Curriculum (${department.curriculumCount})`,
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card
                      title="Curriculum Mapping"
                      extra={
                        <Button
                          type="primary"
                          onClick={() => {
                            const firstSemester = curriculumSemesterOptions[0];
                            openCurriculumModal(firstSemester?.programId || null, firstSemester?.semesterId || null);
                          }}
                          disabled={curriculumSemesterOptions.length === 0 || subjects.length === 0}
                        >
                          Add Curriculum Subject
                        </Button>
                      }
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                          <Statistic title="Mapped Subjects" value={curriculumItems.length} />
                        </Col>
                        <Col xs={24} md={8}>
                          <Statistic
                            title="Electives"
                            value={curriculumItems.filter((item) => item.isElective).length}
                          />
                        </Col>
                        <Col xs={24} md={8}>
                          <Statistic
                            title="Faculty Assigned"
                            value={curriculumItems.filter((item) => item.faculty).length}
                          />
                        </Col>
                      </Row>
                    </Card>

                    <Card title="Semester Curriculum">
                      <Table
                        rowKey="id"
                        columns={curriculumColumns}
                        dataSource={curriculumItems}
                        pagination={{ pageSize: 8 }}
                        locale={{
                          emptyText:
                            curriculumSemesterOptions.length === 0
                              ? 'Create programs and semesters first'
                              : 'No curriculum mapped yet',
                        }}
                      />
                    </Card>
                  </Space>
                ),
              },
              {
                key: 'subjects',
                label: `Subjects (${subjects.length})`,
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card
                      title="Subject Planning"
                      extra={
                        <Button type="primary" onClick={() => openSubjectModal()}>
                          Add Subject
                        </Button>
                      }
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                          <Statistic title="Total Subjects" value={subjects.length} />
                        </Col>
                        <Col xs={24} md={8}>
                          <Statistic
                            title="Active Subjects"
                            value={subjects.filter((subject) => subject.status === 'active').length}
                          />
                        </Col>
                        <Col xs={24} md={8}>
                          <Statistic
                            title="Teacher Assigned"
                            value={subjects.filter((subject) => subject.teacher).length}
                          />
                        </Col>
                      </Row>
                    </Card>

                    <Card title="Department Subjects">
                      <Table
                        rowKey="id"
                        columns={subjectColumns}
                        dataSource={subjects}
                        pagination={{ pageSize: 6 }}
                        locale={{ emptyText: 'No subjects created for this department yet' }}
                      />
                    </Card>
                  </Space>
                ),
              },
              {
                key: 'settings',
                label: 'Settings',
                children: (
                  <Card
                    title="Department Settings"
                    extra={
                      <Button type="primary" icon={<SaveOutlined />} loading={savingSettings} onClick={() => void handleSaveSettings()}>
                        Save Settings
                      </Button>
                    }
                  >
                    <Form form={form} layout="vertical">
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="name"
                            label="Department Name"
                            rules={[
                              { required: true, message: 'Please enter a department name' },
                              { min: 2, message: 'Department name must be at least 2 characters' },
                            ]}
                          >
                            <Input placeholder="Department name" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
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
                              placeholder="Department code"
                              onChange={(event) => form.setFieldValue('code', event.target.value.toUpperCase())}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} md={12}>
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
                        <Col xs={24} md={12}>
                          <Form.Item name="hodProfileId" label="Head of Department">
                            <Select allowClear placeholder="Select HOD from assigned staff" options={hodOptions} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item name="description" label="Description">
                        <TextArea rows={4} placeholder="Department purpose, goals, and responsibilities" maxLength={500} />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col xs={24} md={8}>
                          <Form.Item name="contactEmail" label="Contact Email" rules={[{ type: 'email', message: 'Enter a valid email address' }]}>
                            <Input placeholder="department@school.edu" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                          <Form.Item name="contactPhone" label="Contact Phone">
                            <Input placeholder="+91 9876543210" maxLength={30} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                          <Form.Item name="location" label="Location">
                            <Input placeholder="Block A, First Floor" maxLength={120} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form>
                  </Card>
                ),
              },
            ]}
          />
        </Space>

        <Modal
          title={editingRegistration ? 'Edit Subject Registration' : 'Register Subject'}
          open={registrationModalOpen}
          destroyOnHidden
          onOk={() => void handleSaveRegistration()}
          onCancel={closeRegistrationModal}
          confirmLoading={savingRegistration}
          okText={editingRegistration ? 'Update' : 'Create'}
          width={720}
        >
          <Form form={registrationForm} layout="vertical" initialValues={{ status: 'registered', isAutoRegistered: 'false' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="enrollmentId" label="Student Enrollment" rules={[{ required: true, message: 'Please select an enrollment' }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={registrationEnrollmentOptions}
                    onChange={() => registrationForm.setFieldValue('curriculumSubjectId', undefined)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="curriculumSubjectId" label="Curriculum Subject" rules={[{ required: true, message: 'Please select a subject' }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={registrationCurriculumOptions}
                    disabled={!selectedRegistrationEnrollment}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select a status' }]}>
                  <Select
                    options={[
                      { label: 'Registered', value: 'registered' },
                      { label: 'Dropped', value: 'dropped' },
                      { label: 'Completed', value: 'completed' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="registrationDate" label="Registration Date">
                  <Input type="date" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="isAutoRegistered" label="Registration Mode" rules={[{ required: true, message: 'Please select a mode' }]}>
                  <Select
                    options={[
                      { label: 'Manual', value: 'false' },
                      { label: 'Auto Registered', value: 'true' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Card size="small" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <Space direction="vertical" size={4}>
                <Text strong>Selected Cohort</Text>
                <Text type="secondary">
                  {selectedRegistrationEnrollment
                    ? `${selectedRegistrationEnrollment.student?.fullName || 'Student'} | ${
                        selectedRegistrationEnrollment.program?.name || 'Program'
                      } | Sem ${selectedRegistrationEnrollment.semester?.semesterNumber || '-'}${
                        selectedRegistrationEnrollment.semester?.section
                          ? ` / ${selectedRegistrationEnrollment.semester.section}`
                          : ''
                      }`
                    : 'Choose a student enrollment to load semester subjects'}
                </Text>
              </Space>
            </Card>
          </Form>
        </Modal>

        <Modal
          title={editingEnrollment ? 'Edit Student Enrollment' : 'Enroll Student'}
          open={enrollmentModalOpen}
          destroyOnHidden
          onOk={() => void handleSaveEnrollment()}
          onCancel={closeEnrollmentModal}
          confirmLoading={savingEnrollment}
          okText={editingEnrollment ? 'Update' : 'Create'}
          width={720}
        >
          <Form form={enrollmentForm} layout="vertical" initialValues={{ status: 'active' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="studentProfileId" label="Student" rules={[{ required: true, message: 'Please select a student' }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={enrollmentStudentOptions}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Enrollment Status" rules={[{ required: true, message: 'Please select a status' }]}>
                  <Select
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'Promoted', value: 'promoted' },
                      { label: 'Graduated', value: 'graduated' },
                      { label: 'Dropped', value: 'dropped' },
                      { label: 'Deferred', value: 'deferred' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="programId" label="Program" rules={[{ required: true, message: 'Please select a program' }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={enrollmentProgramOptions}
                    onChange={() => enrollmentForm.setFieldValue('semesterId', undefined)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="semesterId" label="Semester / Section" rules={[{ required: true, message: 'Please select a semester' }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={enrollmentSemesterOptions}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="rollNumber" label="Roll Number">
                  <Input placeholder="e.g. CSE2026-001" maxLength={50} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="academicYear" label="Academic Year">
                  <Input placeholder="e.g. 2026-2027" maxLength={20} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="admissionDate" label="Admission Date">
                  <Input type="date" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        <Modal
          title={editingCurriculum ? 'Edit Curriculum Subject' : 'Add Curriculum Subject'}
          open={curriculumModalOpen}
          destroyOnHidden
          onOk={() => void handleSaveCurriculum()}
          onCancel={closeCurriculumModal}
          confirmLoading={savingCurriculum}
          okText={editingCurriculum ? 'Update' : 'Create'}
          width={760}
        >
          <Form form={curriculumForm} layout="vertical" initialValues={{ credits: 4, theoryHours: 3, labHours: 0, internalWeightage: 40, externalWeightage: 60, isElective: 'false', status: 'active' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Program / Semester">
                  <Select
                    value={
                      selectedCurriculumProgramId && selectedCurriculumSemesterId
                        ? `${selectedCurriculumProgramId}:${selectedCurriculumSemesterId}`
                        : undefined
                    }
                    onChange={(value) => {
                      const [programId, semesterId] = value.split(':');
                      setSelectedCurriculumProgramId(programId);
                      setSelectedCurriculumSemesterId(semesterId);
                    }}
                    options={curriculumSemesterOptions.map((item) => ({
                      label: item.label,
                      value: `${item.programId}:${item.semesterId}`,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="subjectId" label="Subject" rules={[{ required: true, message: 'Please select a subject' }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={selectedSemesterSubjects.map((subject) => ({
                      label: `${subject.name} - ${subject.code}`,
                      value: subject.id,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="facultyProfileId" label="Faculty">
                  <Select allowClear placeholder="Assign faculty" options={facultyOptions} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="academicYear" label="Academic Year">
                  <Input placeholder="e.g. 2026-2027" maxLength={20} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select a status' }]}>
                  <Select
                    options={[
                      { label: 'Planned', value: 'planned' },
                      { label: 'Active', value: 'active' },
                      { label: 'Archived', value: 'archived' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="credits" label="Credits" rules={[{ required: true, message: 'Enter credits' }]}>
                  <Input type="number" min={1} max={20} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="theoryHours" label="Theory Hours" rules={[{ required: true, message: 'Enter theory hours' }]}>
                  <Input type="number" min={0} max={20} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="labHours" label="Lab Hours" rules={[{ required: true, message: 'Enter lab hours' }]}>
                  <Input type="number" min={0} max={20} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="isElective" label="Type" rules={[{ required: true, message: 'Select type' }]}>
                  <Select
                    options={[
                      { label: 'Core', value: 'false' },
                      { label: 'Elective', value: 'true' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="internalWeightage" label="Internal Weightage" rules={[{ required: true, message: 'Enter internal weightage' }]}>
                  <Input type="number" min={0} max={100} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="externalWeightage" label="External Weightage" rules={[{ required: true, message: 'Enter external weightage' }]}>
                  <Input type="number" min={0} max={100} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        <Modal
          title={editingProgram ? 'Edit Program' : 'Add Program'}
          open={programModalOpen}
          destroyOnHidden
          onOk={() => void handleSaveProgram()}
          onCancel={closeProgramModal}
          confirmLoading={savingProgram}
          okText={editingProgram ? 'Update' : 'Create'}
          width={720}
        >
          <Form form={programForm} layout="vertical" initialValues={{ level: 'undergraduate', durationSemesters: 8, status: 'active' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="name" label="Program Name" rules={[{ required: true, message: 'Please enter a program name' }]}>
                  <Input placeholder="e.g. B.Tech Computer Science" maxLength={120} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label="Program Code"
                  rules={[
                    { required: true, message: 'Please enter a program code' },
                    { pattern: /^[A-Z0-9_-]+$/, message: 'Use uppercase letters, numbers, hyphens, or underscores only' },
                  ]}
                >
                  <Input
                    placeholder="e.g. BTECH-CSE"
                    maxLength={30}
                    onChange={(event) => programForm.setFieldValue('code', event.target.value.toUpperCase())}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="level" label="Level" rules={[{ required: true, message: 'Please select a level' }]}>
                  <Select
                    options={[
                      { label: 'Diploma', value: 'diploma' },
                      { label: 'Undergraduate', value: 'undergraduate' },
                      { label: 'Postgraduate', value: 'postgraduate' },
                      { label: 'Doctorate', value: 'doctorate' },
                      { label: 'Certificate', value: 'certificate' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="durationSemesters" label="Duration (Semesters)" rules={[{ required: true, message: 'Enter duration' }]}>
                  <Input type="number" min={1} max={20} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="intakeCapacity" label="Intake Capacity">
                  <Input type="number" min={1} max={5000} />
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
                <Form.Item name="coordinatorProfileId" label="Program Coordinator">
                  <Select allowClear placeholder="Select coordinator" options={coordinatorOptions} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        <Modal
          title={editingSemester ? 'Edit Semester / Section' : `Add Semester${selectedProgram ? ` to ${selectedProgram.name}` : ''}`}
          open={semesterModalOpen}
          destroyOnHidden
          onOk={() => void handleSaveSemester()}
          onCancel={closeSemesterModal}
          confirmLoading={savingSemester}
          okText={editingSemester ? 'Update' : 'Create'}
          width={720}
        >
          <Form form={semesterForm} layout="vertical" initialValues={{ semesterNumber: 1, status: 'planned' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="semesterNumber" label="Semester Number" rules={[{ required: true, message: 'Enter semester number' }]}>
                  <Input type="number" min={1} max={20} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="section" label="Section">
                  <Input placeholder="e.g. A" maxLength={20} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="academicYear" label="Academic Year">
                  <Input placeholder="e.g. 2026-2027" maxLength={20} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="studentCapacity" label="Student Capacity">
                  <Input type="number" min={1} max={5000} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select a status' }]}>
                  <Select
                    options={[
                      { label: 'Planned', value: 'planned' },
                      { label: 'Active', value: 'active' },
                      { label: 'Completed', value: 'completed' },
                      { label: 'Archived', value: 'archived' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="advisorProfileId" label="Class Advisor">
                  <Select allowClear placeholder="Select advisor" options={advisorOptions} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        <Modal
          title={editingSubject ? 'Edit Subject' : 'Add Subject'}
          open={subjectModalOpen}
          destroyOnHidden
          onOk={() => void handleSaveSubject()}
          onCancel={closeSubjectModal}
          confirmLoading={savingSubject}
          okText={editingSubject ? 'Update' : 'Create'}
          width={640}
        >
          <Form form={subjectForm} layout="vertical" initialValues={{ type: 'core', status: 'active' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Subject Name"
                  rules={[
                    { required: true, message: 'Please enter a subject name' },
                    { min: 2, message: 'Subject name must be at least 2 characters' },
                  ]}
                >
                  <Input placeholder="e.g. Physics" maxLength={100} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label="Subject Code"
                  rules={[
                    { required: true, message: 'Please enter a subject code' },
                    {
                      pattern: /^[A-Z0-9_-]+$/,
                      message: 'Use uppercase letters, numbers, hyphens, or underscores only',
                    },
                  ]}
                >
                  <Input
                    placeholder="e.g. PHY101"
                    maxLength={20}
                    onChange={(event) => subjectForm.setFieldValue('code', event.target.value.toUpperCase())}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="type" label="Subject Type" rules={[{ required: true, message: 'Please select a type' }]}>
                  <Select
                    options={[
                      { label: 'Core', value: 'core' },
                      { label: 'Elective', value: 'elective' },
                      { label: 'Lab', value: 'lab' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
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
              <Col span={8}>
                <Form.Item name="teacherProfileId" label="Subject Teacher">
                  <Select allowClear placeholder="Select teacher" options={subjectTeacherOptions} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Description">
              <TextArea rows={4} maxLength={500} placeholder="Subject scope, level, or curriculum notes" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default DepartmentDetailsPage;
