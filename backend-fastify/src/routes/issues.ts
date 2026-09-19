import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Types } from 'mongoose';
import { Issue } from '../models/Issue';
import { Comment } from '../models/Comment';
import { ProjectMember } from '../models/ProjectMember';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { authenticate } from '../middlewares/auth';
import { notifyAssignment } from '../services/notificationDispatcher';

const defaultWorkspaceId = 'forge-india-connect';

// ─── Counter for displayId ─────────────────────────────────────────────────
const _displayCounters: Record<string, number> = {};

async function getNextDisplayId(projectId: string): Promise<string> {
  if (!_displayCounters[projectId]) {
    const last = await Issue.findOne({ projectId, displayId: /^TASK-\d+$/ })
      .sort({ displayId: -1 })
      .lean() as any;
    if (last?.displayId) {
      const num = parseInt(last.displayId.replace('TASK-', ''), 10);
      _displayCounters[projectId] = isNaN(num) ? 0 : num;
    } else {
      _displayCounters[projectId] = 0;
    }
  }
  _displayCounters[projectId] += 1;
  return `TASK-${String(_displayCounters[projectId]).padStart(3, '0')}`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function isLeadOrManager(role: string): boolean {
  if (!role) return false;
  const r = role.toUpperCase().replace(/ /g, '_');
  return ['TEAM_LEAD', 'MANAGER', 'ADMIN', 'SUPER-ADMIN', 'SUPER_ADMIN', 'COMPANY-ADMIN', 'COMPANY_ADMIN'].includes(r);
}

function isTester(role: string): boolean {
  return (role || '').toUpperCase() === 'TESTER';
}

async function checkIssueAccess(request: FastifyRequest, issueProjectId: string): Promise<boolean> {
  const role = request.user?.role || 'DEVELOPER';
  if (isLeadOrManager(role)) return true;
  const member = await ProjectMember.findOne({ projectId: issueProjectId, userId: request.user?.id }).lean();
  return !!member;
}

async function populateAssignees(issues: any[]): Promise<any[]> {
  const ids = [...new Set(
    issues.flatMap((i: any) => [i.assigneeId, i.testerId].filter(Boolean))
  )];
  const users = await User.find({ _id: { $in: ids } }).lean();
  const map: Record<string, any> = {};
  users.forEach((u: any) => {
    map[u._id.toString()] = { id: u._id, name: u.name, email: u.email, avatar: u.avatarUrl };
  });
  return issues.map((issue: any) => {
    issue.id = issue._id;
    if (issue.assigneeId && map[issue.assigneeId.toString()]) {
      issue.assignee = map[issue.assigneeId.toString()];
    }
    if (issue.testerId && map[issue.testerId.toString()]) {
      issue.tester = map[issue.testerId.toString()];
    }
    return issue;
  });
}

function appendActivity(issue: any, action: string, userId: string, userName: string, meta?: string) {
  if (!Array.isArray(issue.activityLog)) issue.activityLog = [];
  issue.activityLog.push({ action, userId, userName, timestamp: new Date(), meta });
}

// ─── Routes ───────────────────────────────────────────────────────────────
export async function issueRoutes(fastify: FastifyInstance) {
  fastify.addHook('preValidation', authenticate);

  // ── 1. GET all issues (filters: projectId, sprintId, status, type, assigneeId) ──
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId, sprintId, workspaceId, type, status, assigneeId } = request.query as any;
      const activeWorkspaceId = workspaceId || request.user?.workspaceId || defaultWorkspaceId;
      const role = request.user?.role || 'DEVELOPER';

      let allowedProjectIds: string[] | null = null;
      if (!isLeadOrManager(role)) {
        const memberships = await ProjectMember.find({ userId: request.user?.id }).lean();
        allowedProjectIds = memberships.map((m: any) => m.projectId);
      }

      const filter: any = { workspaceId: activeWorkspaceId };

      // Non-leads see only their own tasks
      if (!isLeadOrManager(role)) {
        filter.assigneeId = request.user?.id;
      }

      if (allowedProjectIds) {
        if (projectId) {
          if (!allowedProjectIds.includes(projectId)) {
            return reply.code(403).send({ error: 'Access denied to this project' });
          }
          filter.projectId = projectId;
        } else {
          filter.projectId = { $in: allowedProjectIds };
        }
      } else if (projectId) {
        filter.projectId = projectId;
      }

      if (sprintId) filter.sprintId = sprintId;
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (assigneeId) filter.assigneeId = assigneeId;

      const issues = await Issue.find(filter).sort({ createdAt: 1 }).lean();
      const populated = await populateAssignees(issues);
      return reply.code(200).send(populated);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch issues.', details: err.message });
    }
  });

  // ── 1b. GET ALL issues (Team Lead / Manager — no assignee filter) ──
  fastify.get('/all', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const role = request.user?.role || 'DEVELOPER';
      if (!isLeadOrManager(role)) {
        return reply.code(403).send({ error: 'Access denied. Requires Team Lead or Manager role.' });
      }

      const { projectId, sprintId, status, workspaceId } = request.query as any;
      const activeWorkspaceId = workspaceId || request.user?.workspaceId || defaultWorkspaceId;

      const filter: any = { workspaceId: activeWorkspaceId };
      if (projectId) filter.projectId = projectId;
      if (sprintId) filter.sprintId = sprintId;
      if (status) filter.status = status;

      const issues = await Issue.find(filter).sort({ createdAt: -1 }).lean();
      const populated = await populateAssignees(issues);
      return reply.code(200).send(populated);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch all issues.', details: err.message });
    }
  });

  // ── 2. GET single issue ──
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const issue = await Issue.findById(id).lean();
      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });
      if (!(await checkIssueAccess(request, (issue as any).projectId))) {
        return reply.code(403).send({ error: 'Access denied to this project' });
      }
      const [populated] = await populateAssignees([issue]);
      return reply.code(200).send(populated);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch issue.', details: err.message });
    }
  });

  // ── 3. CREATE a new issue ──
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      const title = String(body.title || '').trim();
      if (!title) return reply.code(400).send({ error: 'Issue title is required.' });
      if (!body.projectId) return reply.code(400).send({ error: 'Project ID is required.' });

      if (!(await checkIssueAccess(request, body.projectId))) {
        return reply.code(403).send({ error: 'Access denied to this project' });
      }

      const workspaceId = String(body.workspaceId || request.user?.workspaceId || defaultWorkspaceId).trim();
      const displayId = await getNextDisplayId(body.projectId);

      const creatorUser = await User.findById(request.user?.id).lean() as any;
      const creatorName = creatorUser?.name || request.user?.email || 'Team Lead';

      // Parse subtasks, requirements, acceptance criteria from body
      const subtasks = Array.isArray(body.subtasks)
        ? body.subtasks.map((s: any) => ({
            id: new Types.ObjectId().toHexString(),
            title: typeof s === 'string' ? s : s.title,
            completed: false
          }))
        : [];

      const requirements = Array.isArray(body.requirements)
        ? body.requirements.map((r: any) => ({
            id: new Types.ObjectId().toHexString(),
            text: typeof r === 'string' ? r : r.text,
            completed: false
          }))
        : [];

      const acceptanceCriteria = Array.isArray(body.acceptanceCriteria)
        ? body.acceptanceCriteria.map((c: any) => ({
            id: new Types.ObjectId().toHexString(),
            text: typeof c === 'string' ? c : c.text,
            completed: false
          }))
        : [];

      const activityLog = [{
        action: 'Task Created',
        userId: request.user?.id || 'system',
        userName: creatorName,
        timestamp: new Date()
      }];

      if (body.assigneeId) {
        const assigneeUser = await User.findById(body.assigneeId).lean() as any;
        activityLog.push({
          action: `Assigned to ${assigneeUser?.name || 'Developer'}`,
          userId: request.user?.id || 'system',
          userName: creatorName,
          timestamp: new Date()
        });
      }

      const issue = await Issue.create({
        workspaceId,
        displayId,
        projectId: body.projectId,
        sprintId: body.sprintId,
        epicId: body.epicId,
        title,
        description: body.description || '',
        status: body.status || 'TO_DO',
        priority: body.priority || 'MEDIUM',
        type: body.type || 'FEATURE',
        assigneeId: body.assigneeId,
        testerId: body.testerId,
        creatorId: request.user?.id || 'system',
        storyPoints: body.storyPoints,
        estimatedHours: body.estimatedHours,
        estimate: body.estimate,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        moduleName: body.moduleName,
        moduleId: body.moduleId,
        featureName: body.featureName,
        featureId: body.featureId,
        dependencies: body.dependencies || [],
        subtasks,
        requirements,
        acceptanceCriteria,
        activityLog,
      });

      // Notify assignee
      if (body.assigneeId && body.assigneeId !== request.user?.id) {
        await Notification.create({
          userId: body.assigneeId,
          title: 'New Task Assigned',
          message: `You have been assigned to: ${title} (${displayId})`,
          type: 'INFO'
        });
        const baseUrl = process.env.VITE_NEXUS_PM_URL || 'http://localhost:3050';
        notifyAssignment(
          body.assigneeId,
          'New Task Assigned',
          `You have been assigned to: ${title} (${displayId})`,
          `/tasks/${issue._id}`,
          `<div style="font-family:sans-serif;padding:20px"><h2>New Task: ${title}</h2><p>Priority: ${body.priority || 'MEDIUM'}</p><a href="${baseUrl}/w/forge-india-connect/dashboard/member?tab=MyTasks">View Task</a></div>`
        );
      }

      return reply.code(201).send({ ...issue.toObject(), id: issue._id });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to create issue.', details: err.message });
    }
  });

  // ── 4. UPDATE an issue ──
  fastify.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const body = request.body as any;

      const existingIssue = await Issue.findById(id).lean() as any;
      if (!existingIssue) return reply.code(404).send({ error: 'Issue not found.' });
      if (!(await checkIssueAccess(request, existingIssue.projectId))) {
        return reply.code(403).send({ error: 'Access denied to this project' });
      }

      // Build safe update object
      const allowed = [
        'title', 'description', 'status', 'priority', 'type',
        'assigneeId', 'testerId', 'sprintId', 'epicId',
        'storyPoints', 'estimatedHours', 'estimate',
        'dueDate', 'startDate',
        'moduleName', 'moduleId', 'featureName', 'featureId',
        'reviewComment', 'testComment', 'dependencies',
        'blockerInfo'
      ];
      const updateFields: any = { updatedAt: new Date() };
      for (const key of allowed) {
        if (body[key] !== undefined) {
          updateFields[key] = (key === 'dueDate' || key === 'startDate') && body[key]
            ? new Date(body[key]) : body[key];
        }
      }

      const issue = await Issue.findByIdAndUpdate(id, updateFields, { new: true });
      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });

      // Notify re-assignment
      if (body.assigneeId && body.assigneeId !== existingIssue.assigneeId) {
        await Notification.create({
          userId: body.assigneeId,
          title: 'Task Assigned',
          message: `You have been assigned to task: ${existingIssue.title}`,
          type: 'INFO'
        });
      }

      return reply.code(200).send({ ...issue.toObject(), id: issue._id });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to update issue.', details: err.message });
    }
  });

  // ── 5. DELETE an issue ──
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const existingIssue = await Issue.findById(id).lean() as any;
      if (!existingIssue) return reply.code(404).send({ error: 'Issue not found.' });
      if (!(await checkIssueAccess(request, existingIssue.projectId))) {
        return reply.code(403).send({ error: 'Access denied to this project' });
      }
      await Issue.findByIdAndDelete(id);
      await Comment.deleteMany({ issueId: id });
      return reply.code(200).send({ message: 'Issue deleted successfully.' });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to delete issue.', details: err.message });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  //  WORKFLOW ACTIONS
  // ════════════════════════════════════════════════════════════════════════

  // ── 6. START task (TO_DO → IN_PROGRESS) — Developer ──
  fastify.post('/:id/start', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const issue = await Issue.findById(id);
      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });

      if (issue.status !== 'TO_DO') {
        return reply.code(400).send({ error: `Cannot start a task with status "${issue.status}". Task must be in TO_DO.` });
      }

      const user = await User.findById(request.user?.id).lean() as any;
      const userName = user?.name || request.user?.email || 'Developer';

      appendActivity(issue, 'Task Started', request.user?.id!, userName);
      issue.status = 'IN_PROGRESS';
      issue.startedAt = new Date();
      issue.updatedAt = new Date();
      await issue.save();

      await Notification.create({
        userId: issue.creatorId,
        title: 'Task Started',
        message: `${userName} started task: ${issue.title}`,
        type: 'INFO'
      });

      return reply.code(200).send({ ...issue.toObject(), id: issue._id });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to start task.', details: err.message });
    }
  });

  // ── 7. SUBMIT FOR REVIEW (IN_PROGRESS → CODE_REVIEW) — Developer ──
  fastify.post('/:id/submit-review', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const issue = await Issue.findById(id);
      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });

      if (issue.status !== 'IN_PROGRESS') {
        return reply.code(400).send({ error: `Cannot submit for review from status "${issue.status}". Task must be In Progress.` });
      }

      const user = await User.findById(request.user?.id).lean() as any;
      const userName = user?.name || request.user?.email || 'Developer';

      appendActivity(issue, 'Submitted for Code Review', request.user?.id!, userName);
      issue.status = 'CODE_REVIEW';
      issue.reviewComment = undefined;  // clear previous review comment
      issue.updatedAt = new Date();
      await issue.save();

      // Notify team lead / creator
      await Notification.create({
        userId: issue.creatorId,
        title: 'Task Ready for Review',
        message: `${userName} submitted "${issue.title}" for code review`,
        type: 'INFO'
      });

      return reply.code(200).send({ ...issue.toObject(), id: issue._id });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to submit for review.', details: err.message });
    }
  });

  // ── 8. APPROVE review (CODE_REVIEW → TESTING) — Team Lead ──
  fastify.post('/:id/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const role = request.user?.role || '';
      if (!isLeadOrManager(role)) {
        return reply.code(403).send({ error: 'Only Team Leads or Managers can approve tasks.' });
      }

      const { id } = request.params as any;
      const issue = await Issue.findById(id);
      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });

      if (issue.status !== 'CODE_REVIEW') {
        return reply.code(400).send({ error: `Cannot approve from status "${issue.status}". Task must be in Code Review.` });
      }

      const user = await User.findById(request.user?.id).lean() as any;
      const userName = user?.name || request.user?.email || 'Team Lead';

      appendActivity(issue, 'Code Review Approved', request.user?.id!, userName);
      issue.status = 'TESTING';
      issue.reviewComment = undefined;
      issue.updatedAt = new Date();
      await issue.save();

      // Notify developer
      if (issue.assigneeId) {
        await Notification.create({
          userId: issue.assigneeId,
          title: 'Code Review Approved',
          message: `Your task "${issue.title}" has been approved and moved to Testing`,
          type: 'INFO'
        });
      }
      // Notify tester if assigned
      if (issue.testerId) {
        await Notification.create({
          userId: issue.testerId,
          title: 'New Testing Task',
          message: `Task "${issue.title}" is ready for your testing`,
          type: 'INFO'
        });
      }

      return reply.code(200).send({ ...issue.toObject(), id: issue._id });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to approve task.', details: err.message });
    }
  });

  // ── 9. REQUEST CHANGES (CODE_REVIEW → IN_PROGRESS) — Team Lead ──
  fastify.post('/:id/request-changes', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const role = request.user?.role || '';
      if (!isLeadOrManager(role)) {
        return reply.code(403).send({ error: 'Only Team Leads or Managers can request changes.' });
      }

      const { id } = request.params as any;
      const { comment } = request.body as any;
      if (!comment || !String(comment).trim()) {
        return reply.code(400).send({ error: 'A comment is required when requesting changes.' });
      }

      const issue = await Issue.findById(id);
      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });

      if (issue.status !== 'CODE_REVIEW') {
        return reply.code(400).send({ error: `Cannot request changes from status "${issue.status}".` });
      }

      const user = await User.findById(request.user?.id).lean() as any;
      const userName = user?.name || request.user?.email || 'Team Lead';

      appendActivity(issue, 'Changes Requested', request.user?.id!, userName, comment);
      issue.status = 'IN_PROGRESS';
      issue.reviewComment = comment;
      issue.updatedAt = new Date();
      await issue.save();

      // Add comment to the comment thread
      await Comment.create({
        issueId: id,
        userId: request.user?.id,
        userName,
        content: `**Changes Requested:** ${comment}`
      });

      // Notify developer
      if (issue.assigneeId) {
        await Notification.create({
          userId: issue.assigneeId,
          title: 'Changes Requested',
          message: `${userName} requested changes on "${issue.title}": ${comment}`,
          type: 'WARNING'
        });
      }

      return reply.code(200).send({ ...issue.toObject(), id: issue._id });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to request changes.', details: err.message });
    }
  });

  // ── 10. TEST PASS (TESTING → DONE) — Tester / Lead ──
  fastify.post('/:id/test-pass', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const role = request.user?.role || '';
      if (!isLeadOrManager(role) && !isTester(role)) {
        return reply.code(403).send({ error: 'Only Testers or Team Leads can mark tasks as passed.' });
      }

      const { id } = request.params as any;
      const issue = await Issue.findById(id);
      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });

      if (issue.status !== 'TESTING') {
        return reply.code(400).send({ error: `Cannot pass test from status "${issue.status}". Task must be in Testing.` });
      }

      const user = await User.findById(request.user?.id).lean() as any;
      const userName = user?.name || request.user?.email || 'Tester';

      appendActivity(issue, 'Testing Passed', request.user?.id!, userName);
      issue.status = 'DONE';
      issue.testComment = undefined;
      issue.completedAt = new Date();
      issue.updatedAt = new Date();
      await issue.save();

      // Notify developer
      if (issue.assigneeId) {
        await Notification.create({
          userId: issue.assigneeId,
          title: 'Task Completed!',
          message: `Your task "${issue.title}" has passed testing and is now Completed! 🎉`,
          type: 'SUCCESS'
        });
      }

      return reply.code(200).send({ ...issue.toObject(), id: issue._id });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to pass test.', details: err.message });
    }
  });

  // ── 11. TEST FAIL (TESTING → IN_PROGRESS) — Tester / Lead ──
  fastify.post('/:id/test-fail', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const role = request.user?.role || '';
      if (!isLeadOrManager(role) && !isTester(role)) {
        return reply.code(403).send({ error: 'Only Testers or Team Leads can fail tests.' });
      }

      const { id } = request.params as any;
      const { comment } = request.body as any;
      if (!comment || !String(comment).trim()) {
        return reply.code(400).send({ error: 'A failure comment is required.' });
      }

      const issue = await Issue.findById(id);
      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });

      if (issue.status !== 'TESTING') {
        return reply.code(400).send({ error: `Cannot fail test from status "${issue.status}".` });
      }

      const user = await User.findById(request.user?.id).lean() as any;
      const userName = user?.name || request.user?.email || 'Tester';

      appendActivity(issue, 'Testing Failed', request.user?.id!, userName, comment);
      issue.status = 'IN_PROGRESS';
      issue.testComment = comment;
      issue.updatedAt = new Date();
      await issue.save();

      // Add comment
      await Comment.create({
        issueId: id,
        userId: request.user?.id,
        userName,
        content: `**Testing Failed:** ${comment}`
      });

      // Notify developer
      if (issue.assigneeId) {
        await Notification.create({
          userId: issue.assigneeId,
          title: 'Testing Failed',
          message: `"${issue.title}" failed testing: ${comment}`,
          type: 'ERROR'
        });
      }

      return reply.code(200).send({ ...issue.toObject(), id: issue._id });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to record test failure.', details: err.message });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  //  SUBTASK / REQUIREMENTS / ACCEPTANCE CRITERIA
  // ════════════════════════════════════════════════════════════════════════

  // ── 12. UPDATE subtasks ──
  fastify.patch('/:id/subtasks', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { subtasks } = request.body as any;

      const issue = await Issue.findById(id);
      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });

      issue.subtasks = subtasks;
      issue.updatedAt = new Date();
      await issue.save();

      const completed = subtasks.filter((s: any) => s.completed).length;
      return reply.code(200).send({ subtasks: issue.subtasks, progress: { completed, total: subtasks.length } });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to update subtasks.', details: err.message });
    }
  });

  // ── 13. UPDATE requirements ──
  fastify.patch('/:id/requirements', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { requirements } = request.body as any;

      const issue = await Issue.findById(id);
      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });

      issue.requirements = requirements;
      issue.updatedAt = new Date();
      await issue.save();

      return reply.code(200).send({ requirements: issue.requirements });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to update requirements.', details: err.message });
    }
  });

  // ── 14. UPDATE acceptance criteria ──
  fastify.patch('/:id/acceptance-criteria', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { acceptanceCriteria } = request.body as any;

      const issue = await Issue.findById(id);
      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });

      issue.acceptanceCriteria = acceptanceCriteria;
      issue.updatedAt = new Date();
      await issue.save();

      return reply.code(200).send({ acceptanceCriteria: issue.acceptanceCriteria });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to update acceptance criteria.', details: err.message });
    }
  });

  // ── 15. GET activity log ──
  fastify.get('/:id/activity', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const issue = await Issue.findById(id).lean() as any;
      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });
      return reply.code(200).send(issue.activityLog || []);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch activity.', details: err.message });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  //  COMMENTS (Real implementation)
  // ════════════════════════════════════════════════════════════════════════

  // ── 16. GET comments ──
  fastify.get('/:id/comments', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const comments = await Comment.find({ issueId: id }).sort({ createdAt: 1 }).lean();
      return reply.code(200).send(comments.map((c: any) => ({ ...c, id: c._id })));
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to fetch comments.', details: err.message });
    }
  });

  // ── 17. POST comment ──
  fastify.post('/:id/comments', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { content, parentId } = request.body as any;

      if (!content || !String(content).trim()) {
        return reply.code(400).send({ error: 'Comment content is required.' });
      }

      const user = await User.findById(request.user?.id).lean() as any;
      const userName = user?.name || request.user?.email || 'User';

      const comment = await Comment.create({
        issueId: id,
        userId: request.user?.id,
        userName,
        content: String(content).trim(),
        parentId
      });

      // Log activity
      await Issue.findByIdAndUpdate(id, {
        $push: {
          activityLog: {
            action: 'Comment Added',
            userId: request.user?.id,
            userName,
            timestamp: new Date(),
            meta: String(content).substring(0, 80)
          }
        },
        updatedAt: new Date()
      });

      return reply.code(201).send({ ...comment.toObject(), id: comment._id });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to add comment.', details: err.message });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  //  EXISTING ENDPOINTS (preserved)
  // ════════════════════════════════════════════════════════════════════════

  // ── 18. RAISE Blocker ──
  fastify.post('/:id/blocker', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { description } = request.body as any;

      const existingIssue = await Issue.findById(id).lean() as any;
      if (!existingIssue) return reply.code(404).send({ error: 'Issue not found.' });
      if (!(await checkIssueAccess(request, existingIssue.projectId))) {
        return reply.code(403).send({ error: 'Access denied to this project' });
      }

      const user = await User.findById(request.user?.id).lean() as any;
      const userName = user?.name || 'Developer';

      const issue = await Issue.findByIdAndUpdate(id, {
        status: 'BLOCKED',
        blockerInfo: {
          reason: description,
          raisedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        },
        $push: {
          activityLog: {
            action: 'Task Blocked',
            userId: request.user?.id,
            userName,
            timestamp: new Date(),
            meta: description
          }
        },
        updatedAt: new Date()
      }, { new: true });

      if (!issue) return reply.code(404).send({ error: 'Issue not found.' });
      return reply.code(200).send(issue);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to raise blocker.', details: err.message });
    }
  });

  // ── 19. UPDATE Estimate ──
  fastify.patch('/:id/estimate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { estimate } = request.body as any;

      const existingIssue = await Issue.findById(id).lean() as any;
      if (!existingIssue) return reply.code(404).send({ error: 'Issue not found.' });
      if (!(await checkIssueAccess(request, existingIssue.projectId))) {
        return reply.code(403).send({ error: 'Access denied to this project' });
      }

      const issue = await Issue.findByIdAndUpdate(id, { estimate, updatedAt: new Date() }, { new: true });
      return reply.code(200).send(issue);
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to update estimate.', details: err.message });
    }
  });

  // ── 20. BULK UPDATE ──
  fastify.patch('/bulk', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ids, ...updates } = request.body as any;
      if (!ids || !Array.isArray(ids)) return reply.code(400).send({ error: 'Missing ids array' });

      const role = (request.user?.role || 'DEVELOPER').toUpperCase().replace(/ /g, '_');
      if (!isLeadOrManager(role)) {
        const memberships = await ProjectMember.find({ userId: request.user?.id }).lean();
        const allowedProjectIds = memberships.map((m: any) => m.projectId);
        const issuesToUpdate = await Issue.find({ _id: { $in: ids } }).lean();
        for (const issue of issuesToUpdate) {
          if (!allowedProjectIds.includes((issue as any).projectId)) {
            return reply.code(403).send({ error: 'Access denied to some of the issues' });
          }
        }
      }

      await Issue.updateMany({ _id: { $in: ids } }, { $set: { ...updates, updatedAt: new Date() } });
      return reply.code(200).send({ message: 'Issues updated successfully' });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to bulk update issues', details: err.message });
    }
  });

  // ── 21. BULK DELETE ──
  fastify.post('/bulk-delete', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ids } = request.body as any;
      if (!ids || !Array.isArray(ids)) return reply.code(400).send({ error: 'Missing ids array' });

      const role = (request.user?.role || 'DEVELOPER').toUpperCase().replace(/ /g, '_');
      if (!isLeadOrManager(role)) {
        const memberships = await ProjectMember.find({ userId: request.user?.id }).lean();
        const allowedProjectIds = memberships.map((m: any) => m.projectId);
        const issuesToDelete = await Issue.find({ _id: { $in: ids } }).lean();
        for (const issue of issuesToDelete) {
          if (!allowedProjectIds.includes((issue as any).projectId)) {
            return reply.code(403).send({ error: 'Access denied to some of the issues' });
          }
        }
      }

      await Issue.deleteMany({ _id: { $in: ids } });
      return reply.code(200).send({ message: 'Issues deleted successfully' });
    } catch (err: any) {
      return reply.code(500).send({ error: 'Failed to bulk delete issues', details: err.message });
    }
  });

  // ── 22. GET issue links (preserved mock) ──
  fastify.get('/:id/links', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send({ linksTo: [], linksFrom: [] });
  });

  // ── 23. GET time entries (preserved mock) ──
  fastify.get('/:id/time', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send([]);
  });
}
