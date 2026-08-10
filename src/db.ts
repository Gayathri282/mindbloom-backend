import mongoose, { Schema } from 'mongoose';

// High-speed MongoDB Schemas & Mongoose Models

// 1. Appointment Schema
const appointmentSchema = new Schema({
  id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true, index: true },
  patient_name: String,
  patient_avatar: String,
  therapist_id: { type: String, required: true, index: true },
  therapist_name: String,
  slot_id: String,
  scheduled_at: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'missed'], default: 'scheduled' },
  therapist_joined_at: String,
  patient_joined_at: String,
  completed_at: String,
  payment_id: String,
  razorpay_order_id: String,
  payment_link_id: String,
  short_url: String,
  reference_id: { type: String, index: true },
  expires_at: String,
  payment_status: { type: String, enum: ['pending', 'paid', 'failed', 'expired'], default: 'pending' },
  amount_paid: Number,
  payment_method: { type: String, default: 'Razorpay Payment Link' },
  created_at: { type: String, default: () => new Date().toISOString() },
});

// 2. Chat Message Schema (Optimized for fast timeline query by receiver/sender)
const chatMessageSchema = new Schema({
  id: { type: String, required: true, unique: true },
  sender_id: { type: String, required: true, index: true },
  sender_name: String,
  sender_avatar: String,
  receiver_id: { type: String, required: true, index: true },
  content: { type: String, required: true },
  is_ai: { type: Boolean, default: false },
  is_crisis: { type: Boolean, default: false },
  is_prescription: { type: Boolean, default: false },
  prescription_data: Schema.Types.Mixed,
  created_at: { type: String, default: () => new Date().toISOString(), index: true },
});

// 3. Crisis Audit Log Schema
const crisisLogSchema = new Schema({
  id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true, index: true },
  patient_name: String,
  trigger_phrase_category: String,
  resolved: { type: Boolean, default: false },
  created_at: { type: String, default: () => new Date().toISOString() },
});

// 4. Care Plan Schema
const carePlanSchema = new Schema({
  id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true, unique: true, index: true },
  source: { type: String, enum: ['therapist', 'ai_generated'], required: true },
  title: String,
  summary: String,
  coping_strategies: Schema.Types.Mixed,
  daily_exercises: Schema.Types.Mixed,
  resources: Schema.Types.Mixed,
  updated_at: { type: String, default: () => new Date().toISOString() },
});

// 5. Counselor Application Schema
const counselorApplicationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true },
  avatar_url: String,
  bio: String,
  license_number: String,
  certifications: [String],
  degree: String,
  specialties: [String],
  id_document_name: String,
  id_document_url: String,
  years_of_experience: Number,
  languages: [String],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  rejection_reason: String,
  submitted_at: { type: String, default: () => new Date().toISOString() },
});

// 6. Session Type Schema (30-min & 60-min default options)
const sessionTypeSchema = new Schema({
  id: { type: String, required: true, unique: true },
  counselor_id: { type: String, required: true, index: true },
  duration_minutes: { type: Number, required: true },
  price: { type: Number, required: true },
  label: { type: String, required: true },
  is_active: { type: Boolean, default: true },
});

export const AppointmentModel = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
export const ChatMessageModel = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);
export const CrisisLogModel = mongoose.models.CrisisLog || mongoose.model('CrisisLog', crisisLogSchema);
export const CarePlanModel = mongoose.models.CarePlan || mongoose.model('CarePlan', carePlanSchema);
export const CounselorApplicationModel = mongoose.models.CounselorApplication || mongoose.model('CounselorApplication', counselorApplicationSchema);
export const SessionTypeModel = mongoose.models.SessionType || mongoose.model('SessionType', sessionTypeSchema);

let isConnected = false;

export async function connectToDatabase(): Promise<boolean> {
  if (isConnected) return true;
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mindbloom';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick fallback if MongoDB service is offline
    });
    isConnected = true;
    console.log('⚡ MongoDB connected successfully for ultra-fast document storage');
    return true;
  } catch (error) {
    console.warn('⚠️ MongoDB connection unavailable or offline. Operating with high-speed in-memory store fallback.');
    return false;
  }
}
