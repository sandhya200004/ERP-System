/**
 * Demo Data Initializer for Admin Control Panel
 * Run this in browser console to populate with sample data
 */

export const initializeDemoData = () => {
  const demoEmployees = [
    {
      id: 'emp-001',
      name: 'John Smith',
      email: 'john.smith@triverse.com',
      role: 'MANAGER',
      isActive: true,
      modules: {
        dashboard: true,
        attendance: true,
        tasks: true,
        kpi: true,
        reports: true,
        customers: true,
        products: false,
        invoices: true,
        payments: false,
        expenses: false,
        leads: true,
        proposals: true,
        employees: false,
      },
      createdAt: new Date('2025-01-01').toISOString(),
    },
    {
      id: 'emp-002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@triverse.com',
      role: 'EMPLOYEE',
      isActive: true,
      modules: {
        dashboard: true,
        attendance: true,
        tasks: true,
        kpi: true,
        reports: false,
        customers: true,
        products: false,
        invoices: false,
        payments: false,
        expenses: false,
        leads: true,
        proposals: false,
        employees: false,
      },
      createdAt: new Date('2025-01-05').toISOString(),
    },
    {
      id: 'emp-003',
      name: 'Michael Chen',
      email: 'michael.chen@triverse.com',
      role: 'EMPLOYEE',
      isActive: true,
      modules: {
        dashboard: true,
        attendance: true,
        tasks: true,
        kpi: true,
        reports: false,
        customers: false,
        products: true,
        invoices: true,
        payments: true,
        expenses: true,
        leads: false,
        proposals: false,
        employees: false,
      },
      createdAt: new Date('2025-01-10').toISOString(),
    },
    {
      id: 'emp-004',
      name: 'Emily Davis',
      email: 'emily.davis@triverse.com',
      role: 'EMPLOYEE',
      isActive: false,
      modules: {
        dashboard: true,
        attendance: true,
        tasks: true,
        kpi: false,
        reports: false,
        customers: true,
        products: false,
        invoices: false,
        payments: false,
        expenses: false,
        leads: true,
        proposals: true,
        employees: false,
      },
      createdAt: new Date('2024-12-15').toISOString(),
    },
  ];

  const demoTasks = [
    {
      id: 'task-001',
      title: 'Complete Q1 Sales Report',
      description: 'Prepare comprehensive sales analysis for Q1 2026, including revenue trends, top customers, and forecasts.',
      priority: 'high',
      dueDate: new Date('2026-01-15').toISOString().split('T')[0],
      status: 'completed',
      assignedTo: ['emp-001'],
      assignedBy: 'admin-001',
      createdAt: new Date('2026-01-02').toISOString(),
      acceptedAt: new Date('2026-01-02T10:30:00').toISOString(),
      completedAt: new Date('2026-01-14T16:45:00').toISOString(),
    },
    {
      id: 'task-002',
      title: 'Update Customer Database',
      description: 'Review and update all customer contact information. Verify email addresses and phone numbers.',
      priority: 'medium',
      dueDate: new Date('2026-01-12').toISOString().split('T')[0],
      status: 'in_progress',
      assignedTo: ['emp-002'],
      assignedBy: 'admin-001',
      createdAt: new Date('2026-01-03').toISOString(),
      acceptedAt: new Date('2026-01-03T09:15:00').toISOString(),
    },
    {
      id: 'task-003',
      title: 'Inventory Reconciliation',
      description: 'Conduct full inventory count and reconcile with system records. Report any discrepancies.',
      priority: 'urgent',
      dueDate: new Date('2026-01-08').toISOString().split('T')[0],
      status: 'completed',
      assignedTo: ['emp-003'],
      assignedBy: 'admin-001',
      createdAt: new Date('2026-01-04').toISOString(),
      acceptedAt: new Date('2026-01-04T08:00:00').toISOString(),
      completedAt: new Date('2026-01-07T17:30:00').toISOString(),
    },
    {
      id: 'task-004',
      title: 'Prepare Marketing Materials',
      description: 'Design new product brochures and update website content for upcoming campaign.',
      priority: 'medium',
      dueDate: new Date('2026-01-20').toISOString().split('T')[0],
      status: 'accepted',
      assignedTo: ['emp-002', 'emp-003'],
      assignedBy: 'admin-001',
      createdAt: new Date('2026-01-05').toISOString(),
      acceptedAt: new Date('2026-01-05T11:20:00').toISOString(),
    },
    {
      id: 'task-005',
      title: 'Client Follow-up Calls',
      description: 'Contact all clients from December proposals to check status and schedule demos.',
      priority: 'high',
      dueDate: new Date('2026-01-10').toISOString().split('T')[0],
      status: 'assigned',
      assignedTo: ['emp-001'],
      assignedBy: 'admin-001',
      createdAt: new Date('2026-01-06').toISOString(),
    },
    {
      id: 'task-006',
      title: 'System Backup Verification',
      description: 'Verify all automated backups are functioning correctly. Test restore procedure.',
      priority: 'urgent',
      dueDate: new Date('2026-01-07').toISOString().split('T')[0],
      status: 'completed',
      assignedTo: ['emp-003'],
      assignedBy: 'admin-001',
      createdAt: new Date('2026-01-01').toISOString(),
      acceptedAt: new Date('2026-01-02T07:00:00').toISOString(),
      completedAt: new Date('2026-01-06T12:00:00').toISOString(),
    },
    {
      id: 'task-007',
      title: 'Training Documentation',
      description: 'Create user guides and video tutorials for new ERP features.',
      priority: 'low',
      dueDate: new Date('2026-01-25').toISOString().split('T')[0],
      status: 'assigned',
      assignedTo: ['emp-002'],
      assignedBy: 'admin-001',
      createdAt: new Date('2026-01-04').toISOString(),
    },
    {
      id: 'task-008',
      title: 'Invoice Processing',
      description: 'Process all pending invoices and send payment reminders to overdue accounts.',
      priority: 'high',
      dueDate: new Date('2026-01-09').toISOString().split('T')[0],
      status: 'in_progress',
      assignedTo: ['emp-003', 'emp-001'],
      assignedBy: 'admin-001',
      createdAt: new Date('2026-01-05').toISOString(),
      acceptedAt: new Date('2026-01-05T13:45:00').toISOString(),
    },
  ];

  // Get existing admin employee
  const existingEmployees = JSON.parse(localStorage.getItem('triverse_admin_employees') || '[]');
  const adminEmployee = existingEmployees.find((e: any) => e.role === 'ADMIN');

  // Merge employees (keep admin, add demos)
  const allEmployees = adminEmployee 
    ? [adminEmployee, ...demoEmployees]
    : demoEmployees;

  // Save to localStorage
  localStorage.setItem('triverse_admin_employees', JSON.stringify(allEmployees));
  localStorage.setItem('triverse_admin_tasks', JSON.stringify(demoTasks));

  console.log('✅ Demo data initialized!');
  console.log(`📊 ${demoEmployees.length} employees added`);
  console.log(`📝 ${demoTasks.length} tasks added`);
  console.log('🔄 Refresh the page to see changes');

  return { employees: allEmployees, tasks: demoTasks };
};

// Helper to clear all data
export const clearDemoData = () => {
  localStorage.removeItem('triverse_admin_employees');
  localStorage.removeItem('triverse_admin_tasks');
  console.log('🗑️ All demo data cleared');
  console.log('🔄 Refresh the page to reset');
};

// Helper to view current data
export const viewCurrentData = () => {
  const employees = JSON.parse(localStorage.getItem('triverse_admin_employees') || '[]');
  const tasks = JSON.parse(localStorage.getItem('triverse_admin_tasks') || '[]');
  
  console.log('👥 Current Employees:', employees);
  console.log('📋 Current Tasks:', tasks);
  
  return { employees, tasks };
};

// Export for window object
if (typeof window !== 'undefined') {
  (window as any).adminDemo = {
    init: initializeDemoData,
    clear: clearDemoData,
    view: viewCurrentData,
  };
  
  console.log('💡 Admin Demo Utils loaded!');
  console.log('Usage:');
  console.log('  adminDemo.init()  - Initialize demo data');
  console.log('  adminDemo.clear() - Clear all data');
  console.log('  adminDemo.view()  - View current data');
}

export default {
  initializeDemoData,
  clearDemoData,
  viewCurrentData,
};
