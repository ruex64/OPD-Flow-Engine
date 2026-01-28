import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db';
import Doctor from '../src/models/doctor.model';
import Slot from '../src/models/slot.model';
import Token from '../src/models/token.model';
import logger from '../src/utils/logger';

// Load environment variables
dotenv.config();

const doctors = [
  { name: 'Dr. Rajesh Kumar', specialization: 'Cardiology' },
  { name: 'Dr. Priya Sharma', specialization: 'Pediatrics' },
  { name: 'Dr. Amit Patel', specialization: 'Orthopedics' },
];

const generateSlotsForToday = (doctorId: mongoose.Types.ObjectId): any[] => {
  const slots = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day

  // Generate slots from 9 AM to 5 PM (8 slots of 1 hour each)
  const startHour = 9;
  const endHour = 17;

  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = new Date(today);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(today);
    endTime.setHours(hour + 1, 0, 0, 0);

    slots.push({
      doctorId,
      startTime,
      endTime,
      maxCapacity: 10,
      currentCount: 0,
    });
  }

  return slots;
};

const seedDatabase = async () => {
  try {
    logger.info('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data
    logger.info('🗑️  Clearing existing data...');
    await Token.deleteMany({});
    await Slot.deleteMany({});
    await Doctor.deleteMany({});
    logger.info('✅ Existing data cleared');

    // Create doctors
    logger.info('👨‍⚕️  Creating doctors...');
    const createdDoctors = await Doctor.insertMany(doctors);
    logger.info(`✅ Created ${createdDoctors.length} doctors`);

    // Create slots for each doctor
    logger.info('📅 Creating slots for today...');
    let totalSlots = 0;

    for (const doctor of createdDoctors) {
      const slots = generateSlotsForToday(doctor._id as mongoose.Types.ObjectId);
      await Slot.insertMany(slots);
      totalSlots += slots.length;
      logger.info(`   - Created ${slots.length} slots for ${doctor.name}`);
    }

    logger.info(`✅ Created ${totalSlots} total slots`);

    // Summary
    logger.info('\n📊 Seeding Summary:');
    logger.info(`   Doctors: ${createdDoctors.length}`);
    logger.info(`   Slots: ${totalSlots}`);
    logger.info(`   Tokens: 0 (empty)`);

    logger.info('\n🎉 Database seeding completed successfully!');

    // Display sample data
    logger.info('\n📋 Sample Data:');
    for (const doctor of createdDoctors) {
      const doctorSlots = await Slot.find({ doctorId: doctor._id }).limit(2);
      logger.info(`\n   ${doctor.name} (${doctor.specialization}):`);
      doctorSlots.forEach((slot: any) => {
        logger.info(
          `      ${slot.startTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })} - ${slot.endTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })} | Capacity: ${slot.maxCapacity}`
        );
      });
    }

  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Disconnect from database
    await disconnectDB();
    process.exit(0);
  }
};

// Run the seed function
seedDatabase();
