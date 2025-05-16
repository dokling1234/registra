import mongoose from 'mongoose';
import db from '../config/db.js';

const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'admin' },
});

const Admin = db.model('Admin', adminSchema);

export default Admin;
