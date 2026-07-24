import { Schema, model, Document } from 'mongoose';

export interface IEpic extends Document {
  projectId: string;
  name: string;
  description?: string;
  color?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const EpicSchema = new Schema<IEpic>({
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  color: { type: String, default: '#6366f1' },
  status: { type: String, default: 'TODO' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

EpicSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Epic = model<IEpic>('Epic', EpicSchema);
