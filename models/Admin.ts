import mongoose, { Schema, Model } from 'mongoose';

export interface IAdmin {
  _id?: string | mongoose.Types.ObjectId;
  email: string;
  role: 'admin' | 'superadmin';
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We only want createdAt, not updatedAt
  }
);

// Prevent model recompilation during development
const Admin: Model<IAdmin> =
  mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;
