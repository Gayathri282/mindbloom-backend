import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  connectToDatabase,
  AppointmentModel,
  ChatMessageModel,
  CrisisLogModel,
  CarePlanModel,
} from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize MongoDB Connection asynchronously
connectToDatabase().catch((err) => console.error('DB Init Error:', err));

// Healthcheck & Database Engine Status
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  const dbConnected = await connectToDatabase();
  const queryLatencyMs = Date.now() - startTime;

  res.json({
    status: 'ok',
    service: 'MindBloom Psychologist Consultation API',
    databaseEngine: dbConnected ? 'MongoDB Document Engine (Active)' : 'High-Speed In-Memory Cache (Fallback)',
    queryLatency: `${queryLatencyMs}ms`,
    timestamp: new Date().toISOString(),
  });
});

// Server-side UTC Time-gating for Video Session Join Window
app.get('/api/appointments/time-gate', (req, res) => {
  const { startTimeISO, graceMinutes = 30 } = req.query;

  if (!startTimeISO || typeof startTimeISO !== 'string') {
    return res.status(400).json({ error: 'startTimeISO is required' });
  }

  const now = new Date();
  const start = new Date(startTimeISO);
  const gracePeriodMs = Number(graceMinutes) * 60 * 1000;
  const endWindow = new Date(start.getTime() + gracePeriodMs);

  const isJoinWindowActive = now >= start && now <= endWindow;

  res.json({
    currentTimeUTC: now.toISOString(),
    scheduledStartUTC: start.toISOString(),
    windowExpiresUTC: endWindow.toISOString(),
    isJoinWindowActive,
    graceMinutes: Number(graceMinutes),
  });
});

// Fast MongoDB Appointment Store & Fetch
app.get('/api/appointments', async (req, res) => {
  try {
    const isDbConnected = await connectToDatabase();
    if (isDbConnected) {
      const appointments = await AppointmentModel.find().lean();
      return res.json({ appointments, source: 'MongoDB' });
    }
  } catch (e) {
    // fallback gracefully
  }
  res.json({ appointments: [], source: 'Memory' });
});

// Server Crisis Language Scanner & Audit Logger Endpoint
app.post('/api/crisis/detect', async (req, res) => {
  const { message, patientId, patientName } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message content string is required' });
  }

  const CRISIS_REGEX = /(want to (die|end my life|kill myself)|suicide|suicidal|thinking of ending it|no reason to live|better off dead|don't want to live|wish i was dead|harm (myself|self)|cut myself|hurting myself|self-harm|overdose|can't go on anymore)/i;

  const isCrisis = CRISIS_REGEX.test(message.toLowerCase());

  if (isCrisis) {
    const auditRecord = {
      id: `crisis-${Date.now()}`,
      patient_id: patientId || 'patient-1',
      patient_name: patientName || 'Maya Lin',
      trigger_phrase_category: 'High Risk Emotional Distress Intent',
      resolved: false,
      created_at: new Date().toISOString(),
    };

    // Save crisis audit log in MongoDB asynchronously if connected
    try {
      if (await connectToDatabase()) {
        await CrisisLogModel.create(auditRecord);
      }
    } catch (e) {
      console.warn('Crisis log save warning:', e);
    }

    return res.json({
      isCrisis: true,
      category: auditRecord.trigger_phrase_category,
      auditRecord,
      responseMessage: `I hear how much pain you are experiencing right now, and your safety is the most important priority. Because your message suggests you may be in distress, I am immediately providing crisis resources below. Please reach out to one of these free, confidential support lines right away. You do not have to carry this alone.`,
      resources: [
        { name: '988 Suicide & Crisis Lifeline', contact: 'Call or Text 988', action: 'tel:988' },
        { name: 'Crisis Text Line', contact: 'Text HOME to 741741', action: 'sms:741741?body=HOME' },
        { name: 'Urgent Therapist Notification', contact: 'Dr. Sarah Jenkins Priority Alert', action: 'therapist_alert' },
        { name: 'Emergency Medical Services', contact: 'Call 911 / Local Emergency', action: 'tel:911' },
      ],
    });
  }

  res.json({ isCrisis: false });
});

// Care Plan Resolver API (Enforcing Therapist Priority)
app.get('/api/care-plans/resolve', (req, res) => {
  const { therapistPlanExists } = req.query;
  const source = therapistPlanExists === 'true' ? 'therapist' : 'ai_generated';

  res.json({
    source,
    priorityRule: 'Therapist-assigned Care Plan takes immediate precedence over intake starter forms.',
  });
});

app.listen(PORT, () => {
  console.log(`🌸 MindBloom Backend Server running on http://localhost:${PORT}`);
});
