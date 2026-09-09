import { Schema, model, Document } from 'mongoose';

export interface IProjectMember extends Document {
  projectId: string;
  userId: string;
  assignedBy: string;
  assignedAt: Date;
}

const ProjectMemberSchema = new Schema<IProjectMember>({
  projectId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  assignedBy: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now }
});

ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export const ProjectMember = model<IProjectMember>('ProjectMember', ProjectMemberSchema);
