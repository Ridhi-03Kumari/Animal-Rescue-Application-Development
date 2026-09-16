const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Rescuer = require('../src/models/Rescuer');

const MONGODB_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/animal_rescue';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    const defaultPassword = await bcrypt.hash('rescuer123', 10);

    // 4 Rescuers across Bengaluru for demo
    const sampleRescuers = [
      {
        name: 'Rescuer A - Rahul (Indiranagar)',
        phone: '9876543210',
        organizationName: 'Compassion Animal Rescue',
        animalsHandled: ['dog', 'cat', 'cow'],
        location: { latitude: 12.9784, longitude: 77.6408 }, // ~1.1km from demo report
        available: true,
        completedCasesCount: 15,
        responseRate: 0.9,
      },
      {
        name: 'Rescuer B - Priya (MG Road)',
        phone: '9876543211',
        organizationName: 'Avian Wildlife Trust',
        animalsHandled: ['bird'], // Bird specialist only (cannot handle dogs)
        location: { latitude: 12.9752, longitude: 77.6438 }, // ~0.46km very close
        available: true,
        completedCasesCount: 8,
        responseRate: 0.8,
      },
      {
        name: 'Rescuer C - Amit (Old Airport Rd)',
        phone: '9876543212',
        organizationName: 'Street Paws Bangalore',
        animalsHandled: ['dog', 'cat'],
        location: { latitude: 12.9751, longitude: 77.6405 }, // ~0.06km right next door, but BUSY
        available: false,
        completedCasesCount: 22,
        responseRate: 0.95,
      },
      {
        name: 'Rescuer D - Sneha (Electronic City)',
        phone: '9876543213',
        organizationName: 'South Bengaluru Animal Care',
        animalsHandled: ['dog', 'cat'],
        location: { latitude: 12.8452, longitude: 77.6602 }, // ~41km far away
        available: true,
        completedCasesCount: 5,
        responseRate: 0.85,
      },
    ];

    for (const data of sampleRescuers) {
      let user = await User.findOne({ phone: data.phone });
      if (!user) {
        user = await User.create({
          name: data.name,
          phone: data.phone,
          passwordHash: defaultPassword,
          role: 'rescuer',
        });
      }

      await Rescuer.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          organizationName: data.organizationName,
          animalsHandled: data.animalsHandled,
          location: data.location,
          available: data.available,
          completedCasesCount: data.completedCasesCount,
          activeCaseId: null,
        },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Demo rescuers seeded successfully in Bengaluru!');
    console.log('Sample login: phone: 9876543210, password: rescuer123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
