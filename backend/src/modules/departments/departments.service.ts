import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  AutoRegisterEnrollmentSubjectsDto,
  AutoRegisterSemesterSubjectsDto,
  CreateDepartmentDto,
  CreateDepartmentProgramDto,
  CreateDepartmentSubjectDto,
  CreateCurriculumSubjectDto,
  CreateProgramSemesterDto,
  CreateStudentEnrollmentDto,
  CreateStudentSubjectRegistrationDto,
  UpdateDepartmentDto,
  UpdateDepartmentProgramDto,
  UpdateDepartmentSubjectDto,
  UpdateCurriculumSubjectDto,
  UpdateProgramSemesterDto,
  UpdateStudentEnrollmentDto,
  UpdateStudentSubjectRegistrationDto,
} from './dto/department.dto';

interface NormalizedDepartmentInput {
  name: string;
  code: string;
  description: string | null;
  status: string;
  hodProfileId: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  location: string | null;
  assignedStaffIds: string[];
  assignedStudentIds: string[];
}

interface NormalizedSubjectInput {
  name: string;
  code: string;
  description: string | null;
  type: string;
  status: string;
  teacherProfileId: string | null;
}

interface NormalizedProgramInput {
  name: string;
  code: string;
  level: string;
  durationSemesters: number;
  intakeCapacity: number | null;
  status: string;
  coordinatorProfileId: string | null;
}

interface NormalizedSemesterInput {
  semesterNumber: number;
  section: string | null;
  academicYear: string | null;
  studentCapacity: number | null;
  status: string;
  advisorProfileId: string | null;
}

interface NormalizedCurriculumInput {
  subjectId: string;
  facultyProfileId: string | null;
  academicYear: string | null;
  credits: number;
  theoryHours: number;
  labHours: number;
  internalWeightage: number;
  externalWeightage: number;
  isElective: boolean;
  status: string;
}

interface NormalizedEnrollmentInput {
  studentProfileId: string;
  programId: string;
  semesterId: string;
  rollNumber: string | null;
  academicYear: string | null;
  admissionDate: Date | null;
  status: string;
}

interface NormalizedRegistrationInput {
  studentProfileId: string;
  enrollmentId: string;
  curriculumSubjectId: string;
  registrationDate: Date | null;
  status: string;
  isAutoRegistered: boolean;
}

interface RegistrationBatchResult {
  createdCount: number;
  skippedCount: number;
  createdRegistrations: any[];
  skippedSubjects: Array<{
    curriculumSubjectId: string;
    subjectName: string;
    subjectCode: string;
    reason: string;
  }>;
}

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const departments = await (this.prisma.department as any).findMany({
      include: {
        headOfDepartment: {
          include: {
            users: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                status: true,
              },
            },
          },
        },
        subjects: {
          include: {
            teacher: {
              include: {
                users: {
                  select: {
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone: true,
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: [{ name: 'asc' }],
        },
        programs: {
          include: this.programInclude,
          orderBy: [{ name: 'asc' }],
        },
      },
      orderBy: [{ name: 'asc' }],
    });

    const employeeProfiles = await this.prisma.employee_profiles.findMany({
      where: {
        department: {
          in: departments.map((department: any) => department.name),
        },
      },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    return departments.map((department: any) =>
      this.buildDepartmentResponse(
        department,
        employeeProfiles.filter(
          (employee) =>
            employee.department.trim().toLowerCase() === department.name.trim().toLowerCase(),
        ),
      ),
    );
  }

  async findOne(id: string) {
    const department = await this.getDepartmentWithRelations(id);

    const employees = await this.prisma.employee_profiles.findMany({
      where: {
        department: department.name,
      },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { created_at: 'desc' }],
    });

    return this.buildDepartmentResponse(department, employees);
  }

  async create(data: CreateDepartmentDto) {
    const payload = this.normalizeDepartmentInput(data);
    const departmentData = this.getDepartmentPersistenceData(payload);
    await this.ensureUniqueDepartment(payload.name, payload.code);
    await this.validateHeadOfDepartment(payload.hodProfileId, payload.name);

    return this.prisma.$transaction(async (tx) => {
      const department = await (tx.department as any).create({
        data: departmentData,
        include: {
          headOfDepartment: {
            include: {
              users: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone: true,
                  status: true,
                },
              },
            },
          },
          subjects: {
            include: {
              teacher: {
                include: {
                  users: {
                    select: {
                      first_name: true,
                      last_name: true,
                      email: true,
                      phone: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
          programs: {
            include: this.programInclude,
          },
        },
      });

      await this.syncDepartmentMembers(tx, payload.name, payload.assignedStaffIds, payload.assignedStudentIds);

      const employees = await tx.employee_profiles.findMany({
        where: { department: payload.name },
        include: {
          users: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              status: true,
            },
          },
        },
      });

      return this.buildDepartmentResponse(department, employees);
    });
  }

  async update(id: string, data: UpdateDepartmentDto) {
    const existingDepartment = await (this.prisma.department as any).findUnique({
      where: { id },
      include: {
        subjects: true,
      },
    });

    if (!existingDepartment) {
      throw new NotFoundException('Department not found');
    }

    const payload = this.normalizeDepartmentInput({
      name: data.name ?? existingDepartment.name,
      code: data.code ?? existingDepartment.code,
      description: data.description ?? existingDepartment.description ?? undefined,
      status: data.status ?? existingDepartment.status,
      hodProfileId:
        data.hodProfileId !== undefined ? data.hodProfileId : existingDepartment.hodProfileId ?? undefined,
      contactEmail:
        data.contactEmail !== undefined ? data.contactEmail : existingDepartment.contactEmail ?? undefined,
      contactPhone:
        data.contactPhone !== undefined ? data.contactPhone : existingDepartment.contactPhone ?? undefined,
      location: data.location !== undefined ? data.location : existingDepartment.location ?? undefined,
      assignedStaffIds: data.assignedStaffIds,
      assignedStudentIds: data.assignedStudentIds,
    });
    const departmentData = this.getDepartmentPersistenceData(payload);

    await this.ensureUniqueDepartment(payload.name, payload.code, id);
    await this.validateHeadOfDepartment(payload.hodProfileId, payload.name, id);

    return this.prisma.$transaction(async (tx) => {
      const updatedDepartment = await (tx.department as any).update({
        where: { id },
        data: departmentData,
        include: {
          headOfDepartment: {
            include: {
              users: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone: true,
                  status: true,
                },
              },
            },
          },
          subjects: {
            include: {
              teacher: {
                include: {
                  users: {
                    select: {
                      first_name: true,
                      last_name: true,
                      email: true,
                      phone: true,
                      status: true,
                    },
                  },
                },
              },
            },
            orderBy: [{ name: 'asc' }],
          },
          programs: {
            include: this.programInclude,
            orderBy: [{ name: 'asc' }],
          },
        },
      });

      if (existingDepartment.name !== payload.name) {
        await tx.employee_profiles.updateMany({
          where: { department: existingDepartment.name },
          data: { department: payload.name },
        });
      }

      await this.syncDepartmentMembers(tx, payload.name, payload.assignedStaffIds, payload.assignedStudentIds);

      const employees = await tx.employee_profiles.findMany({
        where: { department: payload.name },
        include: {
          users: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              status: true,
            },
          },
        },
      });

      return this.buildDepartmentResponse(updatedDepartment, employees);
    });
  }

  async remove(id: string) {
    const department = await (this.prisma.department as any).findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const employeeCount = await this.prisma.employee_profiles.count({
      where: { department: department.name },
    });

    if (employeeCount > 0) {
      throw new BadRequestException(
        `Cannot delete department with ${employeeCount} assigned employee${employeeCount > 1 ? 's' : ''}`,
      );
    }

    await (this.prisma.department as any).delete({
      where: { id },
    });

    return { message: 'Department deleted successfully' };
  }

  async findSubjects(departmentId: string) {
    const department = await this.getDepartmentWithRelations(departmentId);
    return department.subjects.map((subject: any) => this.buildSubjectResponse(subject));
  }

  async createSubject(departmentId: string, data: CreateDepartmentSubjectDto) {
    const department = await this.ensureDepartmentExists(departmentId);
    const payload = this.normalizeSubjectInput(data);

    await this.ensureUniqueSubjectCode(departmentId, payload.code);
    await this.validateSubjectTeacher(payload.teacherProfileId, department.name);

    const subject = await ((this.prisma as any).departmentSubject).create({
      data: {
        departmentId,
        ...payload,
      },
      include: this.subjectInclude,
    });

    return this.buildSubjectResponse(subject);
  }

  async updateSubject(departmentId: string, subjectId: string, data: UpdateDepartmentSubjectDto) {
    const department = await this.ensureDepartmentExists(departmentId);
    const subject = await ((this.prisma as any).departmentSubject).findFirst({
      where: {
        id: subjectId,
        departmentId,
      },
      include: this.subjectInclude,
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const payload = this.normalizeSubjectInput({
      name: data.name ?? subject.name,
      code: data.code ?? subject.code,
      description: data.description ?? subject.description ?? undefined,
      type: data.type ?? subject.type,
      status: data.status ?? subject.status,
      teacherProfileId:
        data.teacherProfileId !== undefined ? data.teacherProfileId : subject.teacherProfileId ?? undefined,
    });

    await this.ensureUniqueSubjectCode(departmentId, payload.code, subjectId);
    await this.validateSubjectTeacher(payload.teacherProfileId, department.name);

    const updatedSubject = await ((this.prisma as any).departmentSubject).update({
      where: { id: subjectId },
      data: payload,
      include: this.subjectInclude,
    });

    return this.buildSubjectResponse(updatedSubject);
  }

  async removeSubject(departmentId: string, subjectId: string) {
    const subject = await ((this.prisma as any).departmentSubject).findFirst({
      where: {
        id: subjectId,
        departmentId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    await ((this.prisma as any).departmentSubject).delete({
      where: { id: subjectId },
    });

    return { message: 'Subject deleted successfully' };
  }

  async findPrograms(departmentId: string) {
    const department = await this.getDepartmentWithRelations(departmentId);
    return (department.programs ?? []).map((program: any) => this.buildProgramResponse(program));
  }

  async createProgram(departmentId: string, data: CreateDepartmentProgramDto) {
    const department = await this.ensureDepartmentExists(departmentId);
    const payload = this.normalizeProgramInput(data);

    await this.ensureUniqueProgramCode(departmentId, payload.code);
    await this.validateDepartmentStaffMember(payload.coordinatorProfileId, department.name, 'Program coordinator');

    const program = await ((this.prisma as any).departmentProgram).create({
      data: {
        departmentId,
        ...payload,
      },
      include: this.programInclude,
    });

    return this.buildProgramResponse(program);
  }

  async updateProgram(departmentId: string, programId: string, data: UpdateDepartmentProgramDto) {
    const department = await this.ensureDepartmentExists(departmentId);
    const program = await ((this.prisma as any).departmentProgram).findFirst({
      where: { id: programId, departmentId },
      include: this.programInclude,
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    const payload = this.normalizeProgramInput({
      name: data.name ?? program.name,
      code: data.code ?? program.code,
      level: data.level ?? program.level,
      durationSemesters: data.durationSemesters ?? program.durationSemesters,
      intakeCapacity: data.intakeCapacity ?? program.intakeCapacity ?? undefined,
      status: data.status ?? program.status,
      coordinatorProfileId:
        data.coordinatorProfileId !== undefined ? data.coordinatorProfileId : program.coordinatorProfileId ?? undefined,
    });

    await this.ensureUniqueProgramCode(departmentId, payload.code, programId);
    await this.validateDepartmentStaffMember(payload.coordinatorProfileId, department.name, 'Program coordinator');

    const updatedProgram = await ((this.prisma as any).departmentProgram).update({
      where: { id: programId },
      data: payload,
      include: this.programInclude,
    });

    return this.buildProgramResponse(updatedProgram);
  }

  async removeProgram(departmentId: string, programId: string) {
    const program = await ((this.prisma as any).departmentProgram).findFirst({
      where: { id: programId, departmentId },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    await ((this.prisma as any).departmentProgram).delete({ where: { id: programId } });
    return { message: 'Program deleted successfully' };
  }

  async findProgramSemesters(departmentId: string, programId: string) {
    await this.ensureProgramExists(departmentId, programId);
    const semesters = await ((this.prisma as any).programSemester).findMany({
      where: { programId },
      include: this.semesterInclude,
      orderBy: [{ semesterNumber: 'asc' }, { section: 'asc' }],
    });

    return semesters.map((semester: any) => this.buildSemesterResponse(semester));
  }

  async createProgramSemester(departmentId: string, programId: string, data: CreateProgramSemesterDto) {
    const program = await this.ensureProgramExists(departmentId, programId);
    const payload = this.normalizeSemesterInput(data);

    await this.ensureUniqueSemester(programId, payload.semesterNumber, payload.section);
    await this.validateDepartmentStaffMember(payload.advisorProfileId, program.department.name, 'Semester advisor');

    const semester = await ((this.prisma as any).programSemester).create({
      data: {
        programId,
        ...payload,
      },
      include: this.semesterInclude,
    });

    return this.buildSemesterResponse(semester);
  }

  async updateProgramSemester(
    departmentId: string,
    programId: string,
    semesterId: string,
    data: UpdateProgramSemesterDto,
  ) {
    const program = await this.ensureProgramExists(departmentId, programId);
    const semester = await ((this.prisma as any).programSemester).findFirst({
      where: { id: semesterId, programId },
      include: this.semesterInclude,
    });

    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    const payload = this.normalizeSemesterInput({
      semesterNumber: data.semesterNumber ?? semester.semesterNumber,
      section: data.section ?? semester.section ?? undefined,
      academicYear: data.academicYear ?? semester.academicYear ?? undefined,
      studentCapacity: data.studentCapacity ?? semester.studentCapacity ?? undefined,
      status: data.status ?? semester.status,
      advisorProfileId:
        data.advisorProfileId !== undefined ? data.advisorProfileId : semester.advisorProfileId ?? undefined,
    });

    await this.ensureUniqueSemester(programId, payload.semesterNumber, payload.section, semesterId);
    await this.validateDepartmentStaffMember(payload.advisorProfileId, program.department.name, 'Semester advisor');

    const updatedSemester = await ((this.prisma as any).programSemester).update({
      where: { id: semesterId },
      data: payload,
      include: this.semesterInclude,
    });

    return this.buildSemesterResponse(updatedSemester);
  }

  async removeProgramSemester(departmentId: string, programId: string, semesterId: string) {
    await this.ensureProgramExists(departmentId, programId);
    const semester = await ((this.prisma as any).programSemester).findFirst({
      where: { id: semesterId, programId },
    });

    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    await ((this.prisma as any).programSemester).delete({ where: { id: semesterId } });
    return { message: 'Semester deleted successfully' };
  }

  async findCurriculum(departmentId: string) {
    const department = await this.getDepartmentWithRelations(departmentId);
    return (department.programs ?? []).flatMap((program: any) =>
      (program.semesters ?? []).flatMap((semester: any) =>
        (semester.curriculum ?? []).map((item: any) =>
          this.buildCurriculumResponse(item, {
            programId: program.id,
            programName: program.name,
            semesterNumber: semester.semesterNumber,
            section: semester.section,
          }),
        ),
      ),
    );
  }

  async createCurriculumSubject(
    departmentId: string,
    programId: string,
    semesterId: string,
    data: CreateCurriculumSubjectDto,
  ) {
    const semester = await this.ensureSemesterExists(departmentId, programId, semesterId);
    const payload = this.normalizeCurriculumInput(data);

    await this.ensureCurriculumSubjectBelongsToDepartment(payload.subjectId, departmentId);
    await this.ensureUniqueCurriculumSubject(semesterId, payload.subjectId);
    await this.validateDepartmentStaffMember(payload.facultyProfileId, semester.program.department.name, 'Curriculum faculty');

    const item = await ((this.prisma as any).curriculumSubject).create({
      data: {
        semesterId,
        ...payload,
      },
      include: this.curriculumInclude,
    });

    return this.buildCurriculumResponse(item, {
      programId: semester.program.id,
      programName: semester.program.name,
      semesterNumber: semester.semesterNumber,
      section: semester.section,
    });
  }

  async updateCurriculumSubject(
    departmentId: string,
    programId: string,
    semesterId: string,
    curriculumId: string,
    data: UpdateCurriculumSubjectDto,
  ) {
    const semester = await this.ensureSemesterExists(departmentId, programId, semesterId);
    const existingItem = await ((this.prisma as any).curriculumSubject).findFirst({
      where: {
        id: curriculumId,
        semesterId,
      },
      include: this.curriculumInclude,
    });

    if (!existingItem) {
      throw new NotFoundException('Curriculum subject not found');
    }

    const payload = this.normalizeCurriculumInput({
      subjectId: data.subjectId ?? existingItem.subjectId,
      facultyProfileId:
        data.facultyProfileId !== undefined ? data.facultyProfileId : existingItem.facultyProfileId ?? undefined,
      academicYear: data.academicYear ?? existingItem.academicYear ?? undefined,
      credits: data.credits ?? existingItem.credits,
      theoryHours: data.theoryHours ?? existingItem.theoryHours,
      labHours: data.labHours ?? existingItem.labHours,
      internalWeightage: data.internalWeightage ?? existingItem.internalWeightage,
      externalWeightage: data.externalWeightage ?? existingItem.externalWeightage,
      isElective: data.isElective ?? existingItem.isElective,
      status: data.status ?? existingItem.status,
    });

    await this.ensureCurriculumSubjectBelongsToDepartment(payload.subjectId, departmentId);
    await this.ensureUniqueCurriculumSubject(semesterId, payload.subjectId, curriculumId);
    await this.validateDepartmentStaffMember(payload.facultyProfileId, semester.program.department.name, 'Curriculum faculty');

    const item = await ((this.prisma as any).curriculumSubject).update({
      where: { id: curriculumId },
      data: payload,
      include: this.curriculumInclude,
    });

    return this.buildCurriculumResponse(item, {
      programId: semester.program.id,
      programName: semester.program.name,
      semesterNumber: semester.semesterNumber,
      section: semester.section,
    });
  }

  async removeCurriculumSubject(
    departmentId: string,
    programId: string,
    semesterId: string,
    curriculumId: string,
  ) {
    await this.ensureSemesterExists(departmentId, programId, semesterId);
    const existingItem = await ((this.prisma as any).curriculumSubject).findFirst({
      where: {
        id: curriculumId,
        semesterId,
      },
    });

    if (!existingItem) {
      throw new NotFoundException('Curriculum subject not found');
    }

    await ((this.prisma as any).curriculumSubject).delete({ where: { id: curriculumId } });
    return { message: 'Curriculum subject deleted successfully' };
  }

  async findEnrollments(departmentId: string) {
    await this.ensureDepartmentExists(departmentId);
    const enrollments = await ((this.prisma as any).studentEnrollment).findMany({
      where: {
        program: {
          departmentId,
        },
      },
      include: this.enrollmentInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return enrollments.map((enrollment: any) => this.buildEnrollmentResponse(enrollment));
  }

  async createEnrollment(departmentId: string, data: CreateStudentEnrollmentDto) {
    await this.ensureDepartmentExists(departmentId);
    const payload = this.normalizeEnrollmentInput(data);
    await this.validateEnrollment(payload, departmentId);

    const enrollment = await ((this.prisma as any).studentEnrollment).create({
      data: payload,
      include: this.enrollmentInclude,
    });

    return this.buildEnrollmentResponse(enrollment);
  }

  async updateEnrollment(departmentId: string, enrollmentId: string, data: UpdateStudentEnrollmentDto) {
    await this.ensureDepartmentExists(departmentId);
    const existingEnrollment = await ((this.prisma as any).studentEnrollment).findFirst({
      where: {
        id: enrollmentId,
        program: {
          departmentId,
        },
      },
      include: this.enrollmentInclude,
    });

    if (!existingEnrollment) {
      throw new NotFoundException('Student enrollment not found');
    }

    const payload = this.normalizeEnrollmentInput({
      studentProfileId: data.studentProfileId ?? existingEnrollment.studentProfileId,
      programId: data.programId ?? existingEnrollment.programId,
      semesterId: data.semesterId ?? existingEnrollment.semesterId,
      rollNumber: data.rollNumber ?? existingEnrollment.rollNumber ?? undefined,
      academicYear: data.academicYear ?? existingEnrollment.academicYear ?? undefined,
      admissionDate:
        data.admissionDate !== undefined
          ? data.admissionDate
          : existingEnrollment.admissionDate
            ? existingEnrollment.admissionDate.toISOString().slice(0, 10)
            : undefined,
      status: data.status ?? existingEnrollment.status,
    });

    await this.validateEnrollment(payload, departmentId, enrollmentId);

    const updatedEnrollment = await ((this.prisma as any).studentEnrollment).update({
      where: { id: enrollmentId },
      data: payload,
      include: this.enrollmentInclude,
    });

    return this.buildEnrollmentResponse(updatedEnrollment);
  }

  async removeEnrollment(departmentId: string, enrollmentId: string) {
    await this.ensureDepartmentExists(departmentId);
    const existingEnrollment = await ((this.prisma as any).studentEnrollment).findFirst({
      where: {
        id: enrollmentId,
        program: {
          departmentId,
        },
      },
    });

    if (!existingEnrollment) {
      throw new NotFoundException('Student enrollment not found');
    }

    await ((this.prisma as any).studentEnrollment).delete({
      where: { id: enrollmentId },
    });

    return { message: 'Student enrollment deleted successfully' };
  }

  async findRegistrations(departmentId: string) {
    await this.ensureDepartmentExists(departmentId);
    const registrations = await ((this.prisma as any).studentSubjectRegistration).findMany({
      where: {
        enrollment: {
          program: {
            departmentId,
          },
        },
      },
      include: this.registrationInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return registrations.map((registration: any) => this.buildRegistrationResponse(registration));
  }

  async createRegistration(departmentId: string, data: CreateStudentSubjectRegistrationDto) {
    await this.ensureDepartmentExists(departmentId);
    const payload = this.normalizeRegistrationInput(data);
    await this.validateRegistration(payload, departmentId);

    const registration = await ((this.prisma as any).studentSubjectRegistration).create({
      data: payload,
      include: this.registrationInclude,
    });

    return this.buildRegistrationResponse(registration);
  }

  async updateRegistration(
    departmentId: string,
    registrationId: string,
    data: UpdateStudentSubjectRegistrationDto,
  ) {
    await this.ensureDepartmentExists(departmentId);
    const existingRegistration = await ((this.prisma as any).studentSubjectRegistration).findFirst({
      where: {
        id: registrationId,
        enrollment: {
          program: {
            departmentId,
          },
        },
      },
      include: this.registrationInclude,
    });

    if (!existingRegistration) {
      throw new NotFoundException('Student registration not found');
    }

    const payload = this.normalizeRegistrationInput({
      studentProfileId: data.studentProfileId ?? existingRegistration.studentProfileId,
      enrollmentId: data.enrollmentId ?? existingRegistration.enrollmentId,
      curriculumSubjectId: data.curriculumSubjectId ?? existingRegistration.curriculumSubjectId,
      registrationDate:
        data.registrationDate !== undefined
          ? data.registrationDate
          : existingRegistration.registrationDate
            ? existingRegistration.registrationDate.toISOString().slice(0, 10)
            : undefined,
      status: data.status ?? existingRegistration.status,
      isAutoRegistered:
        data.isAutoRegistered !== undefined ? data.isAutoRegistered : existingRegistration.isAutoRegistered,
    });

    await this.validateRegistration(payload, departmentId, registrationId);

    const registration = await ((this.prisma as any).studentSubjectRegistration).update({
      where: { id: registrationId },
      data: payload,
      include: this.registrationInclude,
    });

    return this.buildRegistrationResponse(registration);
  }

  async removeRegistration(departmentId: string, registrationId: string) {
    await this.ensureDepartmentExists(departmentId);
    const existingRegistration = await ((this.prisma as any).studentSubjectRegistration).findFirst({
      where: {
        id: registrationId,
        enrollment: {
          program: {
            departmentId,
          },
        },
      },
    });

    if (!existingRegistration) {
      throw new NotFoundException('Student registration not found');
    }

    await ((this.prisma as any).studentSubjectRegistration).delete({
      where: { id: registrationId },
    });

    return { message: 'Student registration deleted successfully' };
  }

  async autoRegisterEnrollmentSubjects(departmentId: string, data: AutoRegisterEnrollmentSubjectsDto) {
    await this.ensureDepartmentExists(departmentId);
    const result = await this.createAutoRegistrationsForEnrollment(departmentId, data.enrollmentId, {
      registrationDate: data.registrationDate ? new Date(data.registrationDate) : null,
      status: data.status ?? 'registered',
    });

    return {
      message: `Auto registration completed for the selected student. ${result.createdCount} created, ${result.skippedCount} skipped.`,
      ...result,
      createdRegistrations: result.createdRegistrations.map((registration) => this.buildRegistrationResponse(registration)),
    };
  }

  async autoRegisterSemesterSubjects(departmentId: string, data: AutoRegisterSemesterSubjectsDto) {
    await this.ensureDepartmentExists(departmentId);

    const enrollments = await ((this.prisma as any).studentEnrollment).findMany({
      where: {
        semesterId: data.semesterId,
        program: {
          departmentId,
        },
      },
      include: this.enrollmentInclude,
      orderBy: [{ createdAt: 'asc' }],
    });

    if (enrollments.length === 0) {
      throw new BadRequestException('No student enrollments were found for the selected semester cohort');
    }

    const combined: RegistrationBatchResult = {
      createdCount: 0,
      skippedCount: 0,
      createdRegistrations: [],
      skippedSubjects: [],
    };

    for (const enrollment of enrollments) {
      const result = await this.createAutoRegistrationsForEnrollment(departmentId, enrollment.id, {
        registrationDate: data.registrationDate ? new Date(data.registrationDate) : null,
        status: data.status ?? 'registered',
      });

      combined.createdCount += result.createdCount;
      combined.skippedCount += result.skippedCount;
      combined.createdRegistrations.push(...result.createdRegistrations);
      combined.skippedSubjects.push(
        ...result.skippedSubjects.map((subject) => ({
          ...subject,
          reason: `${enrollment.student?.employee_id ?? enrollment.studentProfileId}: ${subject.reason}`,
        })),
      );
    }

    return {
      message: `Auto registration completed for the cohort. ${combined.createdCount} created, ${combined.skippedCount} skipped.`,
      ...combined,
      createdRegistrations: combined.createdRegistrations.map((registration) => this.buildRegistrationResponse(registration)),
    };
  }

  private readonly subjectInclude = {
    teacher: {
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    },
  };

  private readonly curriculumInclude = {
    subject: {
      include: this.subjectInclude,
    },
    faculty: {
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            status: true,
          },
        },
      },
    },
  };

  private readonly semesterInclude = {
    advisor: {
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            status: true,
          },
        },
      },
    },
    curriculum: {
      include: this.curriculumInclude,
      orderBy: [{ createdAt: 'asc' }],
    },
  };

  private readonly programInclude = {
    coordinator: {
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            status: true,
          },
        },
      },
    },
    semesters: {
      include: this.semesterInclude,
      orderBy: [{ semesterNumber: 'asc' }, { section: 'asc' }],
    },
  };

  private readonly enrollmentInclude = {
    student: {
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            status: true,
          },
        },
      },
    },
    program: true,
    semester: true,
  };

  private readonly registrationInclude = {
    student: {
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            status: true,
          },
        },
      },
    },
    enrollment: {
      include: this.enrollmentInclude,
    },
    curriculumSubject: {
      include: this.curriculumInclude,
    },
  };

  private async getDepartmentWithRelations(id: string) {
    const department = await (this.prisma.department as any).findUnique({
      where: { id },
      include: {
        headOfDepartment: {
          include: {
            users: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                status: true,
              },
            },
          },
        },
        subjects: {
          include: this.subjectInclude,
          orderBy: [{ name: 'asc' }],
        },
        programs: {
          include: this.programInclude,
          orderBy: [{ name: 'asc' }],
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  private async ensureDepartmentExists(id: string) {
    const department = await (this.prisma.department as any).findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  private async ensureProgramExists(departmentId: string, programId: string) {
    const program = await ((this.prisma as any).departmentProgram).findFirst({
      where: { id: programId, departmentId },
      include: {
        department: true,
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return program;
  }

  private async ensureSemesterExists(departmentId: string, programId: string, semesterId: string) {
    const semester = await ((this.prisma as any).programSemester).findFirst({
      where: { id: semesterId, programId },
      include: {
        program: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!semester || semester.program.departmentId !== departmentId) {
      throw new NotFoundException('Semester not found');
    }

    return semester;
  }

  private normalizeDepartmentInput(
    data: Partial<CreateDepartmentDto> & Pick<CreateDepartmentDto, 'name' | 'code'>,
  ): NormalizedDepartmentInput {
    const assignedStaffIds = Array.from(new Set((data.assignedStaffIds ?? []).filter(Boolean)));
    const assignedStudentIds = Array.from(new Set((data.assignedStudentIds ?? []).filter(Boolean)));

    if (data.hodProfileId && !assignedStaffIds.includes(data.hodProfileId)) {
      assignedStaffIds.push(data.hodProfileId);
    }

    return {
      name: data.name.trim().replace(/\s+/g, ' '),
      code: data.code.trim().toUpperCase(),
      description: data.description?.trim() || null,
      status: data.status ?? 'active',
      hodProfileId: data.hodProfileId || null,
      contactEmail: data.contactEmail?.trim().toLowerCase() || null,
      contactPhone: data.contactPhone?.trim() || null,
      location: data.location?.trim() || null,
      assignedStaffIds,
      assignedStudentIds,
    };
  }

  private normalizeSubjectInput(
    data: Partial<CreateDepartmentSubjectDto> & Pick<CreateDepartmentSubjectDto, 'name' | 'code'>,
  ): NormalizedSubjectInput {
    return {
      name: data.name.trim().replace(/\s+/g, ' '),
      code: data.code.trim().toUpperCase(),
      description: data.description?.trim() || null,
      type: data.type ?? 'core',
      status: data.status ?? 'active',
      teacherProfileId: data.teacherProfileId || null,
    };
  }

  private normalizeProgramInput(
    data: Partial<CreateDepartmentProgramDto> & Pick<CreateDepartmentProgramDto, 'name' | 'code'>,
  ): NormalizedProgramInput {
    const durationSemesters = Number(data.durationSemesters ?? 8);
    if (!Number.isInteger(durationSemesters) || durationSemesters < 1 || durationSemesters > 20) {
      throw new BadRequestException('Program duration must be between 1 and 20 semesters');
    }

    const intakeCapacity =
      data.intakeCapacity !== undefined && data.intakeCapacity !== null && data.intakeCapacity !== ('' as any)
        ? Number(data.intakeCapacity)
        : null;

    if (intakeCapacity !== null && (!Number.isInteger(intakeCapacity) || intakeCapacity < 1 || intakeCapacity > 5000)) {
      throw new BadRequestException('Program intake capacity must be between 1 and 5000');
    }

    return {
      name: data.name.trim().replace(/\s+/g, ' '),
      code: data.code.trim().toUpperCase(),
      level: data.level ?? 'undergraduate',
      durationSemesters,
      intakeCapacity,
      status: data.status ?? 'active',
      coordinatorProfileId: data.coordinatorProfileId || null,
    };
  }

  private normalizeSemesterInput(
    data: Partial<CreateProgramSemesterDto> & Pick<CreateProgramSemesterDto, 'semesterNumber'>,
  ): NormalizedSemesterInput {
    const semesterNumber = Number(data.semesterNumber);
    if (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 20) {
      throw new BadRequestException('Semester number must be between 1 and 20');
    }

    const studentCapacity =
      data.studentCapacity !== undefined && data.studentCapacity !== null && data.studentCapacity !== ('' as any)
        ? Number(data.studentCapacity)
        : null;

    if (studentCapacity !== null && (!Number.isInteger(studentCapacity) || studentCapacity < 1 || studentCapacity > 5000)) {
      throw new BadRequestException('Semester capacity must be between 1 and 5000');
    }

    return {
      semesterNumber,
      section: data.section?.trim().toUpperCase() || null,
      academicYear: data.academicYear?.trim() || null,
      studentCapacity,
      status: data.status ?? 'planned',
      advisorProfileId: data.advisorProfileId || null,
    };
  }

  private normalizeCurriculumInput(
    data: Partial<CreateCurriculumSubjectDto> & Pick<CreateCurriculumSubjectDto, 'subjectId'>,
  ): NormalizedCurriculumInput {
    const toBoundedInt = (value: unknown, fallback: number, label: string, min: number, max: number) => {
      const parsed = Number(value ?? fallback);
      if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        throw new BadRequestException(`${label} must be between ${min} and ${max}`);
      }
      return parsed;
    };

    const internalWeightage = toBoundedInt(data.internalWeightage, 40, 'Internal weightage', 0, 100);
    const externalWeightage = toBoundedInt(data.externalWeightage, 60, 'External weightage', 0, 100);

    if (internalWeightage + externalWeightage !== 100) {
      throw new BadRequestException('Internal and external weightage must total 100');
    }

    return {
      subjectId: data.subjectId,
      facultyProfileId: data.facultyProfileId || null,
      academicYear: data.academicYear?.trim() || null,
      credits: toBoundedInt(data.credits, 4, 'Credits', 1, 20),
      theoryHours: toBoundedInt(data.theoryHours, 3, 'Theory hours', 0, 20),
      labHours: toBoundedInt(data.labHours, 0, 'Lab hours', 0, 20),
      internalWeightage,
      externalWeightage,
      isElective: Boolean(data.isElective),
      status: data.status ?? 'active',
    };
  }

  private normalizeEnrollmentInput(
    data: Partial<CreateStudentEnrollmentDto> &
      Pick<CreateStudentEnrollmentDto, 'studentProfileId' | 'programId' | 'semesterId'>,
  ): NormalizedEnrollmentInput {
    return {
      studentProfileId: data.studentProfileId,
      programId: data.programId,
      semesterId: data.semesterId,
      rollNumber: data.rollNumber?.trim() || null,
      academicYear: data.academicYear?.trim() || null,
      admissionDate: data.admissionDate ? new Date(data.admissionDate) : null,
      status: data.status ?? 'active',
    };
  }

  private normalizeRegistrationInput(
    data: Partial<CreateStudentSubjectRegistrationDto> &
      Pick<CreateStudentSubjectRegistrationDto, 'studentProfileId' | 'enrollmentId' | 'curriculumSubjectId'>,
  ): NormalizedRegistrationInput {
    return {
      studentProfileId: data.studentProfileId,
      enrollmentId: data.enrollmentId,
      curriculumSubjectId: data.curriculumSubjectId,
      registrationDate: data.registrationDate ? new Date(data.registrationDate) : null,
      status: data.status ?? 'registered',
      isAutoRegistered: Boolean(data.isAutoRegistered),
    };
  }

  private async createAutoRegistrationsForEnrollment(
    departmentId: string,
    enrollmentId: string,
    options: { registrationDate: Date | null; status: string },
  ): Promise<RegistrationBatchResult> {
    const enrollment = await ((this.prisma as any).studentEnrollment).findFirst({
      where: {
        id: enrollmentId,
        program: {
          departmentId,
        },
      },
      include: this.enrollmentInclude,
    });

    if (!enrollment) {
      throw new BadRequestException('Selected enrollment does not belong to this department');
    }

    const coreCurriculumItems = await ((this.prisma as any).curriculumSubject).findMany({
      where: {
        semesterId: enrollment.semesterId,
        isElective: false,
        status: {
          not: 'archived',
        },
      },
      include: this.curriculumInclude,
      orderBy: [{ createdAt: 'asc' }],
    });

    if (coreCurriculumItems.length === 0) {
      throw new BadRequestException('No active core curriculum subjects were found for the selected enrollment');
    }

    const existingRegistrations = await ((this.prisma as any).studentSubjectRegistration).findMany({
      where: {
        studentProfileId: enrollment.studentProfileId,
        curriculumSubjectId: {
          in: coreCurriculumItems.map((item: any) => item.id),
        },
      },
      select: {
        curriculumSubjectId: true,
      },
    });

    const existingIds = new Set(existingRegistrations.map((registration: any) => registration.curriculumSubjectId));
    const itemsToCreate = coreCurriculumItems.filter((item: any) => !existingIds.has(item.id));
    const skippedSubjects = coreCurriculumItems
      .filter((item: any) => existingIds.has(item.id))
      .map((item: any) => ({
        curriculumSubjectId: item.id,
        subjectName: item.subject?.name ?? 'Subject',
        subjectCode: item.subject?.code ?? '-',
        reason: 'already registered',
      }));

    const createdRegistrations =
      itemsToCreate.length === 0
        ? []
        : await this.prisma.$transaction(async (tx) => {
            const created: any[] = [];

            for (const item of itemsToCreate) {
              const registration = await ((tx as any).studentSubjectRegistration).create({
                data: {
                  studentProfileId: enrollment.studentProfileId,
                  enrollmentId: enrollment.id,
                  curriculumSubjectId: item.id,
                  registrationDate: options.registrationDate,
                  status: options.status,
                  isAutoRegistered: true,
                },
                include: this.registrationInclude,
              });

              created.push(registration);
            }

            return created;
          });

    return {
      createdCount: createdRegistrations.length,
      skippedCount: skippedSubjects.length,
      createdRegistrations,
      skippedSubjects,
    };
  }

  private async ensureUniqueDepartment(name: string, code: string, ignoreId?: string) {
    const existingByName = await (this.prisma.department as any).findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        ...(ignoreId ? { NOT: { id: ignoreId } } : {}),
      },
    });

    if (existingByName) {
      throw new ConflictException('Department name already exists');
    }

    const existingByCode = await (this.prisma.department as any).findFirst({
      where: {
        code: {
          equals: code,
          mode: 'insensitive',
        },
        ...(ignoreId ? { NOT: { id: ignoreId } } : {}),
      },
    });

    if (existingByCode) {
      throw new ConflictException('Department code already exists');
    }
  }

  private async ensureUniqueSubjectCode(departmentId: string, code: string, ignoreSubjectId?: string) {
    const existingSubject = await ((this.prisma as any).departmentSubject).findFirst({
      where: {
        departmentId,
        code: {
          equals: code,
          mode: 'insensitive',
        },
        ...(ignoreSubjectId ? { NOT: { id: ignoreSubjectId } } : {}),
      },
    });

    if (existingSubject) {
      throw new ConflictException('Subject code already exists in this department');
    }
  }

  private async ensureUniqueProgramCode(departmentId: string, code: string, ignoreProgramId?: string) {
    const existingProgram = await ((this.prisma as any).departmentProgram).findFirst({
      where: {
        departmentId,
        code: { equals: code, mode: 'insensitive' },
        ...(ignoreProgramId ? { NOT: { id: ignoreProgramId } } : {}),
      },
    });

    if (existingProgram) {
      throw new ConflictException('Program code already exists in this department');
    }
  }

  private async ensureUniqueSemester(
    programId: string,
    semesterNumber: number,
    section: string | null,
    ignoreSemesterId?: string,
  ) {
    const existingSemester = await ((this.prisma as any).programSemester).findFirst({
      where: {
        programId,
        semesterNumber,
        section,
        ...(ignoreSemesterId ? { NOT: { id: ignoreSemesterId } } : {}),
      },
    });

    if (existingSemester) {
      throw new ConflictException('This semester and section combination already exists for the program');
    }
  }

  private async ensureUniqueCurriculumSubject(
    semesterId: string,
    subjectId: string,
    ignoreCurriculumId?: string,
  ) {
    const existingItem = await ((this.prisma as any).curriculumSubject).findFirst({
      where: {
        semesterId,
        subjectId,
        ...(ignoreCurriculumId ? { NOT: { id: ignoreCurriculumId } } : {}),
      },
    });

    if (existingItem) {
      throw new ConflictException('This subject is already mapped to the selected semester');
    }
  }

  private async ensureCurriculumSubjectBelongsToDepartment(subjectId: string, departmentId: string) {
    const subject = await ((this.prisma as any).departmentSubject).findFirst({
      where: {
        id: subjectId,
        departmentId,
      },
    });

    if (!subject) {
      throw new BadRequestException('Selected subject does not belong to this department');
    }
  }

  private async validateEnrollment(
    payload: NormalizedEnrollmentInput,
    departmentId: string,
    ignoreEnrollmentId?: string,
  ) {
    const student = await this.prisma.employee_profiles.findUnique({
      where: { id: payload.studentProfileId },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            status: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student was not found');
    }

    if (String(student.role) !== 'STUDENT') {
      throw new BadRequestException('Selected profile is not a student');
    }

    if (student.department.trim().toLowerCase() === 'unassigned') {
      throw new BadRequestException('Assign the student to the department before enrollment');
    }

    const program = await ((this.prisma as any).departmentProgram).findFirst({
      where: {
        id: payload.programId,
        departmentId,
      },
    });

    if (!program) {
      throw new BadRequestException('Selected program does not belong to this department');
    }

    const semester = await ((this.prisma as any).programSemester).findFirst({
      where: {
        id: payload.semesterId,
        programId: payload.programId,
      },
    });

    if (!semester) {
      throw new BadRequestException('Selected semester does not belong to the chosen program');
    }

    const existingEnrollment = await ((this.prisma as any).studentEnrollment).findFirst({
      where: {
        studentProfileId: payload.studentProfileId,
        ...(ignoreEnrollmentId ? { NOT: { id: ignoreEnrollmentId } } : {}),
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('This student already has an academic enrollment');
    }
  }

  private async validateRegistration(
    payload: NormalizedRegistrationInput,
    departmentId: string,
    ignoreRegistrationId?: string,
  ) {
    const enrollment = await ((this.prisma as any).studentEnrollment).findFirst({
      where: {
        id: payload.enrollmentId,
        program: {
          departmentId,
        },
      },
      include: {
        program: true,
        semester: true,
      },
    });

    if (!enrollment) {
      throw new BadRequestException('Selected enrollment does not belong to this department');
    }

    if (enrollment.studentProfileId !== payload.studentProfileId) {
      throw new BadRequestException('Selected student does not match the chosen enrollment');
    }

    const curriculumSubject = await ((this.prisma as any).curriculumSubject).findFirst({
      where: {
        id: payload.curriculumSubjectId,
        semesterId: enrollment.semesterId,
      },
    });

    if (!curriculumSubject) {
      throw new BadRequestException('Selected curriculum subject does not belong to the chosen enrollment semester');
    }

    const existingRegistration = await ((this.prisma as any).studentSubjectRegistration).findFirst({
      where: {
        studentProfileId: payload.studentProfileId,
        curriculumSubjectId: payload.curriculumSubjectId,
        ...(ignoreRegistrationId ? { NOT: { id: ignoreRegistrationId } } : {}),
      },
    });

    if (existingRegistration) {
      throw new ConflictException('This student is already registered for the selected subject');
    }
  }

  private async validateHeadOfDepartment(
    hodProfileId: string | null | undefined,
    departmentName: string,
    ignoreDepartmentId?: string,
  ) {
    if (!hodProfileId) {
      return;
    }

    const employee = await this.prisma.employee_profiles.findUnique({
      where: { id: hodProfileId },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            status: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Selected HOD was not found');
    }

    if (String(employee.role) === 'STUDENT') {
      throw new BadRequestException('Students cannot be assigned as head of department');
    }

    if (employee.users.status !== 'active') {
      throw new BadRequestException('Only active employees can be assigned as head of department');
    }

    if (employee.department.trim().toLowerCase() !== departmentName.trim().toLowerCase()) {
      throw new BadRequestException(
        'Head of department must belong to the same department. Update the employee department first.',
      );
    }

    const existingAssignment = await (this.prisma.department as any).findFirst({
      where: {
        hodProfileId,
        ...(ignoreDepartmentId ? { NOT: { id: ignoreDepartmentId } } : {}),
      } as any,
    });

    if (existingAssignment) {
      throw new ConflictException('This employee is already assigned as head of another department');
    }
  }

  private async validateSubjectTeacher(teacherProfileId: string | null, departmentName: string) {
    if (!teacherProfileId) {
      return;
    }

    const teacher = await this.prisma.employee_profiles.findUnique({
      where: { id: teacherProfileId },
      include: {
        users: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Selected subject teacher was not found');
    }

    if (String(teacher.role) === 'STUDENT') {
      throw new BadRequestException('Students cannot be assigned as subject teachers');
    }

    if (teacher.users.status !== 'active') {
      throw new BadRequestException('Only active staff can be assigned as subject teachers');
    }

    if (teacher.department.trim().toLowerCase() !== departmentName.trim().toLowerCase()) {
      throw new BadRequestException('Subject teacher must belong to the same department');
    }
  }

  private async validateDepartmentStaffMember(
    profileId: string | null,
    departmentName: string,
    label: string,
  ) {
    if (!profileId) {
      return;
    }

    const employee = await this.prisma.employee_profiles.findUnique({
      where: { id: profileId },
      include: {
        users: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`${label} was not found`);
    }

    if (String(employee.role) === 'STUDENT') {
      throw new BadRequestException(`${label} must be a staff member`);
    }

    if (employee.users.status !== 'active') {
      throw new BadRequestException(`Only active staff can be assigned as ${label.toLowerCase()}`);
    }

    if (employee.department.trim().toLowerCase() !== departmentName.trim().toLowerCase()) {
      throw new BadRequestException(`${label} must belong to the same department`);
    }
  }

  private getDepartmentPersistenceData(payload: NormalizedDepartmentInput) {
    return {
      name: payload.name,
      code: payload.code,
      description: payload.description,
      status: payload.status,
      hodProfileId: payload.hodProfileId,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      location: payload.location,
    };
  }

  private async syncDepartmentMembers(
    tx: any,
    departmentName: string,
    assignedStaffIds: string[],
    assignedStudentIds: string[],
  ) {
    const currentMembers = await tx.employee_profiles.findMany({
      where: { department: departmentName },
      select: {
        id: true,
        role: true,
      },
    });

    const currentStaffIds = currentMembers
      .filter((employee: any) => String(employee.role) !== 'STUDENT')
      .map((employee: any) => employee.id);
    const currentStudentIds = currentMembers
      .filter((employee: any) => String(employee.role) === 'STUDENT')
      .map((employee: any) => employee.id);

    const staffToUnassign = currentStaffIds.filter((id: string) => !assignedStaffIds.includes(id));
    const studentsToUnassign = currentStudentIds.filter((id: string) => !assignedStudentIds.includes(id));

    if (staffToUnassign.length > 0) {
      await tx.employee_profiles.updateMany({
        where: { id: { in: staffToUnassign } },
        data: { department: 'Unassigned' },
      });
    }

    if (studentsToUnassign.length > 0) {
      await tx.employee_profiles.updateMany({
        where: { id: { in: studentsToUnassign } },
        data: { department: 'Unassigned' },
      });
    }

    if (assignedStaffIds.length > 0) {
      await tx.employee_profiles.updateMany({
        where: { id: { in: assignedStaffIds } },
        data: { department: departmentName },
      });
    }

    if (assignedStudentIds.length > 0) {
      await tx.employee_profiles.updateMany({
        where: { id: { in: assignedStudentIds } },
        data: { department: departmentName },
      });
    }
  }

  private buildDepartmentResponse(department: any, employees: any[]) {
    const staffMembers = employees.filter((employee) => String(employee.role) !== 'STUDENT');
    const studentMembers = employees.filter((employee) => String(employee.role) === 'STUDENT');

    return {
      id: department.id,
      name: department.name,
      code: department.code,
      description: department.description,
      status: department.status,
      hodProfileId: department.hodProfileId,
      headOfDepartment: department.headOfDepartment
        ? {
            id: department.headOfDepartment.id,
            employeeId: department.headOfDepartment.employee_id,
            designation: department.headOfDepartment.designation,
            role: department.headOfDepartment.role,
            fullName: `${department.headOfDepartment.users.first_name} ${department.headOfDepartment.users.last_name}`,
            email: department.headOfDepartment.users.email,
            phone: department.headOfDepartment.users.phone,
            status: department.headOfDepartment.users.status,
          }
        : null,
      contactEmail: department.contactEmail,
      contactPhone: department.contactPhone,
      location: department.location,
      employeeCount: employees.length,
      staffCount: staffMembers.length,
      studentCount: studentMembers.length,
      subjectCount: department.subjects?.length ?? 0,
      programCount: department.programs?.length ?? 0,
      semesterCount:
        (department.programs ?? []).reduce(
          (sum: number, program: any) => sum + ((program.semesters?.length as number) ?? 0),
          0,
        ) ?? 0,
      curriculumCount:
        (department.programs ?? []).reduce(
          (sum: number, program: any) =>
            sum +
            (program.semesters ?? []).reduce(
              (semesterSum: number, semester: any) => semesterSum + ((semester.curriculum?.length as number) ?? 0),
              0,
            ),
          0,
        ) ?? 0,
      memberPreview: employees.slice(0, 5).map((employee) => ({
        id: employee.id,
        employeeId: employee.employee_id,
        fullName: `${employee.users.first_name} ${employee.users.last_name}`,
        designation: employee.designation,
        role: employee.role,
        email: employee.users.email,
        status: employee.users.status,
      })),
      subjects: (department.subjects ?? []).map((subject: any) => this.buildSubjectResponse(subject)),
      programs: (department.programs ?? []).map((program: any) => this.buildProgramResponse(program)),
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    };
  }

  private buildSubjectResponse(subject: any) {
    return {
      id: subject.id,
      departmentId: subject.departmentId,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      type: subject.type,
      status: subject.status,
      teacherProfileId: subject.teacherProfileId,
      teacher: subject.teacher
        ? {
            id: subject.teacher.id,
            employeeId: subject.teacher.employee_id,
            fullName: `${subject.teacher.users.first_name} ${subject.teacher.users.last_name}`,
            designation: subject.teacher.designation,
            email: subject.teacher.users.email,
            status: subject.teacher.users.status,
          }
        : null,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    };
  }

  private buildProgramResponse(program: any) {
    return {
      id: program.id,
      departmentId: program.departmentId,
      name: program.name,
      code: program.code,
      level: program.level,
      durationSemesters: program.durationSemesters,
      intakeCapacity: program.intakeCapacity,
      status: program.status,
      coordinatorProfileId: program.coordinatorProfileId,
      coordinator: program.coordinator
        ? {
            id: program.coordinator.id,
            employeeId: program.coordinator.employee_id,
            fullName: `${program.coordinator.users.first_name} ${program.coordinator.users.last_name}`,
            designation: program.coordinator.designation,
            email: program.coordinator.users.email,
            status: program.coordinator.users.status,
          }
        : null,
      semesterCount: program.semesters?.length ?? 0,
      semesters: (program.semesters ?? []).map((semester: any) => this.buildSemesterResponse(semester)),
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };
  }

  private buildSemesterResponse(semester: any) {
    return {
      id: semester.id,
      programId: semester.programId,
      semesterNumber: semester.semesterNumber,
      section: semester.section,
      academicYear: semester.academicYear,
      studentCapacity: semester.studentCapacity,
      status: semester.status,
      advisorProfileId: semester.advisorProfileId,
      advisor: semester.advisor
        ? {
            id: semester.advisor.id,
            employeeId: semester.advisor.employee_id,
            fullName: `${semester.advisor.users.first_name} ${semester.advisor.users.last_name}`,
            designation: semester.advisor.designation,
            email: semester.advisor.users.email,
            status: semester.advisor.users.status,
          }
        : null,
      curriculumCount: semester.curriculum?.length ?? 0,
      curriculum: (semester.curriculum ?? []).map((item: any) => this.buildCurriculumResponse(item)),
      createdAt: semester.createdAt,
      updatedAt: semester.updatedAt,
    };
  }

  private buildCurriculumResponse(
    item: any,
    context?: { programId?: string; programName?: string; semesterNumber?: number; section?: string | null },
  ) {
    return {
      id: item.id,
      semesterId: item.semesterId,
      subjectId: item.subjectId,
      facultyProfileId: item.facultyProfileId,
      academicYear: item.academicYear,
      credits: item.credits,
      theoryHours: item.theoryHours,
      labHours: item.labHours,
      internalWeightage: item.internalWeightage,
      externalWeightage: item.externalWeightage,
      isElective: item.isElective,
      status: item.status,
      subject: item.subject
        ? {
            id: item.subject.id,
            name: item.subject.name,
            code: item.subject.code,
            type: item.subject.type,
          }
        : null,
      faculty: item.faculty
        ? {
            id: item.faculty.id,
            employeeId: item.faculty.employee_id,
            fullName: `${item.faculty.users.first_name} ${item.faculty.users.last_name}`,
            designation: item.faculty.designation,
            email: item.faculty.users.email,
            status: item.faculty.users.status,
          }
        : null,
      programId: context?.programId,
      programName: context?.programName,
      semesterNumber: context?.semesterNumber,
      section: context?.section,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private buildEnrollmentResponse(enrollment: any) {
    return {
      id: enrollment.id,
      studentProfileId: enrollment.studentProfileId,
      programId: enrollment.programId,
      semesterId: enrollment.semesterId,
      rollNumber: enrollment.rollNumber,
      academicYear: enrollment.academicYear,
      admissionDate: enrollment.admissionDate,
      status: enrollment.status,
      student: enrollment.student
        ? {
            id: enrollment.student.id,
            employeeId: enrollment.student.employee_id,
            fullName: `${enrollment.student.users.first_name} ${enrollment.student.users.last_name}`,
            designation: enrollment.student.designation,
            email: enrollment.student.users.email,
            status: enrollment.student.users.status,
          }
        : null,
      program: enrollment.program
        ? {
            id: enrollment.program.id,
            name: enrollment.program.name,
            code: enrollment.program.code,
            level: enrollment.program.level,
          }
        : null,
      semester: enrollment.semester
        ? {
            id: enrollment.semester.id,
            semesterNumber: enrollment.semester.semesterNumber,
            section: enrollment.semester.section,
            academicYear: enrollment.semester.academicYear,
            status: enrollment.semester.status,
          }
        : null,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  }

  private buildRegistrationResponse(registration: any) {
    return {
      id: registration.id,
      studentProfileId: registration.studentProfileId,
      enrollmentId: registration.enrollmentId,
      curriculumSubjectId: registration.curriculumSubjectId,
      registrationDate: registration.registrationDate,
      status: registration.status,
      isAutoRegistered: registration.isAutoRegistered,
      student: registration.student
        ? {
            id: registration.student.id,
            employeeId: registration.student.employee_id,
            fullName: `${registration.student.users.first_name} ${registration.student.users.last_name}`,
            designation: registration.student.designation,
            email: registration.student.users.email,
            status: registration.student.users.status,
          }
        : null,
      enrollment: registration.enrollment
        ? this.buildEnrollmentResponse(registration.enrollment)
        : null,
      curriculumSubject: registration.curriculumSubject
        ? this.buildCurriculumResponse(registration.curriculumSubject, {
            programId: registration.enrollment?.programId,
            programName: registration.enrollment?.program?.name,
            semesterNumber: registration.enrollment?.semester?.semesterNumber,
            section: registration.enrollment?.semester?.section,
          })
        : null,
      createdAt: registration.createdAt,
      updatedAt: registration.updatedAt,
    };
  }
}
