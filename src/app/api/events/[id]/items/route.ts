import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/events/[id]/items - List redemption items for an event
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

    const items = await prisma.redemptionItem.findMany({
      where: { eventId: id },
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/events/[id]/items - Create redemption item
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { name, maxPerCustomer } = body;

    if (!name) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const item = await prisma.redemptionItem.create({
      data: {
        eventId: id,
        name: name.trim(),
        maxPerCustomer: maxPerCustomer ? parseInt(maxPerCustomer) : 1,
      },
    });

    return NextResponse.json({ item, message: 'Item created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create item' }, { status: 500 });
  }
}
