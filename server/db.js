import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'dns';
import fs from 'fs';
import path from 'path';

// Configure DNS resolution fallback for Atlas connection
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Could not set custom DNS servers, using default:', e.message);
}

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable in server/.env');
}

const client = new MongoClient(uri, {
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000
});

let db = null;
let isMock = false;
const mockDbPath = path.resolve('db.json');

// --- MOCK DATABASE EMULATOR ---
class MockCollection {
  constructor(name) {
    this.name = name;
  }

  _getData() {
    if (!fs.existsSync(mockDbPath)) {
      fs.writeFileSync(mockDbPath, JSON.stringify({}));
    }
    try {
      const data = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
      if (!data[this.name]) data[this.name] = [];
      return data;
    } catch (e) {
      console.error('Error reading mock DB file, resetting:', e);
      return {};
    }
  }

  _saveData(data) {
    fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2));
  }

  _getDocs() {
    const data = this._getData();
    return data[this.name] || [];
  }

  _saveDocs(docs) {
    const data = this._getData();
    data[this.name] = docs;
    this._saveData(data);
  }

  _match(doc, query) {
    for (const key in query) {
      const val = query[key];
      if (key === '_id' && typeof val === 'object' && val !== null) {
        if (val.$nin) {
          if (val.$nin.includes(doc._id)) return false;
        }
      } else if (doc[key] !== val) {
        return false;
      }
    }
    return true;
  }

  find(query = {}) {
    let docs = this._getDocs().filter(d => this._match(d, query));
    
    // Return cursor-like structure
    const cursor = {
      toArray: async () => docs,
      sort: (sortQuery) => {
        const key = Object.keys(sortQuery)[0];
        const dir = sortQuery[key];
        docs.sort((a, b) => {
          if (a[key] < b[key]) return -dir;
          if (a[key] > b[key]) return dir;
          return 0;
        });
        return cursor;
      },
      limit: (n) => {
        docs = docs.slice(0, n);
        return cursor;
      }
    };
    return cursor;
  }

  async findOne(query = {}) {
    const docs = this._getDocs();
    return docs.find(d => this._match(d, query)) || null;
  }

  async insertOne(doc) {
    const docs = this._getDocs();
    if (!doc._id) {
      doc._id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
    docs.push(doc);
    this._saveDocs(docs);
    return { insertedId: doc._id };
  }

  async insertMany(newDocs) {
    const docs = this._getDocs();
    newDocs.forEach(d => {
      if (!d._id) {
        d._id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      }
      docs.push(d);
    });
    this._saveDocs(docs);
    return { insertedCount: newDocs.length };
  }

  async updateOne(query, update) {
    const docs = this._getDocs();
    const doc = docs.find(d => this._match(d, query));
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };

    if (update.$set) {
      Object.assign(doc, update.$set);
    }
    this._saveDocs(docs);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(query, update) {
    const docs = this._getDocs();
    let count = 0;
    docs.forEach(doc => {
      if (this._match(doc, query)) {
        if (update.$set) {
          Object.assign(doc, update.$set);
          count++;
        }
      }
    });
    if (count > 0) {
      this._saveDocs(docs);
    }
    return { matchedCount: count, modifiedCount: count };
  }

  async deleteOne(query) {
    const docs = this._getDocs();
    const index = docs.findIndex(d => this._match(d, query));
    if (index === -1) return { deletedCount: 0 };
    docs.splice(index, 1);
    this._saveDocs(docs);
    return { deletedCount: 1 };
  }

  async deleteMany(query) {
    const docs = this._getDocs();
    const beforeCount = docs.length;
    const remaining = docs.filter(d => !this._match(d, query));
    this._saveDocs(remaining);
    return { deletedCount: beforeCount - remaining.length };
  }

  async countDocuments(query = {}) {
    return this._getDocs().filter(d => this._match(d, query)).length;
  }
}

class MockDb {
  collection(name) {
    return new MockCollection(name);
  }
}

export async function connectDb() {
  if (db) return db;
  try {
    console.log('Attempting to connect to remote MongoDB Atlas cluster...');
    await client.connect();
    console.log('Successfully connected to MongoDB Atlas!');
    db = client.db('money_management');
    return db;
  } catch (error) {
    console.warn('\n================================================================');
    console.warn('⚠️ WARNING: MongoDB Atlas Connection Failed!');
    console.warn('Reason:', error.message);
    console.warn('This is usually because this host IP is not on the Atlas Access Whitelist.');
    console.warn('FALLING BACK TO LOCAL FILE-BASED DATABASE EMULATOR (db.json)');
    console.warn('================================================================\n');
    isMock = true;
    db = new MockDb();
    return db;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDb() first.');
  }
  return db;
}
