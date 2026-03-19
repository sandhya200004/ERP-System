const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_PASSWORD = 'Demo@123';

const departments = [
  {
    name: 'Computer Science',
    code: 'CSE',
    description: 'Handles undergraduate computing programs, lab planning, and academic delivery.',
    contactEmail: 'cse@triversecollege.edu',
    contactPhone: '+91 9000001001',
    location: 'Block A, Second Floor',
    hodEmployeeId: 'FAC001',
    staff: [
      { employeeId: 'FAC001', email: 'ananya.sharma@triversecollege.edu', firstName: 'Ananya', lastName: 'Sharma', designation: 'Professor & HOD', role: 'MANAGER' },
      { employeeId: 'FAC002', email: 'ravi.verma@triversecollege.edu', firstName: 'Ravi', lastName: 'Verma', designation: 'Associate Professor', role: 'EMPLOYEE' },
      { employeeId: 'FAC003', email: 'meera.joseph@triversecollege.edu', firstName: 'Meera', lastName: 'Joseph', designation: 'Assistant Professor', role: 'EMPLOYEE' },
    ],
    students: [
      { employeeId: 'STU101', email: 'aarav.gupta@student.triversecollege.edu', firstName: 'Aarav', lastName: 'Gupta', designation: 'B.Tech CSE Student', role: 'STUDENT' },
      { employeeId: 'STU102', email: 'sneha.iyer@student.triversecollege.edu', firstName: 'Sneha', lastName: 'Iyer', designation: 'B.Tech CSE Student', role: 'STUDENT' },
      { employeeId: 'STU103', email: 'vihaan.kapoor@student.triversecollege.edu', firstName: 'Vihaan', lastName: 'Kapoor', designation: 'B.Tech CSE Student', role: 'STUDENT' },
    ],
    programs: [
      {
        name: 'B.Tech Computer Science and Engineering',
        code: 'BTECH-CSE',
        level: 'undergraduate',
        durationSemesters: 8,
        intakeCapacity: 120,
        coordinatorEmployeeId: 'FAC002',
        semesters: [
          { semesterNumber: 1, section: 'A', academicYear: '2026-2027', studentCapacity: 60, advisorEmployeeId: 'FAC003' },
          { semesterNumber: 3, section: 'A', academicYear: '2026-2027', studentCapacity: 60, advisorEmployeeId: 'FAC002' },
        ],
      },
    ],
    subjects: [
      { name: 'Programming Fundamentals', code: 'CSE101', type: 'core', teacherEmployeeId: 'FAC002', description: 'Introductory programming with problem-solving foundations.' },
      { name: 'Discrete Mathematics', code: 'CSE102', type: 'core', teacherEmployeeId: 'FAC001', description: 'Logic, sets, combinatorics, and graph fundamentals for engineers.' },
      { name: 'Data Structures Lab', code: 'CSE201L', type: 'lab', teacherEmployeeId: 'FAC003', description: 'Practical implementation of data structures.' },
    ],
    curriculum: [
      { semesterNumber: 1, section: 'A', subjectCode: 'CSE101', facultyEmployeeId: 'FAC002', academicYear: '2026-2027', credits: 4, theoryHours: 3, labHours: 1, internalWeightage: 40, externalWeightage: 60, isElective: false, status: 'active' },
      { semesterNumber: 1, section: 'A', subjectCode: 'CSE102', facultyEmployeeId: 'FAC001', academicYear: '2026-2027', credits: 3, theoryHours: 3, labHours: 0, internalWeightage: 40, externalWeightage: 60, isElective: false, status: 'active' },
      { semesterNumber: 3, section: 'A', subjectCode: 'CSE201L', facultyEmployeeId: 'FAC003', academicYear: '2026-2027', credits: 2, theoryHours: 0, labHours: 3, internalWeightage: 50, externalWeightage: 50, isElective: false, status: 'active' },
    ],
    enrollments: [
      { studentEmployeeId: 'STU101', programCode: 'BTECH-CSE', semesterNumber: 1, section: 'A', rollNumber: 'CSE26A001', academicYear: '2026-2027', admissionDate: '2026-07-01', status: 'active' },
      { studentEmployeeId: 'STU102', programCode: 'BTECH-CSE', semesterNumber: 1, section: 'A', rollNumber: 'CSE26A002', academicYear: '2026-2027', admissionDate: '2026-07-01', status: 'active' },
      { studentEmployeeId: 'STU103', programCode: 'BTECH-CSE', semesterNumber: 3, section: 'A', rollNumber: 'CSE24A018', academicYear: '2026-2027', admissionDate: '2024-07-15', status: 'active' },
    ],
  },
  {
    name: 'Information Technology',
    code: 'IT',
    description: 'Focuses on enterprise systems, networking, and modern IT operations.',
    contactEmail: 'it@triversecollege.edu',
    contactPhone: '+91 9000001002',
    location: 'Block B, First Floor',
    hodEmployeeId: 'FAC011',
    staff: [
      { employeeId: 'FAC011', email: 'priya.nair@triversecollege.edu', firstName: 'Priya', lastName: 'Nair', designation: 'Professor & HOD', role: 'MANAGER' },
      { employeeId: 'FAC012', email: 'karan.singh@triversecollege.edu', firstName: 'Karan', lastName: 'Singh', designation: 'Assistant Professor', role: 'EMPLOYEE' },
    ],
    students: [
      { employeeId: 'STU201', email: 'isha.malhotra@student.triversecollege.edu', firstName: 'Isha', lastName: 'Malhotra', designation: 'B.Tech IT Student', role: 'STUDENT' },
      { employeeId: 'STU202', email: 'aditya.rao@student.triversecollege.edu', firstName: 'Aditya', lastName: 'Rao', designation: 'B.Tech IT Student', role: 'STUDENT' },
    ],
    programs: [
      {
        name: 'B.Tech Information Technology',
        code: 'BTECH-IT',
        level: 'undergraduate',
        durationSemesters: 8,
        intakeCapacity: 90,
        coordinatorEmployeeId: 'FAC012',
        semesters: [
          { semesterNumber: 1, section: 'A', academicYear: '2026-2027', studentCapacity: 45, advisorEmployeeId: 'FAC011' },
        ],
      },
    ],
    subjects: [
      { name: 'Computer Networks', code: 'IT101', type: 'core', teacherEmployeeId: 'FAC011', description: 'Networking fundamentals and protocols.' },
      { name: 'Web Technologies', code: 'IT102', type: 'core', teacherEmployeeId: 'FAC012', description: 'Modern web application development foundations.' },
    ],
    curriculum: [
      { semesterNumber: 1, section: 'A', subjectCode: 'IT101', facultyEmployeeId: 'FAC011', academicYear: '2026-2027', credits: 4, theoryHours: 3, labHours: 1, internalWeightage: 40, externalWeightage: 60, isElective: false, status: 'active' },
      { semesterNumber: 1, section: 'A', subjectCode: 'IT102', facultyEmployeeId: 'FAC012', academicYear: '2026-2027', credits: 3, theoryHours: 2, labHours: 2, internalWeightage: 40, externalWeightage: 60, isElective: false, status: 'active' },
    ],
    enrollments: [
      { studentEmployeeId: 'STU201', programCode: 'BTECH-IT', semesterNumber: 1, section: 'A', rollNumber: 'IT26A001', academicYear: '2026-2027', admissionDate: '2026-07-01', status: 'active' },
      { studentEmployeeId: 'STU202', programCode: 'BTECH-IT', semesterNumber: 1, section: 'A', rollNumber: 'IT26A002', academicYear: '2026-2027', admissionDate: '2026-07-01', status: 'active' },
    ],
  },
];

async function main() {
  console.log('Creating college mock data...\n');

  const company = await prisma.companies.findFirst({ where: { id: DEFAULT_COMPANY_ID } });
  if (!company) {
    console.error('Default company not found. Run seed first.');
    process.exit(1);
  }

  const adminRole = await ensureRole(company.id, 'Admin', 'System administrator role', true);
  const employeeRole = await ensureRole(company.id, 'Employee', 'Basic employee/student app access role', true);

  await ensurePrincipal(company.id, adminRole.id);

  for (const departmentSeed of departments) {
    const peopleMap = new Map();

    for (const staff of departmentSeed.staff) {
      const profile = await ensureUserProfile({
        ...staff,
        department: departmentSeed.name,
        joinDate: '2024-06-01',
      });
      peopleMap.set(staff.employeeId, profile);
      await ensureUserRole(profile.user_id, employeeRole.id, company.id);
    }

    for (const student of departmentSeed.students) {
      const profile = await ensureUserProfile({
        ...student,
        department: departmentSeed.name,
        joinDate: '2026-07-01',
      });
      peopleMap.set(student.employeeId, profile);
      await ensureUserRole(profile.user_id, employeeRole.id, company.id);
    }

    const hodProfile = peopleMap.get(departmentSeed.hodEmployeeId);
    const department = await ensureDepartment(departmentSeed, hodProfile?.id || null);

    const subjectMap = new Map();
    for (const subjectSeed of departmentSeed.subjects) {
      const teacher = peopleMap.get(subjectSeed.teacherEmployeeId);
      const subject = await ensureSubject(department.id, subjectSeed, teacher?.id || null);
      subjectMap.set(subjectSeed.code, subject);
    }

    const programMap = new Map();
    const semesterMap = new Map();

    for (const programSeed of departmentSeed.programs) {
      const coordinator = peopleMap.get(programSeed.coordinatorEmployeeId);
      const program = await ensureProgram(department.id, programSeed, coordinator?.id || null);
      programMap.set(programSeed.code, program);

      for (const semesterSeed of programSeed.semesters) {
        const advisor = peopleMap.get(semesterSeed.advisorEmployeeId);
        const semester = await ensureSemester(program.id, semesterSeed, advisor?.id || null);
        semesterMap.set(`${programSeed.code}:${semesterSeed.semesterNumber}:${semesterSeed.section || ''}`, semester);
      }
    }

    const curriculumMap = new Map();
    for (const curriculumSeed of departmentSeed.curriculum) {
      const program = programMap.get(
        departmentSeed.programs.find((programSeed) =>
          programSeed.semesters.some(
            (semesterSeed) =>
              semesterSeed.semesterNumber === curriculumSeed.semesterNumber &&
              (semesterSeed.section || '') === (curriculumSeed.section || ''),
          ),
        )?.code,
      );
      const semester = semesterMap.get(
        `${program.code}:${curriculumSeed.semesterNumber}:${curriculumSeed.section || ''}`,
      );
      const subject = subjectMap.get(curriculumSeed.subjectCode);
      const faculty = peopleMap.get(curriculumSeed.facultyEmployeeId);
      const curriculumItem = await ensureCurriculum(semester.id, subject.id, faculty?.id || null, curriculumSeed);
      curriculumMap.set(`${semester.id}:${curriculumSeed.subjectCode}`, curriculumItem);
    }

    for (const enrollmentSeed of departmentSeed.enrollments) {
      const student = peopleMap.get(enrollmentSeed.studentEmployeeId);
      const program = programMap.get(enrollmentSeed.programCode);
      const semester = semesterMap.get(
        `${enrollmentSeed.programCode}:${enrollmentSeed.semesterNumber}:${enrollmentSeed.section || ''}`,
      );
      const enrollment = await ensureEnrollment(student.id, program.id, semester.id, enrollmentSeed);

      const semesterCurriculum = departmentSeed.curriculum.filter(
        (item) =>
          item.semesterNumber === enrollmentSeed.semesterNumber &&
          (item.section || '') === (enrollmentSeed.section || ''),
      );

      for (const curriculumSeed of semesterCurriculum) {
        const curriculumItem = curriculumMap.get(`${semester.id}:${curriculumSeed.subjectCode}`);
        await ensureRegistration(student.id, enrollment.id, curriculumItem.id, enrollmentSeed.admissionDate);
      }
    }

    console.log(`Prepared ${departmentSeed.name}`);
  }

  console.log('\nMock college data is ready.');
  console.log(`Default demo password for mock faculty/students: ${DEFAULT_PASSWORD}`);
}

async function ensureRole(companyId, name, description, isSystemRole) {
  const existing = await prisma.roles.findFirst({
    where: { company_id: companyId, name },
  });

  if (existing) {
    return prisma.roles.update({
      where: { id: existing.id },
      data: { description, is_system_role: isSystemRole, updated_at: new Date() },
    });
  }

  return prisma.roles.create({
    data: {
      id: randomUUID(),
      company_id: companyId,
      name,
      description,
      is_system_role: isSystemRole,
      updated_at: new Date(),
    },
  });
}

async function ensurePrincipal(companyId, adminRoleId) {
  const passwordHash = await bcrypt.hash('ADMIN001@2025', 10);
  const user = await prisma.users.upsert({
    where: { email: 'admin001@triverse.com' },
    update: {
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: '001',
      status: 'active',
      email_verified_at: new Date(),
      updated_at: new Date(),
    },
    create: {
      id: randomUUID(),
      email: 'admin001@triverse.com',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: '001',
      status: 'active',
      email_verified_at: new Date(),
      updated_at: new Date(),
    },
  });

  await prisma.employee_profiles.upsert({
    where: { employee_id: 'ADMIN001' },
    update: {
      user_id: user.id,
      designation: 'Principal',
      department: 'Computer Science',
      role: 'CEO',
      date_of_joining: new Date('2024-04-01'),
      updated_at: new Date(),
    },
    create: {
      id: randomUUID(),
      user_id: user.id,
      employee_id: 'ADMIN001',
      designation: 'Principal',
      department: 'Computer Science',
      role: 'CEO',
      date_of_joining: new Date('2024-04-01'),
      updated_at: new Date(),
    },
  });

  await ensureUserRole(user.id, adminRoleId, companyId);
}

async function ensureUserProfile(person) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const user = await prisma.users.upsert({
    where: { email: person.email },
    update: {
      password_hash: passwordHash,
      first_name: person.firstName,
      last_name: person.lastName,
      status: 'active',
      email_verified_at: new Date(),
      updated_at: new Date(),
    },
    create: {
      id: randomUUID(),
      email: person.email,
      password_hash: passwordHash,
      first_name: person.firstName,
      last_name: person.lastName,
      status: 'active',
      email_verified_at: new Date(),
      updated_at: new Date(),
    },
  });

  return prisma.employee_profiles.upsert({
    where: { employee_id: person.employeeId },
    update: {
      user_id: user.id,
      designation: person.designation,
      department: person.department,
      role: person.role,
      date_of_joining: new Date(person.joinDate),
      updated_at: new Date(),
    },
    create: {
      id: randomUUID(),
      user_id: user.id,
      employee_id: person.employeeId,
      designation: person.designation,
      department: person.department,
      role: person.role,
      date_of_joining: new Date(person.joinDate),
      updated_at: new Date(),
    },
  });
}

async function ensureUserRole(userId, roleId, companyId) {
  const existing = await prisma.user_roles.findFirst({
    where: { user_id: userId, role_id: roleId, company_id: companyId },
  });

  if (existing) {
    return existing;
  }

  return prisma.user_roles.create({
    data: {
      id: randomUUID(),
      user_id: userId,
      role_id: roleId,
      company_id: companyId,
    },
  });
}

async function ensureDepartment(seed, hodProfileId) {
  const existing = await prisma.department.findFirst({
    where: { OR: [{ code: seed.code }, { name: { equals: seed.name, mode: 'insensitive' } }] },
  });

  if (existing) {
    return prisma.department.update({
      where: { id: existing.id },
      data: {
        name: seed.name,
        code: seed.code,
        description: seed.description,
        status: 'active',
        hodProfileId,
        contactEmail: seed.contactEmail,
        contactPhone: seed.contactPhone,
        location: seed.location,
      },
    });
  }

  return prisma.department.create({
    data: {
      name: seed.name,
      code: seed.code,
      description: seed.description,
      status: 'active',
      hodProfileId,
      contactEmail: seed.contactEmail,
      contactPhone: seed.contactPhone,
      location: seed.location,
    },
  });
}

async function ensureSubject(departmentId, seed, teacherProfileId) {
  const existing = await prisma.departmentSubject.findFirst({
    where: { departmentId, code: seed.code },
  });

  if (existing) {
    return prisma.departmentSubject.update({
      where: { id: existing.id },
      data: {
        name: seed.name,
        code: seed.code,
        description: seed.description,
        type: seed.type,
        status: 'active',
        teacherProfileId,
      },
    });
  }

  return prisma.departmentSubject.create({
    data: {
      departmentId,
      name: seed.name,
      code: seed.code,
      description: seed.description,
      type: seed.type,
      status: 'active',
      teacherProfileId,
    },
  });
}

async function ensureProgram(departmentId, seed, coordinatorProfileId) {
  const existing = await prisma.departmentProgram.findFirst({
    where: { departmentId, code: seed.code },
  });

  if (existing) {
    return prisma.departmentProgram.update({
      where: { id: existing.id },
      data: {
        name: seed.name,
        code: seed.code,
        level: seed.level,
        durationSemesters: seed.durationSemesters,
        intakeCapacity: seed.intakeCapacity,
        status: 'active',
        coordinatorProfileId,
      },
    });
  }

  return prisma.departmentProgram.create({
    data: {
      departmentId,
      name: seed.name,
      code: seed.code,
      level: seed.level,
      durationSemesters: seed.durationSemesters,
      intakeCapacity: seed.intakeCapacity,
      status: 'active',
      coordinatorProfileId,
    },
  });
}

async function ensureSemester(programId, seed, advisorProfileId) {
  const existing = await prisma.programSemester.findFirst({
    where: { programId, semesterNumber: seed.semesterNumber, section: seed.section || null },
  });

  if (existing) {
    return prisma.programSemester.update({
      where: { id: existing.id },
      data: {
        academicYear: seed.academicYear,
        studentCapacity: seed.studentCapacity,
        status: 'active',
        advisorProfileId,
      },
    });
  }

  return prisma.programSemester.create({
    data: {
      programId,
      semesterNumber: seed.semesterNumber,
      section: seed.section || null,
      academicYear: seed.academicYear,
      studentCapacity: seed.studentCapacity,
      status: 'active',
      advisorProfileId,
    },
  });
}

async function ensureCurriculum(semesterId, subjectId, facultyProfileId, seed) {
  const existing = await prisma.curriculumSubject.findFirst({
    where: { semesterId, subjectId },
  });

  const data = {
    facultyProfileId,
    academicYear: seed.academicYear,
    credits: seed.credits,
    theoryHours: seed.theoryHours,
    labHours: seed.labHours,
    internalWeightage: seed.internalWeightage,
    externalWeightage: seed.externalWeightage,
    isElective: seed.isElective,
    status: seed.status,
  };

  if (existing) {
    return prisma.curriculumSubject.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.curriculumSubject.create({
    data: {
      semesterId,
      subjectId,
      ...data,
    },
  });
}

async function ensureEnrollment(studentProfileId, programId, semesterId, seed) {
  const existing = await prisma.studentEnrollment.findFirst({
    where: { studentProfileId },
  });

  const data = {
    programId,
    semesterId,
    rollNumber: seed.rollNumber,
    academicYear: seed.academicYear,
    admissionDate: new Date(seed.admissionDate),
    status: seed.status,
  };

  if (existing) {
    return prisma.studentEnrollment.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.studentEnrollment.create({
    data: {
      studentProfileId,
      ...data,
    },
  });
}

async function ensureRegistration(studentProfileId, enrollmentId, curriculumSubjectId, registrationDate) {
  const existing = await prisma.studentSubjectRegistration.findFirst({
    where: { studentProfileId, curriculumSubjectId },
  });

  if (existing) {
    return prisma.studentSubjectRegistration.update({
      where: { id: existing.id },
      data: {
        enrollmentId,
        registrationDate: new Date(registrationDate),
        status: 'registered',
        isAutoRegistered: true,
      },
    });
  }

  return prisma.studentSubjectRegistration.create({
    data: {
      studentProfileId,
      enrollmentId,
      curriculumSubjectId,
      registrationDate: new Date(registrationDate),
      status: 'registered',
      isAutoRegistered: true,
    },
  });
}

main()
  .catch((error) => {
    console.error('Failed to create mock college data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
