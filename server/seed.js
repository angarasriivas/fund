require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Group = require('./models/Group');
const Payment = require('./models/Payment');
const Loan = require('./models/Loan');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        await User.deleteMany({});
        await Group.deleteMany({});
        await Payment.deleteMany({});
        await Loan.deleteMany({});

        const adminPassword = await bcrypt.hash('Admin@123', 12);
        const userPassword = await bcrypt.hash('User@123', 12);
        const memberPassword = await bcrypt.hash('Member@123', 12);

        const adminUser = await User.create({
            name: 'FundFlow Admin',
            email: 'admin@fundflow.com',
            password: adminPassword,
            role: 'admin'
        });
        const defaultUser = await User.create({
            name: 'FundFlow User',
            email: 'user@fundflow.com',
            password: userPassword,
            role: 'user'
        });
        const memberUser = await User.create({
            name: 'Sample Member',
            email: 'member@fundflow.com',
            password: memberPassword,
            role: 'user'
        });

        console.log(`Created Admin: ${adminUser.email} / Admin@123`);
        console.log(`Created User: ${defaultUser.email} / User@123`);

        const group1 = await Group.create({
            groupName: 'Weekend Savings Club',
            admin: adminUser._id,
            members: [adminUser._id, defaultUser._id, memberUser._id],
            monthlyAmount: 1100
        });

        console.log(`Created Group: ${group1.groupName} with admin ${adminUser.name} and 3 members`);

        const payment1 = await Payment.create({
            userId: adminUser._id,
            groupId: group1._id,
            month: 'April',
            amount: 1100,
            status: 'paid'
        });

        const payment2 = await Payment.create({
            userId: adminUser._id,
            groupId: group1._id,
            month: 'April',
            amount: 1100,
            status: 'paid'
        });

        console.log(`Created Payments for April by admin ${adminUser.name}`);

        const loan1 = await Loan.create({
            userId: adminUser._id,
            groupId: group1._id,
            borrowerName: memberUser.name,
            mobileNumber: '9876543210',
            guarantorName: defaultUser.name,
            paymentMode: 'Hand Cash',
            amount: 10000,
            remaining: 8000,
            status: 'active'
        });

        console.log(`Created Loan for ${memberUser.name} with amount 10000, remaining 8000`);

        console.log('Seeding completed successfully!');

        // Output Data summary
        console.log("\n--- OUTPUT DATA ---");
        console.log(JSON.stringify({
            users: [adminUser, defaultUser, memberUser],
            groups: [group1],
            payments: [payment1, payment2],
            loans: [loan1]
        }, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Seeding Error:", err);
        process.exit(1);
    }
};

seedData();
