import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
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

@ApiTags('departments')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Roles('ADMIN', 'LEAD_MANAGER')
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'LEAD_MANAGER')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() body: CreateDepartmentDto) {
    return this.departmentsService.create(body);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: UpdateDepartmentDto) {
    return this.departmentsService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }

  @Get(':id/subjects')
  @Roles('ADMIN', 'LEAD_MANAGER')
  findSubjects(@Param('id') id: string) {
    return this.departmentsService.findSubjects(id);
  }

  @Post(':id/subjects')
  @Roles('ADMIN')
  createSubject(@Param('id') id: string, @Body() body: CreateDepartmentSubjectDto) {
    return this.departmentsService.createSubject(id, body);
  }

  @Patch(':id/subjects/:subjectId')
  @Roles('ADMIN')
  updateSubject(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
    @Body() body: UpdateDepartmentSubjectDto,
  ) {
    return this.departmentsService.updateSubject(id, subjectId, body);
  }

  @Delete(':id/subjects/:subjectId')
  @Roles('ADMIN')
  removeSubject(@Param('id') id: string, @Param('subjectId') subjectId: string) {
    return this.departmentsService.removeSubject(id, subjectId);
  }

  @Get(':id/programs')
  @Roles('ADMIN', 'LEAD_MANAGER')
  findPrograms(@Param('id') id: string) {
    return this.departmentsService.findPrograms(id);
  }

  @Post(':id/programs')
  @Roles('ADMIN')
  createProgram(@Param('id') id: string, @Body() body: CreateDepartmentProgramDto) {
    return this.departmentsService.createProgram(id, body);
  }

  @Patch(':id/programs/:programId')
  @Roles('ADMIN')
  updateProgram(
    @Param('id') id: string,
    @Param('programId') programId: string,
    @Body() body: UpdateDepartmentProgramDto,
  ) {
    return this.departmentsService.updateProgram(id, programId, body);
  }

  @Delete(':id/programs/:programId')
  @Roles('ADMIN')
  removeProgram(@Param('id') id: string, @Param('programId') programId: string) {
    return this.departmentsService.removeProgram(id, programId);
  }

  @Get(':id/programs/:programId/semesters')
  @Roles('ADMIN', 'LEAD_MANAGER')
  findProgramSemesters(@Param('id') id: string, @Param('programId') programId: string) {
    return this.departmentsService.findProgramSemesters(id, programId);
  }

  @Post(':id/programs/:programId/semesters')
  @Roles('ADMIN')
  createProgramSemester(
    @Param('id') id: string,
    @Param('programId') programId: string,
    @Body() body: CreateProgramSemesterDto,
  ) {
    return this.departmentsService.createProgramSemester(id, programId, body);
  }

  @Patch(':id/programs/:programId/semesters/:semesterId')
  @Roles('ADMIN')
  updateProgramSemester(
    @Param('id') id: string,
    @Param('programId') programId: string,
    @Param('semesterId') semesterId: string,
    @Body() body: UpdateProgramSemesterDto,
  ) {
    return this.departmentsService.updateProgramSemester(id, programId, semesterId, body);
  }

  @Delete(':id/programs/:programId/semesters/:semesterId')
  @Roles('ADMIN')
  removeProgramSemester(
    @Param('id') id: string,
    @Param('programId') programId: string,
    @Param('semesterId') semesterId: string,
  ) {
    return this.departmentsService.removeProgramSemester(id, programId, semesterId);
  }

  @Get(':id/curriculum')
  @Roles('ADMIN', 'LEAD_MANAGER')
  findCurriculum(@Param('id') id: string) {
    return this.departmentsService.findCurriculum(id);
  }

  @Post(':id/programs/:programId/semesters/:semesterId/curriculum')
  @Roles('ADMIN')
  createCurriculumSubject(
    @Param('id') id: string,
    @Param('programId') programId: string,
    @Param('semesterId') semesterId: string,
    @Body() body: CreateCurriculumSubjectDto,
  ) {
    return this.departmentsService.createCurriculumSubject(id, programId, semesterId, body);
  }

  @Patch(':id/programs/:programId/semesters/:semesterId/curriculum/:curriculumId')
  @Roles('ADMIN')
  updateCurriculumSubject(
    @Param('id') id: string,
    @Param('programId') programId: string,
    @Param('semesterId') semesterId: string,
    @Param('curriculumId') curriculumId: string,
    @Body() body: UpdateCurriculumSubjectDto,
  ) {
    return this.departmentsService.updateCurriculumSubject(id, programId, semesterId, curriculumId, body);
  }

  @Delete(':id/programs/:programId/semesters/:semesterId/curriculum/:curriculumId')
  @Roles('ADMIN')
  removeCurriculumSubject(
    @Param('id') id: string,
    @Param('programId') programId: string,
    @Param('semesterId') semesterId: string,
    @Param('curriculumId') curriculumId: string,
  ) {
    return this.departmentsService.removeCurriculumSubject(id, programId, semesterId, curriculumId);
  }

  @Get(':id/enrollments')
  @Roles('ADMIN', 'LEAD_MANAGER')
  findEnrollments(@Param('id') id: string) {
    return this.departmentsService.findEnrollments(id);
  }

  @Post(':id/enrollments')
  @Roles('ADMIN')
  createEnrollment(@Param('id') id: string, @Body() body: CreateStudentEnrollmentDto) {
    return this.departmentsService.createEnrollment(id, body);
  }

  @Patch(':id/enrollments/:enrollmentId')
  @Roles('ADMIN')
  updateEnrollment(
    @Param('id') id: string,
    @Param('enrollmentId') enrollmentId: string,
    @Body() body: UpdateStudentEnrollmentDto,
  ) {
    return this.departmentsService.updateEnrollment(id, enrollmentId, body);
  }

  @Delete(':id/enrollments/:enrollmentId')
  @Roles('ADMIN')
  removeEnrollment(@Param('id') id: string, @Param('enrollmentId') enrollmentId: string) {
    return this.departmentsService.removeEnrollment(id, enrollmentId);
  }

  @Get(':id/registrations')
  @Roles('ADMIN', 'LEAD_MANAGER')
  findRegistrations(@Param('id') id: string) {
    return this.departmentsService.findRegistrations(id);
  }

  @Post(':id/registrations')
  @Roles('ADMIN')
  createRegistration(@Param('id') id: string, @Body() body: CreateStudentSubjectRegistrationDto) {
    return this.departmentsService.createRegistration(id, body);
  }

  @Patch(':id/registrations/:registrationId')
  @Roles('ADMIN')
  updateRegistration(
    @Param('id') id: string,
    @Param('registrationId') registrationId: string,
    @Body() body: UpdateStudentSubjectRegistrationDto,
  ) {
    return this.departmentsService.updateRegistration(id, registrationId, body);
  }

  @Delete(':id/registrations/:registrationId')
  @Roles('ADMIN')
  removeRegistration(@Param('id') id: string, @Param('registrationId') registrationId: string) {
    return this.departmentsService.removeRegistration(id, registrationId);
  }

  @Post(':id/registrations/auto/enrollment')
  @Roles('ADMIN')
  autoRegisterEnrollmentSubjects(@Param('id') id: string, @Body() body: AutoRegisterEnrollmentSubjectsDto) {
    return this.departmentsService.autoRegisterEnrollmentSubjects(id, body);
  }

  @Post(':id/registrations/auto/semester')
  @Roles('ADMIN')
  autoRegisterSemesterSubjects(@Param('id') id: string, @Body() body: AutoRegisterSemesterSubjectsDto) {
    return this.departmentsService.autoRegisterSemesterSubjects(id, body);
  }
}
