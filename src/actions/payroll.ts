'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { AttendanceStatus, LeaveStatus, PayrollStatus } from '../../prisma/generated'

export async function getAttendancesByDate(date: string) {
  try {
    const targetDate = new Date(`${date}T00:00:00.000Z`)
    const attendances = await prisma.attendance.findMany({
      where: { date: targetDate },
      include: { user: { select: { id: true, fullName: true, role: true } } },
    })
    return { success: true, attendances: JSON.parse(JSON.stringify(attendances)) }
  } catch (error) {
    console.error('Failed to fetch attendances:', error)
    return { success: false, error: 'Failed to fetch attendances' }
  }
}

export async function markAttendance(
  userId: string, 
  date: string, 
  status: AttendanceStatus, 
  overtimeHours?: number,
  checkIn?: string,
  checkOut?: string
) {
  try {
    const targetDate = new Date(`${date}T00:00:00.000Z`)
    let finalOvertimeHours = overtimeHours !== undefined && overtimeHours !== null ? Number(overtimeHours) : null;
    
    if (checkIn && checkOut && finalOvertimeHours === null) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { dailyShiftHours: true }
      });
      const shiftHours = user?.dailyShiftHours ? Number(user.dailyShiftHours) : 8;

      const inDate = new Date(`1970-01-01T${checkIn}:00Z`);
      const outDate = new Date(`1970-01-01T${checkOut}:00Z`);
      let diffHours = (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 0) diffHours += 24; // Cross-midnight shift
      if (diffHours > shiftHours) {
        finalOvertimeHours = parseFloat((diffHours - shiftHours).toFixed(1));
      } else {
        finalOvertimeHours = 0;
      }
    }

    const createData: any = { 
      userId, 
      date: targetDate, 
      status,
      overtimeHours: finalOvertimeHours,
      checkIn: checkIn ? new Date(`1970-01-01T${checkIn}:00Z`) : null,
      checkOut: checkOut ? new Date(`1970-01-01T${checkOut}:00Z`) : null,
    }

    const updateData: any = { status, checkIn: createData.checkIn, checkOut: createData.checkOut }
    if (finalOvertimeHours !== null) updateData.overtimeHours = finalOvertimeHours;

    const attendance = await prisma.attendance.upsert({
      where: { userId_date: { userId, date: targetDate } },
      update: updateData,
      create: createData,
    })
    revalidatePath('/admin/payroll')
    return { success: true, attendance: JSON.parse(JSON.stringify(attendance)) }
  } catch (error) {
    console.error('Failed to mark attendance:', error)
    return { success: false, error: 'Failed to mark attendance' }
  }
}

export async function generateMonthlyPayroll(month: number, year: number) {
  try {
    const employees = await prisma.user.findMany({
      where: { status: 'ACTIVE', monthlyBaseSalary: { not: null } }
    });

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const workingDays = new Date(year, month, 0).getDate();

    for (const emp of employees) {
      if (!emp.monthlyBaseSalary) continue;

      const attendances = await prisma.attendance.findMany({
        where: {
          userId: emp.id,
          date: { gte: startDate, lte: endDate }
        }
      });

      let presentDays = 0;
      let totalOvertimeHours = 0;

      for (const att of attendances) {
        if (att.status === 'PRESENT' || att.status === 'LATE') presentDays += 1;
        else if (att.status === 'HALF_DAY') presentDays += 0.5;
        if (att.overtimeHours) totalOvertimeHours += Number(att.overtimeHours);
      }

      // Query approved leaves
      const leaves = await prisma.leave.findMany({
        where: {
          userId: emp.id,
          status: 'APPROVED',
          startDate: { gte: startDate },
          endDate: { lte: endDate }
        }
      });

      let paidLeaveDays = 0;
      let leaveDays = 0;
      for (const l of leaves) {
        const days = Math.ceil((l.endDate.getTime() - l.startDate.getTime()) / (1000 * 3600 * 24)) + 1;
        leaveDays += days;
        if (l.type !== 'UNPAID') {
          paidLeaveDays += days;
        }
      }

      // Effective paid days and absent days calculation ("jitna attendance utna salary")
      const paidDays = Math.min(workingDays, presentDays + paidLeaveDays);
      const absentDays = Math.max(0, workingDays - paidDays);

      // Calculate remaining advance
      const advances = await prisma.salaryAdvance.findMany({
        where: { userId: emp.id, status: { in: ['APPROVED', 'PENDING'] } }
      });
      let totalAdvanceRemaining = 0;
      for (const adv of advances) {
        totalAdvanceRemaining += Number(adv.amount) - Number(adv.deductedAmount);
      }

      const basicSalary = Number(emp.monthlyBaseSalary);
      const perDaySalary = basicSalary / workingDays;
      const empShiftHours = emp.dailyShiftHours ? Number(emp.dailyShiftHours) : 8;
      
      const calculatedDeductions = absentDays * perDaySalary;
      const calculatedOvertimePay = totalOvertimeHours * (perDaySalary / empShiftHours);

      let preliminaryNet = basicSalary + calculatedOvertimePay - calculatedDeductions;
      
      let calculatedAdvanceDeduction = 0;
      if (totalAdvanceRemaining > 0 && preliminaryNet > 0) {
        calculatedAdvanceDeduction = Math.min(totalAdvanceRemaining, preliminaryNet);
      }
      
      const netSalary = Math.max(0, preliminaryNet - calculatedAdvanceDeduction);

      await prisma.payroll.upsert({
        where: { userId_month_year: { userId: emp.id, month, year } },
        update: { 
          basicSalary, 
          workingDays,
          presentDays: Math.floor(presentDays),
          absentDays,
          leaveDays,
          totalOvertimeHours,
          overtimePay: calculatedOvertimePay,
          deductions: calculatedDeductions,
          advance: calculatedAdvanceDeduction,
          netSalary 
        },
        create: {
          userId: emp.id,
          month,
          year,
          basicSalary,
          workingDays,
          presentDays: Math.floor(presentDays),
          absentDays,
          leaveDays,
          totalOvertimeHours,
          overtimePay: calculatedOvertimePay,
          deductions: calculatedDeductions,
          advance: calculatedAdvanceDeduction,
          netSalary
        }
      });
    }

    revalidatePath('/admin/payroll')
    return { success: true }
  } catch (error) {
    console.error('Failed to generate payroll:', error)
    return { success: false, error: 'Failed to generate payroll' }
  }
}

export async function getPayrolls(month: number, year: number) {
  try {
    const payrolls = await prisma.payroll.findMany({
      where: { month, year },
      include: { user: { select: { fullName: true, role: true, monthlyBaseSalary: true } } },
    });
    return { success: true, payrolls: JSON.parse(JSON.stringify(payrolls)) };
  } catch (error) {
    return { success: false, error: 'Failed to fetch payrolls' };
  }
}

export async function updatePayrollRecord(payrollId: string, data: any) {
  try {
    const p = await prisma.payroll.findUnique({ where: { id: payrollId } });
    if (!p) return { success: false, error: 'Not found' };

    const basicSalary = Number(p.basicSalary);
    const overtimePay = data.overtimePay !== undefined ? Number(data.overtimePay) : Number(p.overtimePay);
    const bonus = data.bonus !== undefined ? Number(data.bonus) : Number(p.bonus);
    const deductions = data.deductions !== undefined ? Number(data.deductions) : Number(p.deductions);
    const advance = data.advance !== undefined ? Number(data.advance) : Number(p.advance);

    const netSalary = basicSalary + overtimePay + bonus - deductions - advance;

    await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        overtimePay,
        bonus,
        deductions,
        advance,
        netSalary,
        status: data.status ? data.status : p.status, // Allow approving
      }
    });

    revalidatePath('/admin/payroll');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update payroll' };
  }
}

export async function markPayrollPaid(payrollId: string, paymentMethod: any) {
  try {
    const p = await prisma.payroll.findUnique({ where: { id: payrollId } });
    if (!p) return { success: false, error: 'Not found' };

    // Deduct advance from actual SalaryAdvance records if paid
    if (Number(p.advance) > 0) {
      const advances = await prisma.salaryAdvance.findMany({
        where: { userId: p.userId, status: { in: ['APPROVED', 'PENDING'] } },
        orderBy: { createdAt: 'asc' }
      });
      
      let amountToDeduct = Number(p.advance);
      for (const adv of advances) {
        if (amountToDeduct <= 0) break;
        const remaining = Number(adv.amount) - Number(adv.deductedAmount);
        const deductionForThis = Math.min(remaining, amountToDeduct);
        
        const newDeducted = Number(adv.deductedAmount) + deductionForThis;
        await prisma.salaryAdvance.update({
          where: { id: adv.id },
          data: {
            deductedAmount: newDeducted,
            status: newDeducted >= Number(adv.amount) ? 'DEDUCTED' : 'APPROVED'
          }
        });
        amountToDeduct -= deductionForThis;
      }
    }

    await prisma.payroll.update({
      where: { id: payrollId },
      data: { status: 'PAID', paymentDate: new Date(), paymentMethod }
    });
    revalidatePath('/admin/payroll');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to pay' };
  }
}

export async function getSalaryAdvances(type: 'PENDING' | 'DEDUCTED' = 'PENDING') {
  try {
    const whereCondition = type === 'DEDUCTED' 
      ? { status: 'DEDUCTED' as const }
      : { status: { in: ['PENDING', 'APPROVED'] as any } };

    const advances = await prisma.salaryAdvance.findMany({
      where: whereCondition,
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, advances: JSON.parse(JSON.stringify(advances)) };
  } catch (error) {
    return { success: false, error: 'Failed to fetch advances' };
  }
}

export async function createSalaryAdvance(userId: string, amount: number, reason: string) {
  try {
    await prisma.salaryAdvance.create({
      data: { userId, amount, reason, status: 'APPROVED' }
    });
    revalidatePath('/admin/payroll');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to create advance' };
  }
}

export async function getLeaves() {
  try {
    const leaves = await prisma.leave.findMany({
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, leaves: JSON.parse(JSON.stringify(leaves)) };
  } catch (error) {
    return { success: false, error: 'Failed to fetch leaves' };
  }
}

export async function updateLeave(id: string, data: any) {
  try {
    await prisma.leave.update({ where: { id }, data });
    revalidatePath('/admin/payroll');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update leave' };
  }
}

export async function createLeave(data: any) {
  try {
    await prisma.leave.create({ data });
    revalidatePath('/admin/payroll');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to create leave' };
  }
}

export async function deleteLeave(id: string) {
  try {
    await prisma.leave.delete({ where: { id } });
    revalidatePath('/admin/payroll');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete leave' };
  }
}
