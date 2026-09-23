import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/items/[id]
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
    const { name, maxPerCustomer } = body;

    const item = await prisma.redemptionItem.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        maxPerCustomer: maxPerCustomer ? parseInt(maxPerCustomer) : undefined,
      },
    });

    return NextResponse.json({ item, message: 'Item updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/items/[id]
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

    await prisma.redemptionItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete item' }, { status: 500 });
  }
}
