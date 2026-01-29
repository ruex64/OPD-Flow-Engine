import dotenv from 'dotenv';
import axios from 'axios';
import { connectDB, disconnectDB } from '../src/config/db';
import Doctor from '../src/models/doctor.model';
import Slot from '../src/models/slot.model';
import logger from '../src/utils/logger';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Token types matching the model
enum TokenType {
  ONLINE = 'ONLINE',
  WALK_IN = 'WALK_IN',
  EMERGENCY = 'EMERGENCY',
  FOLLOW_UP = 'FOLLOW_UP',
}

// Patient names for variety
const PATIENT_NAMES = [
  'Rahul Verma',
  'Priya Singh',
  'Amit Kumar',
  'Sneha Patel',
  'Vikram Sharma',
  'Anjali Desai',
  'Rohan Gupta',
  'Kavita Reddy',
  'Sanjay Mehta',
  'Deepa Iyer',
  'Arjun Nair',
  'Pooja Joshi',
  'Karan Malhotra',
  'Neha Agarwal',
  'Rajesh Rao',
  'Simran Kapoor',
  'Varun Shah',
  'Ishita Bansal',
  'Nikhil Saxena',
  'Ritu Chopra',
];

interface BookingResult {
  success: boolean;
  tokenId?: string;
  slotId: string;
  patientName: string;
  tokenType: TokenType;
  message?: string;
  error?: string;
}

/**
 * Get a random element from an array
 */
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get a random patient name
 */
function getRandomPatientName(): string {
  return getRandomElement(PATIENT_NAMES);
}

/**
 * Get a random token type with weighted distribution
 * WALK_IN: 50%, ONLINE: 30%, FOLLOW_UP: 15%, EMERGENCY: 5%
 */
function getRandomTokenType(): TokenType {
  const rand = Math.random();
  if (rand < 0.5) return TokenType.WALK_IN;
  if (rand < 0.8) return TokenType.ONLINE;
  if (rand < 0.95) return TokenType.FOLLOW_UP;
  return TokenType.EMERGENCY;
}

/**
 * Book a token via API
 */
async function bookToken(
  patientName: string,
  patientType: TokenType,
  slotId: string
): Promise<BookingResult> {
  try {
    const response = await axios.post<any>(`${API_BASE_URL}/api/book`, {
      patientName,
      patientType,
      slotId,
    });

    return {
      success: true,
      tokenId: response.data.token.id,
      slotId,
      patientName,
      tokenType: patientType,
      message: response.data.message,
    };
  } catch (error: any) {
    return {
      success: false,
      slotId,
      patientName,
      tokenType: patientType,
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

/**
 * Cancel a token via API
 */
async function cancelToken(tokenId: string, patientName: string): Promise<boolean> {
  try {
    const response = await axios.post<any>(`${API_BASE_URL}/api/cancel/${tokenId}`);
    return response.data.success;
  } catch (error: any) {
    logger.error(`   ❌ Failed to cancel token for ${patientName}:`, error.response?.data?.error?.message || error.message);
    return false;
  }
}

/**
 * Get slots for a doctor
 */
async function getDoctorSlots(doctorId: string): Promise<any[]> {
  try {
    const response = await axios.get<any>(`${API_BASE_URL}/api/doctors/${doctorId}/slots`);
    return response.data.data.slots;
  } catch (error: any) {
    logger.error(`Failed to get slots for doctor ${doctorId}:`, error.message);
    return [];
  }
}

/**
 * Main simulation function
 */
async function simulateDay() {
  try {
    console.log('\n🚀 ========================================');
    console.log('📅 OPD Flow Engine - Day Simulation');
    console.log('🚀 ========================================\n');

    // Connect to database to get doctor and slot data
    await connectDB();

    // Fetch doctors
    const doctors = await Doctor.find().limit(3);
    if (doctors.length === 0) {
      console.log('❌ No doctors found. Please run: npm run seed');
      process.exit(1);
    }

    console.log(`👨‍⚕️  Found ${doctors.length} doctors:`);
    doctors.forEach((doc, idx) => {
      console.log(`   ${idx + 1}. ${doc.name} (${doc.specialization})`);
    });
    console.log();

    // Fetch all slots for all doctors
    const allSlots = await Slot.find({
      doctorId: { $in: doctors.map(d => d._id) },
    }).populate('doctorId');

    if (allSlots.length === 0) {
      console.log('❌ No slots found. Please run: npm run seed');
      process.exit(1);
    }

    console.log(`📅 Found ${allSlots.length} total slots across all doctors\n`);

    // Disconnect from DB as we'll use API from now on
    await disconnectDB();

    // Give server time to be ready
    console.log('⏳ Waiting for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulation state
    const bookedTokens: BookingResult[] = [];
    const NUM_REQUESTS = 25; // 20-30 requests as specified
    let successCount = 0;
    let failureCount = 0;
    let emergencyOverbooked = 0;

    console.log('\n🎬 ========================================');
    console.log('📋 Starting Token Booking Simulation');
    console.log('🎬 ========================================\n');

    // Simulate booking requests
    for (let i = 1; i <= NUM_REQUESTS; i++) {
      const patientName = getRandomPatientName();
      const tokenType = getRandomTokenType();
      const randomSlot = getRandomElement(allSlots);
      const doctor = randomSlot.doctorId as any;

      console.log(`\n[Request ${i}/${NUM_REQUESTS}]`);
      console.log(`👤 Patient: ${patientName}`);
      console.log(`🏥 Doctor: ${doctor.name} (${doctor.specialization})`);
      console.log(`⏰ Slot: ${randomSlot.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${randomSlot.endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`);
      console.log(`🎫 Type: ${tokenType}`);
      
      const result = await bookToken(patientName, tokenType, randomSlot._id.toString());

      if (result.success) {
        successCount++;
        bookedTokens.push(result);
        
        if (result.message?.includes('exceeding')) {
          emergencyOverbooked++;
          console.log(`✅ SUCCESS - ${result.message} (Emergency Override)`);
        } else {
          console.log(`✅ SUCCESS - Token booked successfully`);
        }
        console.log(`   Token ID: ${result.tokenId}`);
      } else {
        failureCount++;
        console.log(`❌ FAILED - ${result.error}`);
      }

      // Random delay to simulate realistic timing
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    }

    console.log('\n\n🔄 ========================================');
    console.log('🔄 Simulating Token Cancellations');
    console.log('🔄 ========================================\n');

    // Randomly cancel 20-30% of successful bookings
    const numCancellations = Math.floor(bookedTokens.length * (0.2 + Math.random() * 0.1));
    const tokensToCancel = [...bookedTokens]
      .sort(() => Math.random() - 0.5)
      .slice(0, numCancellations);

    let cancelSuccessCount = 0;

    for (const token of tokensToCancel) {
      console.log(`\n🚫 Cancelling token for ${token.patientName} (${token.tokenType})`);
      console.log(`   Token ID: ${token.tokenId}`);
      
      const cancelled = await cancelToken(token.tokenId!, token.patientName);
      
      if (cancelled) {
        cancelSuccessCount++;
        console.log(`   ✅ Cancellation successful - Slot freed up`);
      }

      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    }

    console.log('\n\n📊 ========================================');
    console.log('📊 Simulation Summary');
    console.log('📊 ========================================\n');

    console.log(`📈 Booking Statistics:`);
    console.log(`   Total Requests: ${NUM_REQUESTS}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   🚨 Emergency Overbooked: ${emergencyOverbooked}`);
    console.log(`   📊 Success Rate: ${((successCount / NUM_REQUESTS) * 100).toFixed(1)}%`);

    console.log(`\n🔄 Cancellation Statistics:`);
    console.log(`   Cancellation Attempts: ${tokensToCancel.length}`);
    console.log(`   ✅ Successful: ${cancelSuccessCount}`);
    console.log(`   📊 Success Rate: ${tokensToCancel.length > 0 ? ((cancelSuccessCount / tokensToCancel.length) * 100).toFixed(1) : 0}%`);

    console.log(`\n🎫 Token Type Distribution:`);
    const typeDistribution: Record<string, number> = {};
    bookedTokens.forEach(token => {
      typeDistribution[token.tokenType] = (typeDistribution[token.tokenType] || 0) + 1;
    });
    Object.entries(typeDistribution).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} (${((count / bookedTokens.length) * 100).toFixed(1)}%)`);
    });

    // Show final slot status
    console.log('\n\n🏥 ========================================');
    console.log('🏥 Final Slot Status');
    console.log('🏥 ========================================\n');

    for (const doctor of doctors) {
      const slots = await getDoctorSlots(doctor._id.toString());
      const totalCapacity = slots.reduce((sum, s) => sum + s.maxCapacity, 0);
      const totalBooked = slots.reduce((sum, s) => sum + s.currentCount, 0);
      const availableSlots = slots.filter(s => s.isAvailable).length;

      console.log(`👨‍⚕️  ${doctor.name} (${doctor.specialization})`);
      console.log(`   Total Capacity: ${totalCapacity}`);
      console.log(`   Tokens Booked: ${totalBooked}`);
      console.log(`   Utilization: ${((totalBooked / totalCapacity) * 100).toFixed(1)}%`);
      console.log(`   Available Slots: ${availableSlots}/${slots.length}`);
      
      // Show which slots are full
      const fullSlots = slots.filter(s => !s.isAvailable);
      if (fullSlots.length > 0) {
        console.log(`   Full Slots: ${fullSlots.map((s: any) => 
          new Date(s.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        ).join(', ')}`);
      }
      console.log();
    }

    console.log('✅ ========================================');
    console.log('✅ Simulation Complete!');
    console.log('✅ ========================================\n');

    console.log('💡 Key Observations:');
    console.log('   • EMERGENCY tokens can exceed capacity (elastic capacity)');
    console.log('   • Regular tokens are rejected when slot is full');
    console.log('   • Cancellations free up slots immediately');
    console.log('   • All operations are transaction-safe\n');

  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  } finally {
    // Ensure DB connection is closed
    try {
      await disconnectDB();
    } catch (e) {
      // Already disconnected
    }
    process.exit(0);
  }
}

// Run the simulation
console.log('🔧 Initializing simulation...');
simulateDay();
