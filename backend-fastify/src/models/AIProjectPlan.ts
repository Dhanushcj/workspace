import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  category: String,
  storyPoints: Number,
  priority: String,
  suggestedAssignee: String,
  assigneeReason: String,
  selected: { type: Boolean, default: true }
});

const StorySchema = new mongoose.Schema({
  id: String,
  title: String,
  userStory: String,
  description: String,
  storyPoints: Number,
  priority: String,
  acceptanceCriteria: [String],
  dependencies: [String],
  tasks: [TaskSchema],
  selected: { type: Boolean, default: true }
});

const EpicSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  priority: String,
  stories: [StorySchema],
  selected: { type: Boolean, default: true }
});

const SprintSchema = new mongoose.Schema({
  id: String,
  name: String,
  goal: String,
  storyIds: [String],
  totalStoryPoints: Number
});

const AIProjectPlanSchema = new mongoose.Schema({
  // Use String (not ObjectId) to match Sprint/Issue/Epic models — avoids CastError when querying with string projectIds
  projectId: { type: String, required: true, index: true },
  status: { type: String, enum: ['DRAFT', 'APPROVED'], default: 'DRAFT' },
  projectSummary: String,
  assumptions: [String],
  clarifications: [String],
  epics: [EpicSchema],
  sprints: [SprintSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const AIProjectPlan = mongoose.model('AIProjectPlan', AIProjectPlanSchema);
