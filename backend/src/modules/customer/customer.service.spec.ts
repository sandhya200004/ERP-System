import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    customers: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of customers', async () => {
      const mockCustomers = [
        {
          id: '1',
          company_id: 'comp1',
          customer_number: 'CUST001',
          name: 'Test Customer',
          email: 'test@example.com',
        },
      ];

      mockPrismaService.customers.findMany.mockResolvedValue(mockCustomers);
      mockPrismaService.customers.count.mockResolvedValue(1);

      const result = await service.findAll('comp1', { page: 1, limit: 10 });

      expect(result.data).toEqual(mockCustomers);
      expect(result.meta.total).toBe(1);
      expect(mockPrismaService.customers.findMany).toHaveBeenCalledWith({
        where: { company_id: 'comp1' },
        skip: 0,
        take: 10,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should filter customers by search term', async () => {
      mockPrismaService.customers.findMany.mockResolvedValue([]);
      mockPrismaService.customers.count.mockResolvedValue(0);

      await service.findAll('comp1', { page: 1, limit: 10, search: 'test' });

      expect(mockPrismaService.customers.findMany).toHaveBeenCalledWith({
        where: {
          company_id: 'comp1',
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } },
            { phone: { contains: 'test', mode: 'insensitive' } },
            { customer_number: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { created_at: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const mockCustomer = {
        id: '1',
        name: 'Test Customer',
        company_id: 'comp1',
      };

      mockPrismaService.customers.findUnique.mockResolvedValue(mockCustomer);

      const result = await service.findOne('1', 'comp1');

      expect(result).toEqual(mockCustomer);
      expect(mockPrismaService.customers.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          quotes: {
            take: 5,
            orderBy: { created_at: 'desc' },
          },
          invoices: {
            take: 5,
            orderBy: { created_at: 'desc' },
          },
        },
      });
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockPrismaService.customers.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999', 'comp1')).rejects.toThrow('Customer with ID 999 not found');
    });
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createDto = {
        name: 'New Customer',
        email: 'new@example.com',
        currency_code: 'USD',
        customerType: 'individual' as const,
      };

      const mockCreatedCustomer = {
        id: '1',
        name: 'New Customer',
        email: 'new@example.com',
        currency_code: 'USD',
        customer_type: 'individual',
        company_id: 'comp1',
        customer_number: 'CUST-00001',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.customers.findFirst.mockResolvedValue(null);
      mockPrismaService.customers.create.mockResolvedValue(mockCreatedCustomer);

      const result = await service.create('comp1', 'user1', createDto);

      expect(result).toEqual(mockCreatedCustomer);
      expect(mockPrismaService.customers.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const updateDto = {
        name: 'Updated Customer',
      };

      const existingCustomer = {
        id: '1',
        name: 'Old Customer',
        company_id: 'comp1',
      };

      const mockUpdatedCustomer = {
        id: '1',
        name: 'Updated Customer',
        company_id: 'comp1',
      };

      mockPrismaService.customers.findUnique.mockResolvedValue(existingCustomer);
      mockPrismaService.customers.update.mockResolvedValue(mockUpdatedCustomer);

      const result = await service.update('1', 'comp1', 'user1', updateDto);

      expect(result).toEqual(mockUpdatedCustomer);
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a customer', async () => {
      const existingCustomer = {
        id: '1',
        name: 'Test Customer',
        company_id: 'comp1',
      };

      mockPrismaService.customers.findUnique.mockResolvedValue(existingCustomer);
      mockPrismaService.customers.update.mockResolvedValue({
        ...existingCustomer,
        deleted_at: new Date(),
      });

      const result = await service.remove('1', 'comp1', 'user1');

      expect(result).toEqual({ message: 'Customer deleted successfully' });
      expect(mockPrismaService.customers.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deleted_at: expect.any(Date) },
      });
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });
});
