import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

const DEPARTMENT_STATUSES = ['active', 'inactive', 'archived'] as const;
const SUBJECT_TYPES = ['core', 'elective', 'lab'] as const;
const SUBJECT_STATUSES = ['active', 'inactive', 'archived'] as const;
const PROGRAM_LEVELS = ['diploma', 'undergraduate', 'postgraduate', 'doctorate', 'certificate'] as const;
const PROGRAM_STATUSES = ['active', 'inactive', 'archived'] as const;
const SEMESTER_STATUSES = ['planned', 'active', 'completed', 'archived'] as const;
const CURRICULUM_STATUSES = ['planned', 'active', 'archived'] as const;
const ENROLLMENT_STATUSES = ['active', 'promoted', 'graduated', 'dropped', 'deferred'] as const;
const REGISTRATION_STATUSES = ['registered', 'dropped', 'completed'] as const;

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Admissions' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'ADM' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code can only contain uppercase letters, numbers, underscores, and hyphens',
  })
  code: string;

  @ApiProperty({ example: 'Handles admissions, enrollment planning, and onboarding.', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiProperty({ example: 'active', enum: DEPARTMENT_STATUSES, required: false })
  @IsOptional()
  @IsIn(DEPARTMENT_STATUSES)
  status?: (typeof DEPARTMENT_STATUSES)[number];

  @ApiProperty({ example: 'e2b4aebd-5e5f-4978-b0f8-12a5b3297d4d', required: false })
  @IsOptional()
  @IsString()
  hodProfileId?: string;

  @ApiProperty({ example: 'admissions@school.edu', required: false })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiProperty({ example: '+91 9876543210', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  contactPhone?: string;

  @ApiProperty({ example: 'Block A, First Floor', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  location?: string;

  @ApiProperty({ example: ['employee-profile-id-1'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedStaffIds?: string[];

  @ApiProperty({ example: ['student-profile-id-1'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedStudentIds?: string[];
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

export class CreateDepartmentSubjectDto {
  @ApiProperty({ example: 'Physics' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'PHY101' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code can only contain uppercase letters, numbers, underscores, and hyphens',
  })
  code: string;

  @ApiProperty({ example: 'Core science subject for grade 11.', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiProperty({ example: 'core', enum: SUBJECT_TYPES, required: false })
  @IsOptional()
  @IsIn(SUBJECT_TYPES)
  type?: (typeof SUBJECT_TYPES)[number];

  @ApiProperty({ example: 'active', enum: SUBJECT_STATUSES, required: false })
  @IsOptional()
  @IsIn(SUBJECT_STATUSES)
  status?: (typeof SUBJECT_STATUSES)[number];

  @ApiProperty({ example: 'e2b4aebd-5e5f-4978-b0f8-12a5b3297d4d', required: false })
  @IsOptional()
  @IsString()
  teacherProfileId?: string;
}

export class UpdateDepartmentSubjectDto extends PartialType(CreateDepartmentSubjectDto) {}

export class CreateDepartmentProgramDto {
  @ApiProperty({ example: 'B.Tech Computer Science' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  name: string;

  @ApiProperty({ example: 'BTECH-CSE' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 30)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code can only contain uppercase letters, numbers, underscores, and hyphens',
  })
  code: string;

  @ApiProperty({ example: 'undergraduate', enum: PROGRAM_LEVELS, required: false })
  @IsOptional()
  @IsIn(PROGRAM_LEVELS)
  level?: (typeof PROGRAM_LEVELS)[number];

  @ApiProperty({ example: 8, required: false })
  @IsOptional()
  durationSemesters?: number;

  @ApiProperty({ example: 120, required: false })
  @IsOptional()
  intakeCapacity?: number;

  @ApiProperty({ example: 'active', enum: PROGRAM_STATUSES, required: false })
  @IsOptional()
  @IsIn(PROGRAM_STATUSES)
  status?: (typeof PROGRAM_STATUSES)[number];

  @ApiProperty({ example: 'e2b4aebd-5e5f-4978-b0f8-12a5b3297d4d', required: false })
  @IsOptional()
  @IsString()
  coordinatorProfileId?: string;
}

export class UpdateDepartmentProgramDto extends PartialType(CreateDepartmentProgramDto) {}

export class CreateProgramSemesterDto {
  @ApiProperty({ example: 1 })
  semesterNumber: number;

  @ApiProperty({ example: 'A', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  section?: string;

  @ApiProperty({ example: '2026-2027', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  academicYear?: string;

  @ApiProperty({ example: 60, required: false })
  @IsOptional()
  studentCapacity?: number;

  @ApiProperty({ example: 'planned', enum: SEMESTER_STATUSES, required: false })
  @IsOptional()
  @IsIn(SEMESTER_STATUSES)
  status?: (typeof SEMESTER_STATUSES)[number];

  @ApiProperty({ example: 'e2b4aebd-5e5f-4978-b0f8-12a5b3297d4d', required: false })
  @IsOptional()
  @IsString()
  advisorProfileId?: string;
}

export class UpdateProgramSemesterDto extends PartialType(CreateProgramSemesterDto) {}

export class CreateCurriculumSubjectDto {
  @ApiProperty({ example: 'subject-id' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: 'faculty-profile-id', required: false })
  @IsOptional()
  @IsString()
  facultyProfileId?: string;

  @ApiProperty({ example: '2026-2027', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  academicYear?: string;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  credits?: number;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  theoryHours?: number;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  labHours?: number;

  @ApiProperty({ example: 40, required: false })
  @IsOptional()
  internalWeightage?: number;

  @ApiProperty({ example: 60, required: false })
  @IsOptional()
  externalWeightage?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  isElective?: boolean;

  @ApiProperty({ example: 'active', enum: CURRICULUM_STATUSES, required: false })
  @IsOptional()
  @IsIn(CURRICULUM_STATUSES)
  status?: (typeof CURRICULUM_STATUSES)[number];
}

export class UpdateCurriculumSubjectDto extends PartialType(CreateCurriculumSubjectDto) {}

export class CreateStudentEnrollmentDto {
  @ApiProperty({ example: 'student-profile-id' })
  @IsString()
  @IsNotEmpty()
  studentProfileId: string;

  @ApiProperty({ example: 'program-id' })
  @IsString()
  @IsNotEmpty()
  programId: string;

  @ApiProperty({ example: 'semester-id' })
  @IsString()
  @IsNotEmpty()
  semesterId: string;

  @ApiProperty({ example: 'CSE2026-001', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  rollNumber?: string;

  @ApiProperty({ example: '2026-2027', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  academicYear?: string;

  @ApiProperty({ example: '2026-07-01', required: false })
  @IsOptional()
  @IsString()
  admissionDate?: string;

  @ApiProperty({ example: 'active', enum: ENROLLMENT_STATUSES, required: false })
  @IsOptional()
  @IsIn(ENROLLMENT_STATUSES)
  status?: (typeof ENROLLMENT_STATUSES)[number];
}

export class UpdateStudentEnrollmentDto extends PartialType(CreateStudentEnrollmentDto) {}

export class CreateStudentSubjectRegistrationDto {
  @ApiProperty({ example: 'student-profile-id' })
  @IsString()
  @IsNotEmpty()
  studentProfileId: string;

  @ApiProperty({ example: 'enrollment-id' })
  @IsString()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ example: 'curriculum-subject-id' })
  @IsString()
  @IsNotEmpty()
  curriculumSubjectId: string;

  @ApiProperty({ example: '2026-07-01', required: false })
  @IsOptional()
  @IsString()
  registrationDate?: string;

  @ApiProperty({ example: 'registered', enum: REGISTRATION_STATUSES, required: false })
  @IsOptional()
  @IsIn(REGISTRATION_STATUSES)
  status?: (typeof REGISTRATION_STATUSES)[number];

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  isAutoRegistered?: boolean;
}

export class UpdateStudentSubjectRegistrationDto extends PartialType(CreateStudentSubjectRegistrationDto) {}

export class AutoRegisterEnrollmentSubjectsDto {
  @ApiProperty({ example: 'enrollment-id' })
  @IsString()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ example: '2026-07-01', required: false })
  @IsOptional()
  @IsString()
  registrationDate?: string;

  @ApiProperty({ example: 'registered', enum: REGISTRATION_STATUSES, required: false })
  @IsOptional()
  @IsIn(REGISTRATION_STATUSES)
  status?: (typeof REGISTRATION_STATUSES)[number];
}

export class AutoRegisterSemesterSubjectsDto {
  @ApiProperty({ example: 'semester-id' })
  @IsString()
  @IsNotEmpty()
  semesterId: string;

  @ApiProperty({ example: '2026-07-01', required: false })
  @IsOptional()
  @IsString()
  registrationDate?: string;

  @ApiProperty({ example: 'registered', enum: REGISTRATION_STATUSES, required: false })
  @IsOptional()
  @IsIn(REGISTRATION_STATUSES)
  status?: (typeof REGISTRATION_STATUSES)[number];
}
