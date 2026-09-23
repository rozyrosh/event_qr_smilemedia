import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQRCodeDataURL } from '@/lib/qr';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/customers/[id]
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

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        event: true,
        attendance: true,
        redemptions: {
          include: {
            redemptionItem: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const qrCodeUrl = await generateQRCodeDataURL(customer.qrToken);

    return NextResponse.json({ customer, qrCodeUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// PUT /api/customers/[id]
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { fullName, phone, email, ticketType } = body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        fullName: fullName ? fullName.trim() : undefined,
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        ticketType: ticketType ? ticketType.trim() : undefined,
      },
    });

    return NextResponse.json({ customer, message: 'Customer updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE /api/customers/[id]
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete customer' }, { status: 500 });
  }
}
