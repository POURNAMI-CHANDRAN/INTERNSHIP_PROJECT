// Mock data for resource scheduling dashboard

export interface Employee {
  id: string;
  name: string;
  role: string;
  role: string;
  avatar: string;
  email: string;
}

export interface role {
  id: string;
  name: string;
  employees: Employee[];
}

export interface Project {
  id: string;
  name: string;
  color: string;
  startWeek: number;
  endWeek: number;
  hoursPerWeek: number;
}

export interface Allocation {
  id: string;
  employeeId: string;
  projectId: string;
  weekIndex: number;
  hours: number;
  percentage: number; // 0-100, >100 = overallocated
}

export interface Task {
  id: string;
  name: string;
  assigneeId: string;
  hours: number;
  projectId: string;
}

export const employees: Employee[] = [
  {
    id: "emp1",
    name: "Sarah Chen",
    role: "Senior Developer",
    role: "Developers",
    avatar: "SC",
    email: "sarah.chen@company.com"
  },
  {
    id: "emp2",
    name: "Mike Johnson",
    role: "Full Stack Developer",
    role: "Developers",
    avatar: "MJ",
    email: "mike.johnson@company.com"
  },
  {
    id: "emp3",
    name: "Emily Rodriguez",
    role: "Backend Developer",
    role: "Developers",
    avatar: "ER",
    email: "emily.rodriguez@company.com"
  },
  {
    id: "emp4",
    name: "James Park",
    role: "Frontend Developer",
    role: "Developers",
    avatar: "JP",
    email: "james.park@company.com"
  },
  {
    id: "emp5",
    name: "Lisa Anderson",
    role: "UI Designer",
    role: "Designers",
    avatar: "LA",
    email: "lisa.anderson@company.com"
  },
  {
    id: "emp6",
    name: "David Kim",
    role: "UX Designer",
    role: "Designers",
    avatar: "DK",
    email: "david.kim@company.com"
  },
  {
    id: "emp7",
    name: "Rachel Green",
    role: "Product Designer",
    role: "Designers",
    avatar: "RG",
    email: "rachel.green@company.com"
  },
  {
    id: "emp8",
    name: "Tom Wilson",
    role: "QA Engineer",
    role: "QA",
    avatar: "TW",
    email: "tom.wilson@company.com"
  }
];

export const roles: role[] = [
  {
    id: "dept1",
    name: "Developers",
    employees: employees.filter(e => e.role === "Developers")
  },
  {
    id: "dept2",
    name: "Designers",
    employees: employees.filter(e => e.role === "Designers")
  },
  {
    id: "dept3",
    name: "QA",
    employees: employees.filter(e => e.role === "QA")
  }
];

export const projects: Project[] = [
  {
    id: "proj1",
    name: "E-Commerce Platform",
    color: "#3B82F6",
    startWeek: 0,
    endWeek: 6,
    hoursPerWeek: 40
  },
  {
    id: "proj2",
    name: "Mobile App Redesign",
    color: "#8B5CF6",
    startWeek: 2,
    endWeek: 8,
    hoursPerWeek: 32
  },
  {
    id: "proj3",
    name: "Dashboard Analytics",
    color: "#10B981",
    startWeek: 1,
    endWeek: 5,
    hoursPerWeek: 24
  },
  {
    id: "proj4",
    name: "API Integration",
    color: "#F59E0B",
    startWeek: 3,
    endWeek: 7,
    hoursPerWeek: 20
  }
];

// Generate allocations for the grid (12 weeks)
export const allocations: Allocation[] = [];

// Helper function to generate random allocation percentage
const getRandomAllocation = () => {
  const rand = Math.random();
  if (rand < 0.2) return 120; // overallocated
  if (rand < 0.5) return 100; // fully allocated
  if (rand < 0.8) return 75; // balanced
  return 40; // underallocated
};

employees.forEach((employee) => {
  for (let week = 0; week < 12; week++) {
    const percentage = getRandomAllocation();
    allocations.push({
      id: `alloc-${employee.id}-${week}`,
      employeeId: employee.id,
      projectId: projects[week % projects.length].id,
      weekIndex: week,
      hours: (percentage / 100) * 40,
      percentage
    });
  }
});

export const tasks: Task[] = [
  {
    id: "task1",
    name: "Make Risk Page",
    assigneeId: "emp1",
    hours: 16,
    projectId: "proj1"
  },
  {
    id: "task2",
    name: "Navigation Recommendation",
    assigneeId: "emp2",
    hours: 12,
    projectId: "proj1"
  },
  {
    id: "task3",
    name: "Hank's BBQ Task",
    assigneeId: "emp3",
    hours: 8,
    projectId: "proj2"
  },
  {
    id: "task4",
    name: "Design Component Library",
    assigneeId: "emp5",
    hours: 24,
    projectId: "proj3"
  },
  {
    id: "task5",
    name: "API Documentation",
    assigneeId: "emp2",
    hours: 20,
    projectId: "proj4"
  },
  {
    id: "task6",
    name: "User Testing Setup",
    assigneeId: "emp6",
    hours: 10,
    projectId: "proj2"
  }
];

// Generate weeks for timeline
export const generateWeeks = (count: number, startDate = new Date()) => {
  const weeks = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() + (i * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    weeks.push({
      index: i,
      label: `W${i + 1}`,
      startDate: weekStart,
      endDate: weekEnd,
      month: weekStart.toLocaleDateString('en-US', { month: 'short' }),
      isCurrentWeek: i === 1 // Mock current week
    });
  }
  
  return weeks;
};

export const kpiData = {
  totalAvailableHours: 1920,
  totalAllocatedHours: 1584,
  potentialRevenue: 158400,
  budgetUtilization: 82.5
};
