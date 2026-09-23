import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/events - List all events with summary metrics
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      orderBy: { date: 'desc' },
      include: {
        _count: {
          select: {
            customers: true,
            items: true,
          },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/events - Create new event
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, date, location, description } = body;

    if (!name || !date) {
      return NextResponse.json({ error: 'Event name and date are required' }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        date: new Date(date),
        location: location ? location.trim() : null,
        description: description ? description.trim() : null,
      },
    });

    return NextResponse.json({ event, message: 'Event created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 500 });
  }
}
