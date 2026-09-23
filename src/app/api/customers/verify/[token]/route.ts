import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/customers/verify/[token] - Lookup customer by unique QR Token
export async function GET(
  req: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token: rawToken } = await context.params;
    const token = rawToken?.trim();

    if (!token) {
      return NextResponse.json({ error: 'QR token is required' }, { status: 400 });
    }

    // Lookup customer by unique indexed qrToken
    const customer = await prisma.customer.findUnique({
      where: { qrToken: token },
      include: {
        event: {
          include: {
            items: true,
          },
        },
        attendance: true,
        redemptions: {
          include: {
            redemptionItem: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          found: false,
          error: 'Invalid QR Code or Attendee not found',
        },
        { status: 404 }
      );
    }

    // Map redemption items with attendee's claim status
    const itemsWithStatus = customer.event.items.map((item) => {
      const redemption = customer.redemptions.find(
        (r) => r.redemptionItemId === item.id
      );

      return {
        id: item.id,
        name: item.name,
        maxPerCustomer: item.maxPerCustomer,
        isRedeemed: !!redemption,
        redeemedAt: redemption?.redeemedAt || null,
        redeemedBy: redemption?.redeemedBy || null,
      };
    });

    return NextResponse.json({
      found: true,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        ticketType: customer.ticketType,
        qrToken: customer.qrToken,
        createdAt: customer.createdAt,
      },
      event: {
        id: customer.event.id,
        name: customer.event.name,
        date: customer.event.date,
        location: customer.event.location,
      },
      attendance: {
        isCheckedIn: !!customer.attendance,
        scannedAt: customer.attendance?.scannedAt || null,
        scannedBy: customer.attendance?.scannedBy || null,
      },
      items: itemsWithStatus,
    });
  } catch (error: any) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify QR token' },
      { status: 500 }
    );
  }
}
