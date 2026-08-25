'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { Role, EmployeeStatus, ShiftTiming } from '../../prisma/generated'

export interface EmployeeData {
  id: string
  email: string
  phone: string | null
  fullName: string | null
  role: Role
  status: EmployeeStatus
  monthlyBaseSalary: number | null
  shiftTiming: ShiftTiming | null
  hiredAt: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export async function getEmployees(page: number = 1, pageSize: number = 10, search: string = '') {
  try {
    const skip = (page - 1) * pageSize

    const whereClause = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where: whereClause }),
    ])

    const employees: EmployeeData[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role as Role,
      status: user.status as EmployeeStatus,
      monthlyBaseSalary: user.monthlyBaseSalary ? Number(user.monthlyBaseSalary) : null,
      shiftTiming: user.shiftTiming as ShiftTiming | null,
      hiredAt: user.hiredAt ? user.hiredAt.toISOString() : null,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }))

    return {
      success: true,
      employees,
      total,
      totalPages: Math.ceil(total / pageSize),
    }
  } catch (error) {
    console.error('Failed to fetch employees:', error)
    return { success: false, error: 'Failed to fetch employees list', employees: [], total: 0, totalPages: 1 }
  }
}

export async function getEmployeeById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return { success: false, error: 'Employee not found' }
    }

    const employee: EmployeeData = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role as Role,
      status: user.status as EmployeeStatus,
      monthlyBaseSalary: user.monthlyBaseSalary ? Number(user.monthlyBaseSalary) : null,
      shiftTiming: user.shiftTiming as ShiftTiming | null,
      hiredAt: user.hiredAt ? user.hiredAt.toISOString() : null,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }

    return { success: true, employee }
  } catch (error) {
    console.error('Failed to fetch employee details:', error)
    return { success: false, error: 'Failed to fetch employee details' }
  }
}

export async function createEmployee(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = (formData.get('fullName') as string) || null
    const phone = (formData.get('phone') as string) || null
    const role = (formData.get('role') as Role) || 'CASHIER'
    const monthlyBaseSalaryStr = formData.get('monthlyBaseSalary') as string
    const shiftTiming = (formData.get('shiftTiming') as ShiftTiming) || null
    const avatarUrl = (formData.get('avatarUrl') as string) || null

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    })

    if (existingUser) {
      return { success: false, error: 'User with this email or phone already exists' }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newEmployee = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phone,
        role,
        monthlyBaseSalary: monthlyBaseSalaryStr ? parseFloat(monthlyBaseSalaryStr) : null,
        shiftTiming,
        avatarUrl,
      },
    })

    revalidatePath('/admin/employees')

    return { success: true, employeeId: newEmployee.id }
  } catch (error) {
    console.error('Error creating employee:', error)
    return { success: false, error: 'Failed to create employee profile' }
  }
}

export async function updateEmployee(id: string, formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = (formData.get('fullName') as string) || null
    const phone = (formData.get('phone') as string) || null
    const role = (formData.get('role') as Role) || 'CASHIER'
    const status = (formData.get('status') as EmployeeStatus) || 'ACTIVE'
    const monthlyBaseSalaryStr = formData.get('monthlyBaseSalary') as string
    const shiftTiming = (formData.get('shiftTiming') as ShiftTiming) || null
    const hiredAtStr = formData.get('hiredAt') as string
    const avatarUrl = (formData.get('avatarUrl') as string) || null

    if (!email) {
      return { success: false, error: 'Email is required' }
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { email },
              ...(phone ? [{ phone }] : []),
            ],
          },
        ],
      },
    })

    if (existingUser) {
      return { success: false, error: 'Another user with this email or phone already exists' }
    }

    const updateData: any = {
      email,
      fullName,
      phone,
      role,
      status,
      monthlyBaseSalary: monthlyBaseSalaryStr ? parseFloat(monthlyBaseSalaryStr) : null,
      shiftTiming,
      hiredAt: hiredAtStr ? new Date(hiredAtStr) : null,
      avatarUrl,
    }

    if (password && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/admin/employees')
    revalidatePath(`/admin/employees/${id}/edit`)

    return { success: true }
  } catch (error) {
    console.error('Error updating employee:', error)
    return { success: false, error: 'Failed to update employee profile' }
  }
}

export async function deleteEmployee(id: string) {
  try {
    await prisma.user.delete({ where: { id } })
    revalidatePath('/admin/employees')
    return { success: true }
  } catch (error) {
    console.error('Error deleting employee:', error)
    return { success: false, error: 'Failed to delete employee' }
  }
}
