import { Schema, model, Document } from 'mongoose';

export interface IComment extends Document {
  issueId: string;
  userId: string;
  userName: string;
  content: string;
  parentId?: string;   // For threaded replies
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  issueId:  { type: String, required: true, index: true },
  userId:   { type: String, required: true },
  userName: { type: String, default: 'Unknown' },
  content:  { type: String, required: true },
  parentId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CommentSchema.index({ issueId: 1, createdAt: 1 });

CommentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Comment = model<IComment>('Comment', CommentSchema);
