import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/events/[id]/stats - Aggregate real-time statistics
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await context.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        items: {
          include: {
            redemptions: {
              include: {
                customer: {
                  select: { id: true, fullName: true, ticketType: true },
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const [totalRegistered, checkedInCount, recentAttendances, recentRedemptions] =
      await Promise.all([
        prisma.customer.count({ where: { eventId } }),
        prisma.attendance.count({
          where: {
            customer: { eventId },
          },
        }),
        prisma.attendance.findMany({
          where: { customer: { eventId } },
          take: 10,
          orderBy: { scannedAt: 'desc' },
          include: {
            customer: {
              select: { fullName: true, ticketType: true },
            },
          },
        }),
        prisma.redemption.findMany({
          where: { customer: { eventId } },
          take: 10,
          orderBy: { redeemedAt: 'desc' },
          include: {
            customer: {
              select: { fullName: true, ticketType: true },
            },
            redemptionItem: {
              select: { name: true },
            },
          },
        }),
      ]);

    const attendanceRate =
      totalRegistered > 0
        ? Math.round((checkedInCount / totalRegistered) * 100)
        : 0;

    const itemStats = event.items.map((item) => {
      const redeemedCount = item.redemptions.length;
      const rate =
        totalRegistered > 0
          ? Math.round((redeemedCount / totalRegistered) * 100)
          : 0;

      return {
        id: item.id,
        name: item.name,
        maxPerCustomer: item.maxPerCustomer,
        redeemedCount,
        redemptionRate: rate,
      };
    });

    // Merge & format recent live activities
    const activities = [
      ...recentAttendances.map((a) => ({
        type: 'CHECK_IN' as const,
        id: a.id,
        title: `${a.customer.fullName} checked in`,
        subtitle: a.customer.ticketType || 'Attendee',
        timestamp: a.scannedAt,
        staff: a.scannedBy || 'Staff',
      })),
      ...recentRedemptions.map((r) => ({
        type: 'REDEMPTION' as const,
        id: r.id,
        title: `${r.customer.fullName} claimed ${r.redemptionItem.name}`,
        subtitle: r.customer.ticketType || 'Attendee',
        timestamp: r.redeemedAt,
        staff: r.redeemedBy || 'Staff',
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 12);

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location,
      },
      stats: {
        totalRegistered,
        totalCheckedIn: checkedInCount,
        attendanceRate,
        items: itemStats,
        activities,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching event stats:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
