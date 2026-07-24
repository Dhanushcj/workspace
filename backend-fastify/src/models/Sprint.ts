import { Schema, model, Document, Types } from 'mongoose';

export interface ISprint extends Document {
  projectId: string;
  name: string;
  status: 'PLANNING' | 'ACTIVE' | 'CLOSED';
  startDate?: Date;
  endDate?: Date;
  goal?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema = new Schema<ISprint>({
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ['PLANNING', 'ACTIVE', 'CLOSED'],
    default: 'PLANNING',
  },
  startDate: { type: Date },
  endDate: { type: Date },
  goal: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

SprintSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Sprint = model<ISprint>('Sprint', SprintSchema);
