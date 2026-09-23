import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING EVENT MANAGEMENT SYSTEM ---');

  // 1. Clean up existing attendances and redemptions to ensure 100% clean pre-event registration state
  await prisma.attendance.deleteMany({});
  await prisma.redemption.deleteMany({});
  console.log('✓ Cleared all previous attendance and redemption records.');

  // 2. Create Admin & Staff Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@eventqr.io' },
    update: { password: adminPassword, role: Role.ADMIN },
    create: {
      name: 'Admin Master',
      email: 'admin@eventqr.io',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@eventqr.io' },
    update: { password: staffPassword, role: Role.STAFF },
    create: {
      name: 'Event Staff 01',
      email: 'staff@eventqr.io',
      password: staffPassword,
      role: Role.STAFF,
    },
  });

  console.log(`✓ Accounts configured: ${admin.email} (Admin), ${staff.email} (Staff)`);

  // 3. Create / Ensure Sample Event
  let event = await prisma.event.findFirst({
    where: { name: 'Tech Innovation Summit 2026' },
  });

  if (!event) {
    event = await prisma.event.create({
      data: {
        name: 'Tech Innovation Summit 2026',
        date: new Date('2026-10-15T09:00:00Z'),
        location: 'Grand Convention Center, Hall A',
        description: 'Annual flagship technology conference featuring AI, Cloud, and Web3 keynotes.',
      },
    });
  }

  console.log(`✓ Event configured: ${event.name} (${event.id})`);

  // 4. Create Sample Redemption Items
  const itemsData = [
    { name: 'Lunch Buffet Pass', maxPerCustomer: 1 },
    { name: 'VIP Swag Bag & Hoodie', maxPerCustomer: 1 },
    { name: 'Networking Cocktail Voucher', maxPerCustomer: 2 },
  ];

  for (const item of itemsData) {
    const existing = await prisma.redemptionItem.findFirst({
      where: { eventId: event.id, name: item.name },
    });
    if (!existing) {
      await prisma.redemptionItem.create({
        data: {
          eventId: event.id,
          name: item.name,
          maxPerCustomer: item.maxPerCustomer,
        },
      });
    }
  }
  console.log('✓ Redemption items configured.');

  // 5. Create Pre-Registered Customers (Ahead of Event Day)
  // NOTE: None of these attendees have Attendance records. They are pre-registered only.
  const customersData = [
    {
      fullName: 'Alexander Vance',
      email: 'alex.vance@example.com',
      phone: '+1 (555) 234-5678',
      ticketType: 'VIP Pass',
    },
    {
      fullName: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      phone: '+1 (555) 345-6789',
      ticketType: 'Speaker',
    },
    {
      fullName: 'Marcus Chen',
      email: 'marcus.chen@example.com',
      phone: '+1 (555) 456-7890',
      ticketType: 'General Admission',
    },
    {
      fullName: 'Sophia Patel',
      email: 'sophia.patel@example.com',
      phone: '+1 (555) 567-8901',
      ticketType: 'General Admission',
    },
    {
      fullName: 'David Kim',
      email: 'david.kim@example.com',
      phone: '+1 (555) 678-9012',
      ticketType: 'VIP Pass',
    },
  ];

  for (const cust of customersData) {
    const existing = await prisma.customer.findFirst({
      where: { email: cust.email, eventId: event.id },
    });
    if (!existing) {
      await prisma.customer.create({
        data: {
          eventId: event.id,
          fullName: cust.fullName,
          email: cust.email,
          phone: cust.phone,
          ticketType: cust.ticketType,
          qrToken: crypto.randomUUID(),
        },
      });
    }
  }

  const countCustomers = await prisma.customer.count({ where: { eventId: event.id } });
  const countAttendance = await prisma.attendance.count({ where: { customer: { eventId: event.id } } });

  console.log(`✓ Total Pre-Registered Attendees: ${countCustomers}`);
  console.log(`✓ Total Checked-In Attendance Records: ${countAttendance} (Should be 0 before event day scan)`);
  console.log('--- SEEDING COMPLETE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
