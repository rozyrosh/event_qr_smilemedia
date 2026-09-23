import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/events/[id]/export - Export event attendance & redemption report as CSV
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        items: true,
        customers: {
          include: {
            attendance: true,
            redemptions: {
              include: {
                redemptionItem: true,
              },
            },
          },
          orderBy: { fullName: 'asc' },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Build CSV Headers
    const baseHeaders = [
      'Customer ID',
      'Full Name',
      'Company',
      'Mobile Number',
      'Email',
      'Ticket Type',
      'QR Token',
      'Checked In',
      'Check-in Time',
      'Scanned By',
    ];

    const itemHeaders = event.items.map((i) => `Item: ${i.name}`);
    const headers = [...baseHeaders, ...itemHeaders];

    // Helper to escape CSV values
    const escapeCsv = (val: string | null | undefined) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = event.customers.map((cust) => {
      const isCheckedIn = cust.attendance ? 'YES' : 'NO';
      const checkInTime = cust.attendance
        ? new Date(cust.attendance.scannedAt).toISOString()
        : '';
      const scannedBy = cust.attendance?.scannedBy || '';

      const itemStatuses = event.items.map((item) => {
        const red = cust.redemptions.find((r) => r.redemptionItemId === item.id);
        if (red) {
          return `REDEEMED (${new Date(red.redeemedAt).toLocaleTimeString()} by ${red.redeemedBy || 'Staff'})`;
        }
        return 'NOT REDEEMED';
      });

      return [
        escapeCsv(cust.id),
        escapeCsv(cust.fullName),
        escapeCsv(cust.company),
        escapeCsv(cust.phone),
        escapeCsv(cust.email),
        escapeCsv(cust.ticketType),
        escapeCsv(cust.qrToken),
        escapeCsv(isCheckedIn),
        escapeCsv(checkInTime),
        escapeCsv(scannedBy),
        ...itemStatuses.map(escapeCsv),
      ].join(',');
    });

    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');

    const sanitizedEventName = event.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedEventName}_report_${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
