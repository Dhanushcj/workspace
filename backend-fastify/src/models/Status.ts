import { Schema, model, Document } from 'mongoose';

export interface IStatus extends Document {
  projectId: string;
  name: string;
  key: string;
  color: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const StatusSchema = new Schema<IStatus>({
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  key: { type: String, required: true },
  color: { type: String, default: '#94a3b8' },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

StatusSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Status = model<IStatus>('Status', StatusSchema);
