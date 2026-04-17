const bcrypt = require('bcryptjs');
const { initDb, run, get, all } = require('./db');

const seedData = async () => {
  try {
    await initDb();
    console.log('Connected to SQLite for seeding...');

    await run('DELETE FROM group_members');
    await run('DELETE FROM loans');
    await run('DELETE FROM payments');
    await run('DELETE FROM groups');
    await run('DELETE FROM users');

    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const userPassword = await bcrypt.hash('User@123', 12);
    const memberPassword = await bcrypt.hash('Member@123', 12);

    const adminInsert = await run(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`,
      ['FundFlow Admin', 'admin@fundflow.com', adminPassword]
    );
    const userInsert = await run(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')`,
      ['FundFlow User', 'user@fundflow.com', userPassword]
    );
    const memberInsert = await run(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')`,
      ['Sample Member', 'member@fundflow.com', memberPassword]
    );

    const adminUser = await get('SELECT * FROM users WHERE id = ?', [adminInsert.lastID]);
    const defaultUser = await get('SELECT * FROM users WHERE id = ?', [userInsert.lastID]);
    const memberUser = await get('SELECT * FROM users WHERE id = ?', [memberInsert.lastID]);

    console.log(`Created Admin: ${adminUser.email} / Admin@123`);
    console.log(`Created User: ${defaultUser.email} / User@123`);

    const groupInsert = await run(
      `INSERT INTO groups (group_name, admin_id, monthly_amount) VALUES (?, ?, ?)`,
      ['Weekend Savings Club', adminUser.id, 1100]
    );
    await run(
      `INSERT INTO group_members (group_id, user_id) VALUES (?, ?), (?, ?), (?, ?)`,
      [groupInsert.lastID, adminUser.id, groupInsert.lastID, defaultUser.id, groupInsert.lastID, memberUser.id]
    );
    const group1 = await get('SELECT * FROM groups WHERE id = ?', [groupInsert.lastID]);

    console.log(`Created Group: ${group1.group_name} with admin ${adminUser.name} and 3 members`);

    const payment1Insert = await run(
      `INSERT INTO payments (user_id, group_id, month, amount, status, payment_method)
       VALUES (?, ?, ?, ?, 'paid', 'Online')`,
      [adminUser.id, group1.id, 'April', 1100]
    );
    const payment2Insert = await run(
      `INSERT INTO payments (user_id, group_id, month, amount, status, payment_method)
       VALUES (?, ?, ?, ?, 'paid', 'Online')`,
      [adminUser.id, group1.id, 'April', 1100]
    );
    const payment1 = await get('SELECT * FROM payments WHERE id = ?', [payment1Insert.lastID]);
    const payment2 = await get('SELECT * FROM payments WHERE id = ?', [payment2Insert.lastID]);

    console.log(`Created Payments for April by admin ${adminUser.name}`);

    const loanInsert = await run(
      `INSERT INTO loans (
        user_id, group_id, borrower_name, mobile_number, guarantor_name,
        payment_mode, amount, remaining, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [adminUser.id, group1.id, memberUser.name, '9876543210', defaultUser.name, 'Hand Cash', 10000, 8000]
    );
    const loan1 = await get('SELECT * FROM loans WHERE id = ?', [loanInsert.lastID]);

    console.log(`Created Loan for ${memberUser.name} with amount 10000, remaining 8000`);
    console.log('Seeding completed successfully!');

    const users = await all('SELECT id, name, email, role, created_at, updated_at FROM users');
    const groups = await all('SELECT * FROM groups');
    const payments = await all('SELECT * FROM payments');
    const loans = await all('SELECT * FROM loans');

    console.log('\n--- OUTPUT DATA ---');
    console.log(JSON.stringify({ users, groups, payments, loans }, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedData();
