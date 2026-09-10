import mongoose from 'mongoose';

// ─── Sub-schemas for AI Plan items ────────────────────────────────────────────

const RequirementSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
  type: { type: String, enum: ['FUNCTIONAL', 'NON_FUNCTIONAL', 'SECURITY', 'TECHNICAL'], default: 'FUNCTIONAL' }
}, { _id: false });

const TaskSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  category: { type: String, default: 'BACKEND' },
  requirementIds: [String],
  storyPoints: Number,
  estimateReason: String,
  priority: { type: String, default: 'MEDIUM' },
  suggestedAssignee: String,
  assigneeReason: String,
  selected: { type: Boolean, default: true }
}, { _id: false });

const StorySchema = new mongoose.Schema({
  id: String,
  title: String,
  userStory: String,
  description: String,
  requirementIds: [String],
  storyPoints: Number,
  estimateReason: String,
  needsSplit: { type: Boolean, default: false },
  priority: { type: String, default: 'MEDIUM' },
  acceptanceCriteria: [String],
  dependencies: [String],
  tasks: [TaskSchema],
  selected: { type: Boolean, default: true }
}, { _id: false });

const ModuleSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  requirementIds: [String],
  priority: { type: String, default: 'MEDIUM' },
  stories: [StorySchema],
  selected: { type: Boolean, default: true }
}, { _id: false });

const SprintSchema = new mongoose.Schema({
  id: String,
  name: String,
  goal: String,
  storyIds: [String],
  totalStoryPoints: Number
}, { _id: false });

const ValidationSchema = new mongoose.Schema({
  requirementCoverage: { type: Number, default: 0 },
  unrelatedItems: [String],
  duplicates: [mongoose.Schema.Types.Mixed],
  invalidStoryPoints: [String],
  oversizedStories: [String]
}, { _id: false });

const ProjectAnalysisSchema = new mongoose.Schema({
  objective: String,
  actors: [String],
  assumptions: [String],
  clarifications: [String],
  requirements: [RequirementSchema]
}, { _id: false });

// ─── Root AI Project Plan Schema ──────────────────────────────────────────────

const AIProjectPlanSchema = new mongoose.Schema({
  // Use String (not ObjectId) to match Sprint/Issue/Epic models — avoids CastError when querying with string projectIds
  projectId: { type: String, required: true, index: true },
  status: { type: String, enum: ['DRAFT', 'APPROVED'], default: 'DRAFT' },

  // Pass 1 output: structured analysis
  projectAnalysis: ProjectAnalysisSchema,

  // Legacy summary field (kept for backwards compatibility)
  projectSummary: String,
  assumptions: [String],
  clarifications: [String],

  // Pass 2 output: modules (epics), stories, tasks
  // Stored as 'modules' internally but exposed as 'epics' for UI compatibility
  modules: [ModuleSchema],

  // Pass 3 output: sprint plan
  sprints: [SprintSchema],

  // Pass 3 output: validation result
  validation: ValidationSchema,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AIProjectPlanSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const AIProjectPlan = mongoose.model('AIProjectPlan', AIProjectPlanSchema);
