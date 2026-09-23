import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCryptoUUID, generateQRCodeDataURL } from '@/lib/qr';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/customers - List customers with filtering & pagination
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const search = searchParams.get('search') || '';
    const ticketType = searchParams.get('ticketType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (ticketType && ticketType !== 'ALL') where.ticketType = ticketType;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { qrToken: { contains: search } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          attendance: true,
          redemptions: {
            include: {
              redemptionItem: true,
            },
          },
          event: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/customers - Create new customer with crypto UUID and QR
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, fullName, phone, email, ticketType } = body;

    if (!eventId || !fullName) {
      return NextResponse.json(
        { error: 'Event ID and Full Name are required' },
        { status: 400 }
      );
    }

    // Generate cryptographically random UUID token
    const qrToken = generateCryptoUUID();

    const customer = await prisma.customer.create({
      data: {
        eventId,
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        ticketType: ticketType ? ticketType.trim() : 'General Admission',
        qrToken,
      },
      include: {
        event: true,
      },
    });

    const qrCodeUrl = await generateQRCodeDataURL(customer.qrToken);

    return NextResponse.json(
      {
        customer,
        qrCodeUrl,
        message: 'Customer registered successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
