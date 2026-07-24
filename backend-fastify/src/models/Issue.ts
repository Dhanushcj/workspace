import { Schema, model, Document, Types } from 'mongoose';

export interface IIssue extends Document {
  workspaceId: string;
  projectId: string;
  sprintId?: string;
  epicId?: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  assigneeId?: string;
  creatorId: string;
  storyPoints?: number;
  estimate?: number;
  blockerInfo?: {
    reason: string;
    raisedAt: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>({
  workspaceId: { type: String, required: true, index: true },
  projectId: { type: String, required: true, index: true },
  sprintId: { type: String, index: true },
  epicId: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, default: 'FEATURE' },
  status: { type: String, default: 'TO_DO' },
  priority: { type: String, default: 'MEDIUM' },
  assigneeId: { type: String },
  creatorId: { type: String, required: true },
  storyPoints: { type: Number },
  estimate: { type: Number },
  blockerInfo: {
    reason: { type: String },
    raisedAt: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

IssueSchema.index({ projectId: 1, status: 1 });
IssueSchema.index({ projectId: 1, sprintId: 1 });

IssueSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Issue = model<IIssue>('Issue', IssueSchema);
