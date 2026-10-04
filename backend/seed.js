require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const Block = require('./src/models/Block');
const Flat = require('./src/models/Flat');
const MaintenanceBill = require('./src/models/MaintenanceBill');
const Payment = require('./src/models/Payment');
const ElectricityBill = require('./src/models/ElectricityBill');
const Announcement = require('./src/models/Announcement');
const Complaint = require('./src/models/Complaint');
const Notification = require('./src/models/Notification');
const ActivityLog = require('./src/models/ActivityLog');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed]: Connected to MongoDB Atlas');

    // Clear existing records
    await User.deleteMany({});
    await Block.deleteMany({});
    await Flat.deleteMany({});
    await MaintenanceBill.deleteMany({});
    await Payment.deleteMany({});
    await ElectricityBill.deleteMany({});
    await Announcement.deleteMany({});
    await Complaint.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log('[Seed]: Cleared existing database collections');

    const adminSalt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123', adminSalt);
    const secPassword = await bcrypt.hash('Sec@123', adminSalt);
    const residentPassword = await bcrypt.hash('Resident@123', adminSalt);

    // 1. Create Main Admin / Secretary
    const admin = await User.create({
      fullName: 'Main Secretary (Admin)',
      email: 'admin@society.com',
      password: adminPassword,
      phone: '+91 9876543210',
      role: 'admin',
      accountStatus: 'active',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    });

    console.log('✅ Created Main Admin: admin@society.com / Admin@123');

    // 2. Create Blocks A to M
    const blockNames = ['Block A', 'Block B', 'Block C', 'Block D', 'Block E', 'Block F', 'Block G', 'Block H', 'Block I', 'Block J', 'Block K', 'Block L', 'Block M'];
    const createdBlocks = [];
    const createdSecretaries = [];

    const secretaryNames = [
      'Rajesh Sharma', 'Vikram Mehta', 'Ananya Roy', 'Deepak Verma',
      'Siddharth Patel', 'Kavita Singh', 'Manoj Joshi', 'Neelam Gupta',
      'Arjun Nair', 'Pooja Iyer', 'Rohan Saxena', 'Sanjay Bhatia', 'Alok Pandey'
    ];

    for (let i = 0; i < blockNames.length; i++) {
      const bName = blockNames[i];
      const secEmail = `sec.${bName.toLowerCase().replace(' ', '')}@society.com`;

      // Create Secretary user
      const secUser = await User.create({
        fullName: `${secretaryNames[i]} (${bName} Secretary)`,
        email: secEmail,
        password: secPassword,
        phone: `+91 98123${10000 + i}`,
        role: 'secretary',
        accountStatus: 'active',
        profileImage: `https://images.unsplash.com/photo-${1500000000000 + i * 100}?auto=format&fit=crop&w=150&q=80`,
      });

      // Create Block
      const block = await Block.create({
        name: bName,
        secretary: secUser._id,
        totalFlatsCount: 40,
        description: `Premium residential block ${bName} featuring luxury amenities and 24/7 security.`,
      });

      secUser.block = block._id;
      await secUser.save();

      createdBlocks.push(block);
      createdSecretaries.push(secUser);
    }

    console.log(`✅ Created ${createdBlocks.length} Blocks (Block A to Block M) with assigned Secretaries`);

    // 3. Create Sample Flats & Residents
    const sampleResidentsData = [
      { name: 'Jainil Shah', email: 'jainil@society.com', blockIdx: 0, flatNo: 'A-101', status: 'paid' },
      { name: 'Rahul Sharma', email: 'rahul@society.com', blockIdx: 0, flatNo: 'A-102', status: 'pending' },
      { name: 'Amit Patel', email: 'amit@society.com', blockIdx: 0, flatNo: 'A-103', status: 'paid' },
      { name: 'Priya Verma', email: 'priya@society.com', blockIdx: 0, flatNo: 'A-104', status: 'paid' },
      { name: 'Suresh Kumar', email: 'suresh@society.com', blockIdx: 1, flatNo: 'B-101', status: 'paid' },
      { name: 'Sneha Reddy', email: 'sneha@society.com', blockIdx: 1, flatNo: 'B-102', status: 'pending' },
      { name: 'Vivek Joshi', email: 'vivek@society.com', blockIdx: 2, flatNo: 'C-101', status: 'paid' },
      { name: 'Ritu Kapoor', email: 'ritu@society.com', blockIdx: 3, flatNo: 'D-101', status: 'paid' },
    ];

    const createdResidents = [];
    const createdFlats = [];

    for (let r of sampleResidentsData) {
      const targetBlock = createdBlocks[r.blockIdx];

      const resUser = await User.create({
        fullName: r.name,
        email: r.email,
        password: residentPassword,
        phone: `+91 9900${Math.floor(100000 + Math.random() * 900000)}`,
        role: 'resident',
        block: targetBlock._id,
        flatNumber: r.flatNo,
        familyMemberCount: Math.floor(2 + Math.random() * 3),
        accountStatus: 'active',
      });

      const flat = await Flat.create({
        flatNumber: r.flatNo,
        block: targetBlock._id,
        resident: resUser._id,
        ownerName: r.name,
        phone: resUser.phone,
        email: resUser.email,
        familyMembers: resUser.familyMemberCount,
        occupancyStatus: 'occupied',
        maintenanceStatus: r.status,
      });

      resUser.flat = flat._id;
      await resUser.save();

      createdResidents.push(resUser);
      createdFlats.push(flat);
    }

    console.log(`✅ Created ${createdResidents.length} Residents and Flats`);

    // 4. Maintenance Bills & Payment Records
    const octBill = await MaintenanceBill.create({
      month: 'October',
      year: 2026,
      amount: 2500,
      dueDate: new Date('2026-10-10'),
      lateFee: 100,
      description: 'October 2026 Maintenance Charges (Water, Security, Lift, Cleaning)',
      targetBlocks: createdBlocks.map((b) => b._id),
    });

    for (let flat of createdFlats) {
      const isPaid = flat.maintenanceStatus === 'paid';
      const txnId = isPaid ? `PAY_OCT26_${Math.floor(100000 + Math.random() * 900000)}` : '';

      await Payment.create({
        bill: octBill._id,
        resident: flat.resident,
        flat: flat._id,
        block: flat.block,
        amount: 2500,
        totalPaid: 2500,
        status: isPaid ? 'paid' : 'pending',
        paymentDate: isPaid ? new Date('2026-10-05') : null,
        transactionId: txnId,
        paymentMethod: 'razorpay',
      });
    }

    console.log('✅ Created October 2026 Maintenance Bill & Payments');

    // 5. Electricity Bills
    for (let i = 0; i < 5; i++) {
      await ElectricityBill.create({
        month: 'October',
        year: 2026,
        block: createdBlocks[i]._id,
        amount: Math.floor(4500 + Math.random() * 2000),
        dueDate: new Date('2026-10-15'),
        description: `Common area lighting & lift electricity bill for ${createdBlocks[i].name}`,
        status: i % 2 === 0 ? 'paid' : 'pending',
      });
    }

    // 6. Announcements
    const societyAnnounce = await Announcement.create({
      title: 'Water Supply Maintenance Notice',
      description: 'Please note that society main water supply tank cleaning will take place tomorrow from 10:00 AM to 2:00 PM. Kindly store required water in advance.',
      createdBy: admin._id,
      scope: 'society',
      priority: 'high',
    });

    await Announcement.create({
      title: '[Block A Notice] Elevators Maintenance',
      description: 'Block A elevators will undergo quarterly servicing on Thursday between 2 PM and 5 PM.',
      createdBy: createdSecretaries[0]._id,
      scope: 'block',
      targetBlocks: [createdBlocks[0]._id],
      priority: 'normal',
    });

    console.log('✅ Created Society & Block Announcements');

    // 7. Complaints
    await Complaint.create({
      title: 'Low Water Pressure in Master Washroom',
      description: 'Since yesterday morning, water flow rate in master washroom is very weak.',
      category: 'Water',
      block: createdBlocks[0]._id,
      flatNumber: 'A-101',
      resident: createdResidents[0]._id,
      priority: 'medium',
      status: 'In Progress',
      resolutionNote: 'Plumber assigned, inspection scheduled for 4 PM.',
    });

    await Complaint.create({
      title: 'Corridor Light Bulb Flicker',
      description: 'The main corridor ceiling light outside A-102 is flickering continuously.',
      category: 'Electricity',
      block: createdBlocks[0]._id,
      flatNumber: 'A-102',
      resident: createdResidents[1]._id,
      priority: 'low',
      status: 'Pending',
    });

    console.log('✅ Created Sample Complaints');

    // 8. Notifications
    await Notification.create({
      recipient: createdResidents[0]._id,
      title: '🔔 Welcome to Society Portal',
      message: 'Welcome Jainil Shah! You can pay maintenance bills, log complaints, and view announcements here.',
      type: 'general',
    });

    // 9. Activity Log
    await ActivityLog.create({
      action: 'Database Seed Completed',
      user: admin._id,
      userRole: 'admin',
      details: 'Populated initial 13 blocks, secretaries, residents, bills, and complaints',
    });

    console.log('\n====================================================');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    console.log('DEMO LOGINS:');
    console.log('👑 Admin: admin@society.com | Password: Admin@123');
    console.log('🏢 Block A Sec: sec.blocka@society.com | Password: Sec@123');
    console.log('🏢 Block B Sec: sec.blockb@society.com | Password: Sec@123');
    console.log('👤 Resident (Paid): jainil@society.com | Password: Resident@123');
    console.log('👤 Resident (Pending): rahul@society.com | Password: Resident@123');
    console.log('====================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
