import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'INFO', enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'] },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

NotificationSchema.index({ userId: 1, isRead: 1 });

NotificationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Notification = model<INotification>('Notification', NotificationSchema);
