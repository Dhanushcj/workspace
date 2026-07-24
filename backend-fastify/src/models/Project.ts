import { Schema, model, Document } from 'mongoose';

export interface IProject extends Document {
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  workspaceId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ProjectSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Project = model<IProject>('Project', ProjectSchema);
