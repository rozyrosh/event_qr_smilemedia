import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// POST /api/attendance - Check-in attendee with direct concurrency-safe insert
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, scannedBy } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const staffIdentifier =
      scannedBy ||
      (session.user as any)?.name ||
      session.user?.email ||
      'Staff';

    // Direct INSERT pattern relying on DB unique constraint (customerId)
    try {
      const attendance = await prisma.attendance.create({
        data: {
          customerId,
          scannedBy: staffIdentifier,
        },
      });

      return NextResponse.json(
        {
          success: true,
          status: 'CHECKED_IN',
          message: 'Attendance recorded successfully',
          attendance,
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      // Prisma P2002: Unique constraint failed on the constraint: `customerId`
      if (
        dbError instanceof Prisma.PrismaClientKnownRequestError &&
        dbError.code === 'P2002'
      ) {
        // Fetch existing record to provide full contextual feedback
        const existingAttendance = await prisma.attendance.findUnique({
          where: { customerId },
        });

        return NextResponse.json(
          {
            success: false,
            alreadyCheckedIn: true,
            status: 'ALREADY_CHECKED_IN',
            message: 'Attendee is already checked in',
            attendance: existingAttendance,
          },
          { status: 409 }
        );
      }

      throw dbError;
    }
  } catch (error: any) {
    console.error('Error recording attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record attendance' },
      { status: 500 }
    );
  }
}
