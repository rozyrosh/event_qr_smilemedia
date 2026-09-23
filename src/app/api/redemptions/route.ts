import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// POST /api/redemptions - Redeem item for attendee with direct concurrency-safe insert
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, redemptionItemId, redeemedBy } = body;

    if (!customerId || !redemptionItemId) {
      return NextResponse.json(
        { error: 'Customer ID and Redemption Item ID are required' },
        { status: 400 }
      );
    }

    const staffIdentifier =
      redeemedBy ||
      (session.user as any)?.name ||
      session.user?.email ||
      'Staff';

    // Direct INSERT pattern relying on DB composite unique constraint [customerId, redemptionItemId]
    try {
      const redemption = await prisma.redemption.create({
        data: {
          customerId,
          redemptionItemId,
          redeemedBy: staffIdentifier,
        },
        include: {
          redemptionItem: true,
        },
      });

      return NextResponse.json(
        {
          success: true,
          status: 'REDEEMED',
          message: `Successfully redeemed ${redemption.redemptionItem.name}`,
          redemption,
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      // Prisma P2002: Unique constraint violation on [customerId, redemptionItemId]
      if (
        dbError instanceof Prisma.PrismaClientKnownRequestError &&
        dbError.code === 'P2002'
      ) {
        const existingRedemption = await prisma.redemption.findUnique({
          where: {
            customerId_redemptionItemId: {
              customerId,
              redemptionItemId,
            },
          },
          include: {
            redemptionItem: true,
          },
        });

        return NextResponse.json(
          {
            success: false,
            alreadyRedeemed: true,
            status: 'ALREADY_REDEEMED',
            message: `This item was already redeemed`,
            redemption: existingRedemption,
          },
          { status: 409 }
        );
      }

      throw dbError;
    }
  } catch (error: any) {
    console.error('Error redeeming item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to redeem item' },
      { status: 500 }
    );
  }
}
