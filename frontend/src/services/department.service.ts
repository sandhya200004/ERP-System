import apiClient from './apiClient';

export type DepartmentStatus = 'active' | 'inactive' | 'archived';
export type SubjectType = 'core' | 'elective' | 'lab';
export type SubjectStatus = 'active' | 'inactive' | 'archived';
export type ProgramLevel = 'diploma' | 'undergraduate' | 'postgraduate' | 'doctorate' | 'certificate';
export type ProgramStatus = 'active' | 'inactive' | 'archived';
export type SemesterStatus = 'planned' | 'active' | 'completed' | 'archived';
export type CurriculumStatus = 'planned' | 'active' | 'archived';
export type EnrollmentStatus = 'active' | 'promoted' | 'graduated' | 'dropped' | 'deferred';
export type RegistrationStatus = 'registered' | 'dropped' | 'completed';

export interface DepartmentMemberPreview {
  id: string;
  employeeId: string;
  fullName: string;
  designation: string;
  role: string;
  email: string;
  status: string;
}

export interface DepartmentHead {
  id: string;
  employeeId: string;
  designation: string;
  role: string;
  fullName: string;
  email: string;
  phone?: string;
  status: string;
}

export interface DepartmentSubjectTeacher {
  id: string;
  employeeId: string;
  fullName: string;
  designation: string;
  email: string;
  status: string;
}

export interface DepartmentSubject {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  description?: string;
  type: SubjectType;
  status: SubjectStatus;
  teacherProfileId?: string;
  teacher?: DepartmentSubjectTeacher | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramStaffMember {
  id: string;
  employeeId: string;
  fullName: string;
  designation: string;
  email: string;
  status: string;
}

export interface ProgramSemester {
  id: string;
  programId: string;
  semesterNumber: number;
  section?: string;
  academicYear?: string;
  studentCapacity?: number;
  status: SemesterStatus;
  advisorProfileId?: string;
  advisor?: ProgramStaffMember | null;
  curriculumCount: number;
  curriculum: CurriculumSubject[];
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumSubject {
  id: string;
  semesterId: string;
  subjectId: string;
  facultyProfileId?: string;
  academicYear?: string;
  credits: number;
  theoryHours: number;
  labHours: number;
  internalWeightage: number;
  externalWeightage: number;
  isElective: boolean;
  status: CurriculumStatus;
  subject?: {
    id: string;
    name: string;
    code: string;
    type: SubjectType;
  } | null;
  faculty?: ProgramStaffMember | null;
  programId?: string;
  programName?: string;
  semesterNumber?: number;
  section?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentEnrollment {
  id: string;
  studentProfileId: string;
  programId: string;
  semesterId: string;
  rollNumber?: string;
  academicYear?: string;
  admissionDate?: string;
  status: EnrollmentStatus;
  student?: ProgramStaffMember | null;
  program?: {
    id: string;
    name: string;
    code: string;
    level: ProgramLevel;
  } | null;
  semester?: {
    id: string;
    semesterNumber: number;
    section?: string;
    academicYear?: string;
    status: SemesterStatus;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSubjectRegistration {
  id: string;
  studentProfileId: string;
  enrollmentId: string;
  curriculumSubjectId: string;
  registrationDate?: string;
  status: RegistrationStatus;
  isAutoRegistered: boolean;
  student?: ProgramStaffMember | null;
  enrollment?: StudentEnrollment | null;
  curriculumSubject?: CurriculumSubject | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentProgram {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  level: ProgramLevel;
  durationSemesters: number;
  intakeCapacity?: number;
  status: ProgramStatus;
  coordinatorProfileId?: string;
  coordinator?: ProgramStaffMember | null;
  semesterCount: number;
  semesters: ProgramSemester[];
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: DepartmentStatus;
  hodProfileId?: string;
  headOfDepartment?: DepartmentHead | null;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  employeeCount: number;
  staffCount: number;
  studentCount: number;
  subjectCount: number;
  programCount: number;
  semesterCount: number;
  curriculumCount: number;
  memberPreview: DepartmentMemberPreview[];
  subjects: DepartmentSubject[];
  programs: DepartmentProgram[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDto {
  name: string;
  code: string;
  description?: string;
  status?: DepartmentStatus;
  hodProfileId?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  assignedStaffIds?: string[];
  assignedStudentIds?: string[];
}

export interface UpdateDepartmentDto {
  name?: string;
  code?: string;
  description?: string;
  status?: DepartmentStatus;
  hodProfileId?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  assignedStaffIds?: string[];
  assignedStudentIds?: string[];
}

export interface CreateDepartmentSubjectDto {
  name: string;
  code: string;
  description?: string;
  type?: SubjectType;
  status?: SubjectStatus;
  teacherProfileId?: string;
}

export interface UpdateDepartmentSubjectDto {
  name?: string;
  code?: string;
  description?: string;
  type?: SubjectType;
  status?: SubjectStatus;
  teacherProfileId?: string;
}

export interface CreateDepartmentProgramDto {
  name: string;
  code: string;
  level?: ProgramLevel;
  durationSemesters?: number;
  intakeCapacity?: number;
  status?: ProgramStatus;
  coordinatorProfileId?: string;
}

export interface UpdateDepartmentProgramDto {
  name?: string;
  code?: string;
  level?: ProgramLevel;
  durationSemesters?: number;
  intakeCapacity?: number;
  status?: ProgramStatus;
  coordinatorProfileId?: string;
}

export interface CreateProgramSemesterDto {
  semesterNumber: number;
  section?: string;
  academicYear?: string;
  studentCapacity?: number;
  status?: SemesterStatus;
  advisorProfileId?: string;
}

export interface UpdateProgramSemesterDto {
  semesterNumber?: number;
  section?: string;
  academicYear?: string;
  studentCapacity?: number;
  status?: SemesterStatus;
  advisorProfileId?: string;
}

export interface CreateCurriculumSubjectDto {
  subjectId: string;
  facultyProfileId?: string;
  academicYear?: string;
  credits?: number;
  theoryHours?: number;
  labHours?: number;
  internalWeightage?: number;
  externalWeightage?: number;
  isElective?: boolean;
  status?: CurriculumStatus;
}

export interface UpdateCurriculumSubjectDto {
  subjectId?: string;
  facultyProfileId?: string;
  academicYear?: string;
  credits?: number;
  theoryHours?: number;
  labHours?: number;
  internalWeightage?: number;
  externalWeightage?: number;
  isElective?: boolean;
  status?: CurriculumStatus;
}

export interface CreateStudentEnrollmentDto {
  studentProfileId: string;
  programId: string;
  semesterId: string;
  rollNumber?: string;
  academicYear?: string;
  admissionDate?: string;
  status?: EnrollmentStatus;
}

export interface UpdateStudentEnrollmentDto {
  studentProfileId?: string;
  programId?: string;
  semesterId?: string;
  rollNumber?: string;
  academicYear?: string;
  admissionDate?: string;
  status?: EnrollmentStatus;
}

export interface CreateStudentSubjectRegistrationDto {
  studentProfileId: string;
  enrollmentId: string;
  curriculumSubjectId: string;
  registrationDate?: string;
  status?: RegistrationStatus;
  isAutoRegistered?: boolean;
}

export interface UpdateStudentSubjectRegistrationDto {
  studentProfileId?: string;
  enrollmentId?: string;
  curriculumSubjectId?: string;
  registrationDate?: string;
  status?: RegistrationStatus;
  isAutoRegistered?: boolean;
}

export interface AutoRegisterEnrollmentSubjectsDto {
  enrollmentId: string;
  registrationDate?: string;
  status?: RegistrationStatus;
}

export interface AutoRegisterSemesterSubjectsDto {
  semesterId: string;
  registrationDate?: string;
  status?: RegistrationStatus;
}

export interface BulkRegistrationResult {
  message: string;
  createdCount: number;
  skippedCount: number;
  createdRegistrations: StudentSubjectRegistration[];
  skippedSubjects: Array<{
    curriculumSubjectId: string;
    subjectName: string;
    subjectCode: string;
    reason: string;
  }>;
}

export const departmentService = {
  async getAll(): Promise<Department[]> {
    const response = await apiClient.get('/departments');
    return response.data;
  },

  async getById(id: string): Promise<Department> {
    const response = await apiClient.get(`/departments/${id}`);
    return response.data;
  },

  async create(data: CreateDepartmentDto): Promise<Department> {
    const response = await apiClient.post('/departments', data);
    return response.data;
  },

  async update(id: string, data: UpdateDepartmentDto): Promise<Department> {
    const response = await apiClient.patch(`/departments/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/departments/${id}`);
  },

  async getSubjects(departmentId: string): Promise<DepartmentSubject[]> {
    const response = await apiClient.get(`/departments/${departmentId}/subjects`);
    return response.data;
  },

  async createSubject(departmentId: string, data: CreateDepartmentSubjectDto): Promise<DepartmentSubject> {
    const response = await apiClient.post(`/departments/${departmentId}/subjects`, data);
    return response.data;
  },

  async updateSubject(
    departmentId: string,
    subjectId: string,
    data: UpdateDepartmentSubjectDto,
  ): Promise<DepartmentSubject> {
    const response = await apiClient.patch(`/departments/${departmentId}/subjects/${subjectId}`, data);
    return response.data;
  },

  async deleteSubject(departmentId: string, subjectId: string): Promise<void> {
    await apiClient.delete(`/departments/${departmentId}/subjects/${subjectId}`);
  },

  async getPrograms(departmentId: string): Promise<DepartmentProgram[]> {
    const response = await apiClient.get(`/departments/${departmentId}/programs`);
    return response.data;
  },

  async createProgram(departmentId: string, data: CreateDepartmentProgramDto): Promise<DepartmentProgram> {
    const response = await apiClient.post(`/departments/${departmentId}/programs`, data);
    return response.data;
  },

  async updateProgram(
    departmentId: string,
    programId: string,
    data: UpdateDepartmentProgramDto,
  ): Promise<DepartmentProgram> {
    const response = await apiClient.patch(`/departments/${departmentId}/programs/${programId}`, data);
    return response.data;
  },

  async deleteProgram(departmentId: string, programId: string): Promise<void> {
    await apiClient.delete(`/departments/${departmentId}/programs/${programId}`);
  },

  async createProgramSemester(
    departmentId: string,
    programId: string,
    data: CreateProgramSemesterDto,
  ): Promise<ProgramSemester> {
    const response = await apiClient.post(`/departments/${departmentId}/programs/${programId}/semesters`, data);
    return response.data;
  },

  async updateProgramSemester(
    departmentId: string,
    programId: string,
    semesterId: string,
    data: UpdateProgramSemesterDto,
  ): Promise<ProgramSemester> {
    const response = await apiClient.patch(
      `/departments/${departmentId}/programs/${programId}/semesters/${semesterId}`,
      data,
    );
    return response.data;
  },

  async deleteProgramSemester(departmentId: string, programId: string, semesterId: string): Promise<void> {
    await apiClient.delete(`/departments/${departmentId}/programs/${programId}/semesters/${semesterId}`);
  },

  async getCurriculum(departmentId: string): Promise<CurriculumSubject[]> {
    const response = await apiClient.get(`/departments/${departmentId}/curriculum`);
    return response.data;
  },

  async createCurriculumSubject(
    departmentId: string,
    programId: string,
    semesterId: string,
    data: CreateCurriculumSubjectDto,
  ): Promise<CurriculumSubject> {
    const response = await apiClient.post(
      `/departments/${departmentId}/programs/${programId}/semesters/${semesterId}/curriculum`,
      data,
    );
    return response.data;
  },

  async updateCurriculumSubject(
    departmentId: string,
    programId: string,
    semesterId: string,
    curriculumId: string,
    data: UpdateCurriculumSubjectDto,
  ): Promise<CurriculumSubject> {
    const response = await apiClient.patch(
      `/departments/${departmentId}/programs/${programId}/semesters/${semesterId}/curriculum/${curriculumId}`,
      data,
    );
    return response.data;
  },

  async deleteCurriculumSubject(
    departmentId: string,
    programId: string,
    semesterId: string,
    curriculumId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/departments/${departmentId}/programs/${programId}/semesters/${semesterId}/curriculum/${curriculumId}`,
    );
  },

  async getEnrollments(departmentId: string): Promise<StudentEnrollment[]> {
    const response = await apiClient.get(`/departments/${departmentId}/enrollments`);
    return response.data;
  },

  async createEnrollment(departmentId: string, data: CreateStudentEnrollmentDto): Promise<StudentEnrollment> {
    const response = await apiClient.post(`/departments/${departmentId}/enrollments`, data);
    return response.data;
  },

  async updateEnrollment(
    departmentId: string,
    enrollmentId: string,
    data: UpdateStudentEnrollmentDto,
  ): Promise<StudentEnrollment> {
    const response = await apiClient.patch(`/departments/${departmentId}/enrollments/${enrollmentId}`, data);
    return response.data;
  },

  async deleteEnrollment(departmentId: string, enrollmentId: string): Promise<void> {
    await apiClient.delete(`/departments/${departmentId}/enrollments/${enrollmentId}`);
  },

  async getRegistrations(departmentId: string): Promise<StudentSubjectRegistration[]> {
    const response = await apiClient.get(`/departments/${departmentId}/registrations`);
    return response.data;
  },

  async createRegistration(
    departmentId: string,
    data: CreateStudentSubjectRegistrationDto,
  ): Promise<StudentSubjectRegistration> {
    const response = await apiClient.post(`/departments/${departmentId}/registrations`, data);
    return response.data;
  },

  async updateRegistration(
    departmentId: string,
    registrationId: string,
    data: UpdateStudentSubjectRegistrationDto,
  ): Promise<StudentSubjectRegistration> {
    const response = await apiClient.patch(`/departments/${departmentId}/registrations/${registrationId}`, data);
    return response.data;
  },

  async deleteRegistration(departmentId: string, registrationId: string): Promise<void> {
    await apiClient.delete(`/departments/${departmentId}/registrations/${registrationId}`);
  },

  async autoRegisterEnrollmentSubjects(
    departmentId: string,
    data: AutoRegisterEnrollmentSubjectsDto,
  ): Promise<BulkRegistrationResult> {
    const response = await apiClient.post(`/departments/${departmentId}/registrations/auto/enrollment`, data);
    return response.data;
  },

  async autoRegisterSemesterSubjects(
    departmentId: string,
    data: AutoRegisterSemesterSubjectsDto,
  ): Promise<BulkRegistrationResult> {
    const response = await apiClient.post(`/departments/${departmentId}/registrations/auto/semester`, data);
    return response.data;
  },
};
