import { Schema, model, Document } from 'mongoose';

export interface IProject extends Document {
  workspaceId: string;
  name: string;
  description?: string;
  requirements?: string;
  status: string;
  gitRepo?: string;
  frontendUrl?: string;
  backendUrl?: string;
  modules?: string[];
  environments?: { key: string, value: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  workspaceId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  requirements: { type: String },
  status: { type: String, default: 'TO DO' },
  gitRepo: { type: String },
  frontendUrl: { type: String },
  backendUrl: { type: String },
  modules: [{ type: String }],
  environments: [{
    key: { type: String },
    value: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ProjectSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Project = model<IProject>('Project', ProjectSchema);
