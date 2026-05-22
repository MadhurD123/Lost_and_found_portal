import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Connection details
let isMongoConnected = false;

export async function connectDB() {
  const MONGO_URI = process.env.MONGODB_URI;
  if (MONGO_URI) {
    try {
      // Clean up any trailing slashes in the database name part of the URI
      // to avoid Mongoose parsing the DB name with a slash (resulting in namespaces like database/.collection)
      let cleanUri = MONGO_URI.trim();
      const parts = cleanUri.split('?');
      let base = parts[0];
      const query = parts[1] ? '?' + parts[1] : '';
      while (base.endsWith('/')) {
        base = base.slice(0, -1);
      }
      cleanUri = base + query;

      // Hide password credentials in logs if present
      const maskedUri = cleanUri.replace(/:([^@:]+)@/, ':******@');
      console.log('Connecting to MongoDB: ' + maskedUri);
      await mongoose.connect(cleanUri);
      isMongoConnected = true;
      console.log('MongoDB successfully connected via Mongoose.');
    } catch (err: any) {
      console.error('Failed to connect to MongoDB. Falling back to local file database store.', err.message);
      isMongoConnected = false;
    }
  } else {
    console.log('No MONGODB_URI found in environment. Using robust local JSON database wrapper.');
    isMongoConnected = false;
  }
}

// ---------------------------------------------------------
// 1. MONGOOSE SCHEMA & MODEL DEFINITIONS
// ---------------------------------------------------------

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, default: '' },
  studentId: { type: String, default: '' },
}, { timestamps: true });

const LostItemSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userId: { type: String, required: true },
  itemName: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  locationLost: { type: String, required: true },
  dateLost: { type: String, required: true },
  image: { type: String, default: '' },
  contactEmail: { type: String, required: true },
  status: { type: String, enum: ['Searching', 'Matched', 'Returned'], default: 'Searching' },
}, { timestamps: true });

const FoundItemSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userId: { type: String, required: true },
  itemName: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  locationFound: { type: String, required: true },
  dateFound: { type: String, required: true },
  image: { type: String, default: '' },
  contactEmail: { type: String, required: true },
  status: { type: String, enum: ['Available', 'Claimed', 'Returned'], default: 'Available' },
}, { timestamps: true });

const ClaimRequestSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  itemType: { type: String, enum: ['Lost', 'Found'], required: true },
  claimantUsername: { type: String, required: true },
  claimantEmail: { type: String, required: true },
  message: { type: String, required: true },
  requestStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  itemName: { type: String, required: true }, // copy for display convenience
  itemPoster: { type: String, required: true }, // copy for notification
}, { timestamps: true });

export const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);
export const MongoLostItem = mongoose.models.LostItem || mongoose.model('LostItem', LostItemSchema);
export const MongoFoundItem = mongoose.models.FoundItem || mongoose.model('FoundItem', FoundItemSchema);
export const MongoClaimRequest = mongoose.models.ClaimRequest || mongoose.model('ClaimRequest', ClaimRequestSchema);

// ---------------------------------------------------------
// 2. FILE-BASED DATABASE STORAGE & FALLBACK
// ---------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Interface for database structures
interface LocalDB {
  users: any[];
  lostItems: any[];
  foundItems: any[];
  claimRequests: any[];
}

const DEFAULT_DB: LocalDB = {
  users: [
    {
      _id: 'user_seed_admin',
      username: 'admin',
      email: 'admin@university.edu',
      password: '$2a$10$T85yV0QpXbCskAorRsc1SuxWCOlK9SgP3g/N820i.D4fB9b8NisKG', // hashed "admin123"
      department: 'Administration',
      studentId: 'ADMIN-001',
      isAdmin: true,
      createdAt: new Date('2026-01-01').toISOString()
    },
    {
      _id: 'user_seed_1',
      username: 'samantha_jones',
      email: 'samantha.j@university.edu',
      password: '$2a$10$T85yV0QpXbCskAorRsc1SuxWCOlK9SgP3g/N820i.D4fB9b8NisKG', // hashed "admin123"
      department: 'Computer Science',
      studentId: 'CS-2024-884',
      createdAt: new Date('2026-03-10').toISOString()
    },
    {
      _id: 'user_seed_2',
      username: 'michael_chen',
      email: 'm.chen@university.edu',
      password: '$2a$10$T85yV0QpXbCskAorRsc1SuxWCOlK9SgP3g/N820i.D4fB9b8NisKG', // hashed "admin123"
      department: 'Mechanical Engineering',
      studentId: 'ME-2025-012',
      createdAt: new Date('2026-04-15').toISOString()
    }
  ],
  lostItems: [],
  foundItems: [],
  claimRequests: []
};

function readLocalDB(): LocalDB {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DB, null, 2));
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local file database. Resetting to defaults.', err);
    return DEFAULT_DB;
  }
}

function writeLocalDB(db: LocalDB) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error writing to local file database.', err);
  }
}

// Helper to generate unique mongo-like IDs for local DB
function makeId(): string {
  return 'local_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// ---------------------------------------------------------
// 3. COHESIVE UNIFIED DATABASE INTERFACE ENGINE
// ---------------------------------------------------------
export const DB = {
  // --- USERS COMPONENT ---
  users: {
    async create(data: any) {
      if (isMongoConnected) {
        return await MongoUser.create(data);
      } else {
        const db = readLocalDB();
        const newUser = {
          _id: makeId(),
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.users.push(newUser);
        writeLocalDB(db);
        return newUser;
      }
    },
    async findOne(filter: any) {
      if (isMongoConnected) {
        return await MongoUser.findOne(filter);
      } else {
        const db = readLocalDB();
        return db.users.find(u => {
          for (const key in filter) {
            if (u[key] !== filter[key]) return false;
          }
          return true;
        }) || null;
      }
    },
    async findById(id: string) {
      if (isMongoConnected) {
        return await (MongoUser as any).findById(id);
      } else {
        const db = readLocalDB();
        return db.users.find(u => u._id === id) || null;
      }
    }
  },

  // --- LOST ITEMS COMPONENT ---
  lostItems: {
    async create(data: any) {
      if (isMongoConnected) {
        return await MongoLostItem.create(data);
      } else {
        const db = readLocalDB();
        const newItem = {
          _id: makeId(),
          status: 'Searching',
          image: '',
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.lostItems.push(newItem);
        writeLocalDB(db);
        return newItem;
      }
    },
    async find(filter: any = {}) {
      if (isMongoConnected) {
        return await MongoLostItem.find(filter).sort({ createdAt: -1 });
      } else {
        const db = readLocalDB();
        let items = db.lostItems;
        // Filter keys
        if (Object.keys(filter).length > 0) {
          items = items.filter(item => {
            for (const key in filter) {
              if (item[key] !== filter[key]) return false;
            }
            return true;
          });
        }
        // sort by newest
        return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    },
    async findById(id: string) {
      if (isMongoConnected) {
        return await (MongoLostItem as any).findById(id);
      } else {
        const db = readLocalDB();
        return db.lostItems.find(item => item._id === id) || null;
      }
    },
    async findByIdAndUpdate(id: string, updateData: any) {
      if (isMongoConnected) {
        return await (MongoLostItem as any).findByIdAndUpdate(id, updateData, { new: true });
      } else {
        const db = readLocalDB();
        const index = db.lostItems.findIndex(item => item._id === id);
        if (index === -1) return null;
        db.lostItems[index] = {
          ...db.lostItems[index],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        writeLocalDB(db);
        return db.lostItems[index];
      }
    },
    async findByIdAndDelete(id: string) {
      if (isMongoConnected) {
        return await (MongoLostItem as any).findByIdAndDelete(id);
      } else {
        const db = readLocalDB();
        const index = db.lostItems.findIndex(item => item._id === id);
        if (index === -1) return null;
        const deleted = db.lostItems[index];
        db.lostItems.splice(index, 1);
        writeLocalDB(db);
        return deleted;
      }
    }
  },

  // --- FOUND ITEMS COMPONENT ---
  foundItems: {
    async create(data: any) {
      if (isMongoConnected) {
        return await MongoFoundItem.create(data);
      } else {
        const db = readLocalDB();
        const newItem = {
          _id: makeId(),
          status: 'Available',
          image: '',
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.foundItems.push(newItem);
        writeLocalDB(db);
        return newItem;
      }
    },
    async find(filter: any = {}) {
      if (isMongoConnected) {
        return await MongoFoundItem.find(filter).sort({ createdAt: -1 });
      } else {
        const db = readLocalDB();
        let items = db.foundItems;
        // Filter keys
        if (Object.keys(filter).length > 0) {
          items = items.filter(item => {
            for (const key in filter) {
              if (item[key] !== filter[key]) return false;
            }
            return true;
          });
        }
        // sort by newest
        return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    },
    async findById(id: string) {
      if (isMongoConnected) {
        return await (MongoFoundItem as any).findById(id);
      } else {
        const db = readLocalDB();
        return db.foundItems.find(item => item._id === id) || null;
      }
    },
    async findByIdAndUpdate(id: string, updateData: any) {
      if (isMongoConnected) {
        return await (MongoFoundItem as any).findByIdAndUpdate(id, updateData, { new: true });
      } else {
        const db = readLocalDB();
        const index = db.foundItems.findIndex(item => item._id === id);
        if (index === -1) return null;
        db.foundItems[index] = {
          ...db.foundItems[index],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        writeLocalDB(db);
        return db.foundItems[index];
      }
    },
    async findByIdAndDelete(id: string) {
      if (isMongoConnected) {
        return await (MongoFoundItem as any).findByIdAndDelete(id);
      } else {
        const db = readLocalDB();
        const index = db.foundItems.findIndex(item => item._id === id);
        if (index === -1) return null;
        const deleted = db.foundItems[index];
        db.foundItems.splice(index, 1);
        writeLocalDB(db);
        return deleted;
      }
    }
  },

  // --- CLAIM REQUESTS COMPONENT ---
  claimRequests: {
    async create(data: any) {
      if (isMongoConnected) {
        return await MongoClaimRequest.create(data);
      } else {
        const db = readLocalDB();
        const newClaim = {
          _id: makeId(),
          requestStatus: 'Pending',
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.claimRequests.push(newClaim);
        writeLocalDB(db);
        return newClaim;
      }
    },
    async find(filter: any = {}) {
      if (isMongoConnected) {
        return await MongoClaimRequest.find(filter).sort({ createdAt: -1 });
      } else {
        const db = readLocalDB();
        let list = db.claimRequests;
        if (Object.keys(filter).length > 0) {
          list = list.filter(cl => {
            for (const key in filter) {
              if (cl[key] !== filter[key]) return false;
            }
            return true;
          });
        }
        return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    },
    async findById(id: string) {
      if (isMongoConnected) {
        return await (MongoClaimRequest as any).findById(id);
      } else {
        const db = readLocalDB();
        return db.claimRequests.find(cl => cl._id === id) || null;
      }
    },
    async findByIdAndUpdate(id: string, updateData: any) {
      if (isMongoConnected) {
        return await (MongoClaimRequest as any).findByIdAndUpdate(id, updateData, { new: true });
      } else {
        const db = readLocalDB();
        const index = db.claimRequests.findIndex(cl => cl._id === id);
        if (index === -1) return null;
        db.claimRequests[index] = {
          ...db.claimRequests[index],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        writeLocalDB(db);
        return db.claimRequests[index];
      }
    },
    async findByIdAndDelete(id: string) {
      if (isMongoConnected) {
        return await (MongoClaimRequest as any).findByIdAndDelete(id);
      } else {
        const db = readLocalDB();
        const index = db.claimRequests.findIndex(cl => cl._id === id);
        if (index === -1) return null;
        const deleted = db.claimRequests[index];
        db.claimRequests.splice(index, 1);
        writeLocalDB(db);
        return deleted;
      }
    }
  },

  // Helper utility to query diagnostics info
  async getStats() {
    const db = isMongoConnected ? null : readLocalDB();
    const stats = {
      isMongoConnected,
      usersCount: isMongoConnected ? await MongoUser.countDocuments() : db!.users.length,
      lostCount: isMongoConnected ? await MongoLostItem.countDocuments() : db!.lostItems.length,
      foundCount: isMongoConnected ? await MongoFoundItem.countDocuments() : db!.foundItems.length,
      claimCount: isMongoConnected ? await MongoClaimRequest.countDocuments() : db!.claimRequests.length,
    };
    return stats;
  }
};
