import { Schema, model, Document, Types } from 'mongoose';

export interface ITimeEntry extends Document {
  workspaceId: string;
  projectId?: string;
  taskId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
  isRunning: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema = new Schema<ITimeEntry>({
  workspaceId: { type: String, required: true, index: true },
  projectId: { type: String, index: true },
  taskId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  startTime: { type: Date, required: true, default: Date.now },
  endTime: { type: Date },
  durationSeconds: { type: Number, default: 0 },
  isRunning: { type: Boolean, default: true, index: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TimeEntrySchema.index({ userId: 1, isRunning: 1 });

TimeEntrySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  
  if (!this.isRunning && this.startTime && this.endTime) {
    this.durationSeconds = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }
  
  next();
});

export const TimeEntry = model<ITimeEntry>('TimeEntry', TimeEntrySchema);
