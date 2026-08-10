import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db_store.json');

export interface DbSchema {
  appointments: any[];
  counselorApplications: any[];
  sessionTypes: any[];
  chatMessages: any[];
  carePlans: any[];
  users: any[];
  slots: any[];
}

const defaultDbData: DbSchema = {
  appointments: [],
  counselorApplications: [],
  sessionTypes: [],
  chatMessages: [],
  carePlans: [],
  users: [],
  slots: [],
};

// Ensure data directory exists on startup
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Notice creating backend data directory:', e);
  }
}

class DbStore {
  private data: DbSchema = defaultDbData;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          ...defaultDbData,
          ...parsed,
        };
        console.log(`💾 Persistent DB Store loaded from disk: ${DB_FILE}`);
      } else {
        this.saveToDisk();
      }
    } catch (err) {
      console.warn('Error reading persistent DB store from disk:', err);
      this.data = defaultDbData;
    }
  }

  public saveToDisk() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving persistent DB store to disk:', err);
    }
  }

  // Appointment operations
  public getAppointments() {
    return this.data.appointments;
  }

  public getAppointment(id: string) {
    return this.data.appointments.find((a) => a.id === id || a.reference_id === id);
  }

  public saveAppointment(appointment: any) {
    const idx = this.data.appointments.findIndex((a) => a.id === appointment.id);
    if (idx >= 0) {
      this.data.appointments[idx] = { ...this.data.appointments[idx], ...appointment };
    } else {
      this.data.appointments.push(appointment);
    }
    this.saveToDisk();
  }

  // Application operations
  public getApplications() {
    return this.data.counselorApplications;
  }

  public saveApplication(app: any) {
    const idx = this.data.counselorApplications.findIndex((a) => a.id === app.id);
    if (idx >= 0) {
      this.data.counselorApplications[idx] = { ...this.data.counselorApplications[idx], ...app };
    } else {
      this.data.counselorApplications.push(app);
    }
    this.saveToDisk();
  }

  // Session Type operations
  public getSessionTypes() {
    return this.data.sessionTypes;
  }

  public saveSessionType(st: any) {
    const idx = this.data.sessionTypes.findIndex((item) => item.id === st.id);
    if (idx >= 0) {
      this.data.sessionTypes[idx] = { ...this.data.sessionTypes[idx], ...st };
    } else {
      this.data.sessionTypes.push(st);
    }
    this.saveToDisk();
  }

  // Availability Slot operations
  public getSlots() {
    return this.data.slots || [];
  }

  public saveSlot(slot: any) {
    if (!this.data.slots) this.data.slots = [];
    const idx = this.data.slots.findIndex((item) => item.id === slot.id);
    if (idx >= 0) {
      this.data.slots[idx] = { ...this.data.slots[idx], ...slot };
    } else {
      this.data.slots.push(slot);
    }
    this.saveToDisk();
  }

  public deleteSlot(slotId: string) {
    if (!this.data.slots) this.data.slots = [];
    this.data.slots = this.data.slots.filter((s) => s.id !== slotId);
    this.saveToDisk();
  }
}

export const dbStore = new DbStore();
