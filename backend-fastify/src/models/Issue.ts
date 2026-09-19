import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityLog {
  action: string;
  userId: string;
  userName: string;
  timestamp: Date;
  meta?: string;
}

export interface ISubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface IRequirement {
  id: string;
  text: string;
  completed: boolean;
}

export interface IAcceptanceCriterion {
  id: string;
  text: string;
  completed: boolean;
}

export interface IIssue extends Document {
  workspaceId: string;
  projectId: string;
  sprintId?: string;
  epicId?: string;
  parentId?: string;
  displayId?: string;        // Human-readable e.g. TASK-124
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  assigneeId?: string;
  creatorId: string;
  testerId?: string;
  storyPoints?: number;
  estimate?: number;
  estimatedHours?: number;
  dueDate?: Date;
  startDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  // Task hierarchy
  moduleId?: string;
  moduleName?: string;
  featureId?: string;
  featureName?: string;
  // Subtasks / checklist
  subtasks: ISubtask[];
  requirements: IRequirement[];
  acceptanceCriteria: IAcceptanceCriterion[];
  // Workflow
  activityLog: IActivityLog[];
  reviewComment?: string;    // Team Lead's review comment
  testComment?: string;      // Tester's fail reason
  dependencies?: string[];   // IDs of blocking issues
  blockerInfo?: {
    reason: string;
    raisedAt: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const subtaskSchema = new Schema({
  id: { type: String, default: () => new Types.ObjectId().toHexString() },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { _id: false });

const requirementSchema = new Schema({
  id: { type: String, default: () => new Types.ObjectId().toHexString() },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { _id: false });

const criterionSchema = new Schema({
  id: { type: String, default: () => new Types.ObjectId().toHexString() },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { _id: false });

const activityLogSchema = new Schema({
  action: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, default: 'Unknown' },
  timestamp: { type: Date, default: Date.now },
  meta: { type: String }
}, { _id: false });

const IssueSchema = new Schema<IIssue>({
  workspaceId:    { type: String, required: true, index: true },
  projectId:      { type: String, required: true, index: true },
  sprintId:       { type: String, index: true },
  epicId:         { type: String },
  parentId:       { type: String, index: true },
  displayId:      { type: String, index: true },
  title:          { type: String, required: true },
  description:    { type: String },
  type:           { type: String, default: 'FEATURE' },
  status:         { type: String, default: 'TO_DO' },
  priority:       { type: String, default: 'MEDIUM' },
  assigneeId:     { type: String },
  creatorId:      { type: String, required: true },
  testerId:       { type: String },
  storyPoints:    { type: Number },
  estimate:       { type: Number },
  estimatedHours: { type: Number },
  dueDate:        { type: Date },
  startDate:      { type: Date },
  startedAt:      { type: Date },
  completedAt:    { type: Date },
  moduleId:       { type: String },
  moduleName:     { type: String },
  featureId:      { type: String },
  featureName:    { type: String },
  subtasks:           { type: [subtaskSchema], default: [] },
  requirements:       { type: [requirementSchema], default: [] },
  acceptanceCriteria: { type: [criterionSchema], default: [] },
  activityLog:        { type: [activityLogSchema], default: [] },
  reviewComment:  { type: String },
  testComment:    { type: String },
  dependencies:   { type: [String], default: [] },
  blockerInfo: {
    reason:    { type: String },
    raisedAt:  { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

IssueSchema.index({ projectId: 1, status: 1 });
IssueSchema.index({ projectId: 1, sprintId: 1 });
IssueSchema.index({ assigneeId: 1, status: 1 });
IssueSchema.index({ workspaceId: 1, displayId: 1 });

IssueSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Issue = model<IIssue>('Issue', IssueSchema);
