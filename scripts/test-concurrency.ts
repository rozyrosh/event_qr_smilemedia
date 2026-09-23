import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function runConcurrencyTest() {
  console.log('=== STARTING CONCURRENCY & INTEGRITY TEST ===\n');

  // 1. Fetch or create a test attendee
  const event = await prisma.event.findFirst({
    include: { items: true },
  });

  if (!event || event.items.length === 0) {
    console.error('No event or items found to test.');
    process.exit(1);
  }

  const testEmail = `concurrency.test.${Date.now()}@example.com`;
  const customer = await prisma.customer.create({
    data: {
      eventId: event.id,
      fullName: 'Concurrency Test Bot',
      email: testEmail,
      ticketType: 'VIP Pass',
      qrToken: `test-token-${Date.now()}`,
    },
  });

  console.log(`1. Created test customer: ${customer.fullName} (${customer.id})`);

  // 2. Test Parallel Simultaneous Attendance Inserts (simulate 5 scanner devices scanning at the exact same millisecond)
  console.log('\n2. Testing 5 simultaneous parallel check-ins for customer...');
  const concurrentAttendanceAttempts = 5;
  const attendancePromises = Array.from({ length: concurrentAttendanceAttempts }).map(
    async (_, index) => {
      try {
        const res = await prisma.attendance.create({
          data: {
            customerId: customer.id,
            scannedBy: `Scanner_Device_${index + 1}`,
          },
        });
        return { success: true, status: 201, id: res.id, scanner: `Device ${index + 1}` };
      } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          return { success: false, status: 409, error: 'P2002_CONFLICT', scanner: `Device ${index + 1}` };
        }
        return { success: false, status: 500, error: err.message, scanner: `Device ${index + 1}` };
      }
    }
  );

  const attendanceResults = await Promise.all(attendancePromises);
  const successfulAttendance = attendanceResults.filter((r) => r.success && r.status === 201);
  const conflictAttendance = attendanceResults.filter((r) => !r.success && r.status === 409);

  console.log(`Results: ${successfulAttendance.length} succeeded, ${conflictAttendance.length} caught by P2002 unique constraint.`);

  if (successfulAttendance.length !== 1 || conflictAttendance.length !== concurrentAttendanceAttempts - 1) {
    throw new Error('CONCURRENCY TEST FAILED: Attendance did not strictly enforce single check-in!');
  }
  console.log('✓ ATTENDANCE CONCURRENCY TEST PASSED: Exactly 1 record created, zero race conditions.');

  // 3. Test Parallel Simultaneous Item Redemptions (simulate 5 stations scanning the same gift item at the exact same time)
  const targetItem = event.items[0];
  console.log(`\n3. Testing 5 simultaneous parallel redemptions for item: "${targetItem.name}"...`);

  const redemptionPromises = Array.from({ length: 5 }).map(async (_, index) => {
    try {
      const res = await prisma.redemption.create({
        data: {
          customerId: customer.id,
          redemptionItemId: targetItem.id,
          redeemedBy: `Station_${index + 1}`,
        },
      });
      return { success: true, status: 201, id: res.id, station: `Station ${index + 1}` };
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return { success: false, status: 409, error: 'P2002_CONFLICT', station: `Station ${index + 1}` };
      }
      return { success: false, status: 500, error: err.message, station: `Station ${index + 1}` };
    }
  });

  const redemptionResults = await Promise.all(redemptionPromises);
  const successfulRedemptions = redemptionResults.filter((r) => r.success && r.status === 201);
  const conflictRedemptions = redemptionResults.filter((r) => !r.success && r.status === 409);

  console.log(`Results: ${successfulRedemptions.length} succeeded, ${conflictRedemptions.length} caught by P2002 composite constraint.`);

  if (successfulRedemptions.length !== 1 || conflictRedemptions.length !== 4) {
    throw new Error('CONCURRENCY TEST FAILED: Redemption did not strictly enforce unique [customerId, redemptionItemId]!');
  }
  console.log('✓ REDEMPTION CONCURRENCY TEST PASSED: Exactly 1 item redeemed, duplicate simultaneous attempts safely rejected.');

  // Clean up test customer
  await prisma.customer.delete({ where: { id: customer.id } });
  console.log('\n4. Cleaned up test customer.');
  console.log('\n=== ALL CONCURRENCY AND INTEGRITY TESTS PASSED SUCCESSFULLY! ===');
}

runConcurrencyTest()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
