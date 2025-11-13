
import { z } from 'zod';
import { EmployeeStatus } from '@prisma/client';

const createEmployee = z.object({
  body: z.object({
    employeeId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    nationalId: z.string(),
    jobTitle: z.string(),
    phone: z.string().optional(),
    department: z.string(),
    status: z.nativeEnum(EmployeeStatus).optional(),
    contractEndDate: z.string().datetime(),
  }),
});

const getEmployee = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

const updateEmployee = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    employeeId: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    nationalId: z.string().optional(),
    jobTitle: z.string().optional(),
    phone: z.string().optional(),
    department: z.string().optional(),
    status: z.nativeEnum(EmployeeStatus).optional(),
    contractEndDate: z.string().datetime().optional(),
  }).min(1),
});

const deleteEmployee = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const employeeValidation = {
  createEmployee,
  getEmployee,
  updateEmployee,
  deleteEmployee,
};
