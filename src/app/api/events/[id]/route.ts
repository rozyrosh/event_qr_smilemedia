import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/events/[id]
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
        _count: {
          select: {
            customers: true,
            items: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// PUT /api/events/[id]
export async function PUT(
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
    const { name, date, location, description } = body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        date: date ? new Date(date) : undefined,
        location: location !== undefined ? location.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
      },
    });

    return NextResponse.json({ event, message: 'Event updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update event' }, { status: 500 });
  }
}

// DELETE /api/events/[id]
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await context.params;

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete event' }, { status: 500 });
  }
}
