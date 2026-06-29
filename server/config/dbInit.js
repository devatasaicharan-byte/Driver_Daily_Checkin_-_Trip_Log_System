const bcrypt = require('bcryptjs');
const db = require('./connection');

const seedUsers = async () => {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const driverPasswordHash = await bcrypt.hash('driver123', 10);

  // 1. Check & Seed Admin
  const admins = await db.query('SELECT * FROM users WHERE email = ?', ['admin@manivtha.com']);
  if (admins.length === 0) {
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Manivtha Admin', 'admin@manivtha.com', passwordHash, 'admin']
    );
    console.log('Seeded admin user: admin@manivtha.com');
  }

  // 2. Check & Seed Driver Users
  const mockDriverUsers = [
    { name: 'Rajesh Kumar', email: 'rajesh@manivtha.com', role: 'driver' },
    { name: 'Sunil Rao', email: 'sunil@manivtha.com', role: 'driver' },
    { name: 'Ramesh Naik', email: 'ramesh@manivtha.com', role: 'driver' },
    { name: 'Michael DSouza', email: 'michael@manivtha.com', role: 'driver' }
  ];

  for (const u of mockDriverUsers) {
    const existing = await db.query('SELECT * FROM users WHERE email = ?', [u.email]);
    if (existing.length === 0) {
      await db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [u.name, u.email, driverPasswordHash, u.role]
      );
      console.log(`Seeded driver user: ${u.email}`);
    }
  }
};

const seedDrivers = async () => {
  const users = await db.query('SELECT * FROM users WHERE role = ?', ['driver']);
  
  const mockDrivers = [
    { name: 'Rajesh Kumar', dId: 'DRV001', phone: '9845012345', license: 'KA5120190001234', exp: '2032-12-31', join: '2020-01-15', yoe: 8, status: 'Available', email: 'rajesh@manivtha.com' },
    { name: 'Sunil Rao', dId: 'DRV002', phone: '9845023456', license: 'KA5120200005678', exp: '2030-05-20', join: '2021-06-10', yoe: 5, status: 'On Trip', email: 'sunil@manivtha.com' },
    { name: 'Ramesh Naik', dId: 'DRV003', phone: '9845034567', license: 'KA5120180009999', exp: '2028-11-15', join: '2019-03-22', yoe: 10, status: 'Available', email: 'ramesh@manivtha.com' },
    { name: 'Michael DSouza', dId: 'DRV004', phone: '9845045678', license: 'KA5120210002468', exp: '2035-08-08', join: '2022-09-01', yoe: 4, status: 'Maintenance', email: 'michael@manivtha.com' }
  ];

  for (const d of mockDrivers) {
    const user = users.find(u => u.email === d.email);
    const uId = user ? user.id : null;

    const existing = await db.query('SELECT * FROM drivers WHERE driverId = ?', [d.dId]);
    if (existing.length === 0) {
      await db.query(
        'INSERT INTO drivers (driverName, driverId, phone, licenseNumber, licenseExpiry, joiningDate, experience, status, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [d.name, d.dId, d.phone, d.license, d.exp, d.join, d.yoe, d.status, uId]
      );
      console.log(`Seeded driver record: ${d.name}`);
    } else {
      // Self-healing check: Update userId on existing drivers if empty
      const current = existing[0];
      if (!current.userId && uId) {
        await db.query(
          'UPDATE drivers SET userId = ? WHERE id = ?',
          [uId, current.id]
        );
        console.log(`Self-healed driver record link: ${d.name} -> userId ${uId}`);
      }
    }
  }
};

const seedVehicles = async () => {
  const mockVehicles = [
    { num: 'KA-01-MJ-1234', type: 'SUV', model: 'Toyota Innova Crysta', ins: '2027-04-15', fit: '2028-04-15', rc: 'RC-KA01MJ1234', driver: 1, status: 'Available' },
    { num: 'KA-03-NB-5678', type: 'Sedan', model: 'Maruti Suzuki Dzire', ins: '2026-09-30', fit: '2028-09-30', rc: 'RC-KA03NB5678', driver: 2, status: 'On Trip' },
    { num: 'KA-51-MD-9012', type: 'Traveller', model: 'Force Traveller 12S', ins: '2026-12-15', fit: '2027-12-15', rc: 'RC-KA51MD9012', driver: 3, status: 'Available' },
    { num: 'KA-04-P-7777', type: 'SUV', model: 'Toyota Fortuner', ins: '2027-01-20', fit: '2029-01-20', rc: 'RC-KA04P7777', driver: 4, status: 'Maintenance' }
  ];

  for (const v of mockVehicles) {
    const existing = await db.query('SELECT * FROM vehicles WHERE vehicleNumber = ?', [v.num]);
    if (existing.length === 0) {
      await db.query(
        'INSERT INTO vehicles (vehicleNumber, vehicleType, model, insuranceExpiry, fitnessCertificate, rcNumber, assignedDriverId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [v.num, v.type, v.model, v.ins, v.fit, v.rc, v.driver, v.status]
      );
      console.log(`Seeded vehicle record: ${v.num}`);
    }
  }
};

const seedCheckins = async () => {
  const checkins = await db.query('SELECT * FROM checkins');
  if (checkins.length === 0) {
    const mockCheckins = [
      { dId: 1, dName: 'Rajesh Kumar', vId: 1, vNum: 'KA-01-MJ-1234', date: '2026-06-28', time: '08:15:00', cond: 'Excellent', fuel: 25.5, km: 124500, eng: 'Normal', tyre: 'Good', bat: 'Charged', rem: 'Odometer verified. Vehicle cleaned.' },
      { dId: 2, dName: 'Sunil Rao', vId: 2, vNum: 'KA-03-NB-5678', date: '2026-06-29', time: '07:30:00', cond: 'Good', fuel: 15.0, km: 89420, eng: 'Normal', tyre: 'Good', bat: 'Charged', rem: 'Airport transfer duty check-in.' },
      { dId: 3, dName: 'Ramesh Naik', vId: 3, vNum: 'KA-51-MD-9012', date: '2026-06-29', time: '09:00:00', cond: 'Excellent', fuel: 40.0, km: 215300, eng: 'Normal', tyre: 'Good', bat: 'Charged', rem: 'Outstation corporate trip check-in.' }
    ];

    for (const c of mockCheckins) {
      await db.query(
        'INSERT INTO checkins (driverId, driverName, vehicleId, vehicleNumber, checkinDate, checkinTime, vehicleCondition, fuelFilled, odometerReading, engineStatus, tyreCondition, batteryStatus, remarks, vehicleImageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [c.dId, c.dName, c.vId, c.vNum, c.date, c.time, c.cond, c.fuel, c.km, c.eng, c.tyre, c.bat, c.rem, '']
      );
    }
    console.log('Seeded mock check-ins.');
  }
};

const seedTrips = async () => {
  const trips = await db.query('SELECT * FROM trips');
  if (trips.length === 0) {
    const mockTrips = [
      { dId: 1, dName: 'Rajesh Kumar', vId: 1, vNum: 'KA-01-MJ-1234', pick: 'Bengaluru Airport', dest: 'Electronic City', cust: 'Wipro Corporate', date: '2026-06-28', start: '09:00:00', end: '11:30:00', skm: 124500, ekm: 124565, dist: 65, status: 'Completed' },
      { dId: 1, dName: 'Rajesh Kumar', vId: 1, vNum: 'KA-01-MJ-1234', pick: 'Indiranagar', dest: 'Whitefield', cust: 'Aditi Sharma', date: '2026-06-28', start: '14:00:00', end: '16:00:00', skm: 124565, ekm: 124590, dist: 25, status: 'Completed' },
      { dId: 2, dName: 'Sunil Rao', vId: 2, vNum: 'KA-03-NB-5678', pick: 'Marathahalli', dest: 'Mysore Palace (Outstation)', cust: 'Karan Mehra Family', date: '2026-06-29', start: '08:00:00', end: null, skm: 89420, ekm: null, dist: 0, status: 'Started' },
      { dId: 3, dName: 'Ramesh Naik', vId: 3, vNum: 'KA-51-MD-9012', pick: 'Kempegowda Int Airport', dest: 'Nandi Hills Tour', cust: 'German Tourists', date: '2026-06-29', start: '10:30:00', end: null, skm: 215300, ekm: null, dist: 0, status: 'Pending' }
    ];

    for (const t of mockTrips) {
      await db.query(
        'INSERT INTO trips (driverId, driverName, vehicleId, vehicleNumber, pickupLocation, destination, customerName, tripDate, startTime, endTime, startingKm, endingKm, totalDistance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [t.dId, t.dName, t.vId, t.vNum, t.pick, t.dest, t.cust, t.date, t.start, t.end, t.skm, t.ekm, t.dist, t.status]
      );
    }
    console.log('Seeded mock trips.');
  }
};

const initializeDatabase = async () => {
  try {
    if (db.DB_TYPE === 'mysql') {
      console.log('Initializing MySQL Tables...');
      
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'staff',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS drivers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          driverName VARCHAR(255) NOT NULL,
          driverId VARCHAR(50) NOT NULL UNIQUE,
          phone VARCHAR(15) NOT NULL,
          licenseNumber VARCHAR(50) NOT NULL,
          licenseExpiry DATE NOT NULL,
          joiningDate DATE NOT NULL,
          experience INT NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Available',
          userId INT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS vehicles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          vehicleNumber VARCHAR(50) NOT NULL UNIQUE,
          vehicleType VARCHAR(50) NOT NULL,
          model VARCHAR(100) NOT NULL,
          insuranceExpiry DATE NOT NULL,
          fitnessCertificate DATE NOT NULL,
          rcNumber VARCHAR(50) NOT NULL,
          assignedDriverId INT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Available',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS checkins (
          id INT AUTO_INCREMENT PRIMARY KEY,
          driverId INT NOT NULL,
          driverName VARCHAR(255) NOT NULL,
          vehicleId INT NOT NULL,
          vehicleNumber VARCHAR(50) NOT NULL,
          checkinDate DATE NOT NULL,
          checkinTime TIME NOT NULL,
          vehicleCondition VARCHAR(50) NOT NULL,
          fuelFilled FLOAT DEFAULT 0,
          odometerReading INT NOT NULL,
          engineStatus VARCHAR(50) NOT NULL,
          tyreCondition VARCHAR(50) NOT NULL,
          batteryStatus VARCHAR(50) NOT NULL,
          remarks TEXT,
          vehicleImageUrl VARCHAR(255) DEFAULT '',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS trips (
          id INT AUTO_INCREMENT PRIMARY KEY,
          driverId INT NOT NULL,
          driverName VARCHAR(255) NOT NULL,
          vehicleId INT NOT NULL,
          vehicleNumber VARCHAR(50) NOT NULL,
          pickupLocation VARCHAR(255) NOT NULL,
          destination VARCHAR(255) NOT NULL,
          customerName VARCHAR(255) NOT NULL,
          tripDate DATE NOT NULL,
          startTime TIME NOT NULL,
          endTime TIME NULL,
          startingKm INT NOT NULL,
          endingKm INT NULL,
          totalDistance FLOAT DEFAULT 0,
          status VARCHAR(50) NOT NULL DEFAULT 'Pending',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('MySQL Tables checked/created successfully.');
    }

    // Seed mock data
    await seedUsers();
    await seedDrivers();
    await seedVehicles();
    await seedCheckins();
    await seedTrips();
    
    console.log('Database Initialized & Seeded Successfully.');
  } catch (err) {
    console.error('Error during database initialization:', err);
  }
};

module.exports = {
  initializeDatabase
};
