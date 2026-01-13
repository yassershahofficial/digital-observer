import mongoose, { Schema, Model } from 'mongoose';

export interface IProject {
  _id?: string | mongoose.Types.ObjectId;
  name: string;
  youtubeUrl: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    youtubeUrl: {
      type: String,
      required: [true, 'YouTube URL is required'],
      trim: true,
      validate: {
        validator: function (v: string) {
          // Basic YouTube URL validation
          return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
        },
        message: 'Please provide a valid YouTube URL',
      },
    },
    order: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We manage timestamps manually
  }
);

// Prevent model recompilation during development
const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
