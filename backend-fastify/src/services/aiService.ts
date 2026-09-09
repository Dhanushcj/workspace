import { GoogleGenerativeAI } from '@google/generative-ai';

export const aiService = {
  async analyzeRequirements(requirements: string, sprintCapacity: number = 40) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in backend environment variables.");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are an expert Scrum Master.
Analyze the following project requirements and generate a detailed Sprint & Task Plan.
Return ONLY valid JSON, with NO markdown wrapping or code blocks (i.e. strictly start with { and end with }).

REQUIREMENTS:
${requirements}

SPRINT CAPACITY:
Assume a maximum team capacity of ${sprintCapacity} story points per sprint. Group stories into sprints such that no sprint exceeds this capacity. If the remaining stories exceed capacity, add more sprints.

INSTRUCTIONS:
1. Identify Epics (logical modules).
2. For each Epic, write User Stories with proper Agile format (As a X, I want Y so that Z).
3. For each User Story, provide Acceptance Criteria (array of clear, testable statements) and identify dependencies (array of story IDs if any).
4. For each User Story, generate technically meaningful implementation Tasks. Avoid micro-tasks (like "create file"). Assign each task a category (e.g. Frontend, Backend, Database, API, UI/UX, Testing).
5. Suggest Fibonacci Story Points (1, 2, 3, 5, 8, 13) for each Task and sum them up for the Story. Explain the points in assigneeReason/description if helpful.
6. Group the User Stories into logical Sprints with a goal. The total story points per sprint should be <= ${sprintCapacity}.
7. Generate unique IDs (e.g., "epic-1", "story-1", "task-1") for every item so we can link dependencies.

JSON STRUCTURE TO RETURN EXACTLY:
{
  "projectSummary": "Brief summary",
  "assumptions": ["Assumption 1"],
  "clarifications": ["Clarification 1"],
  "epics": [
    {
      "id": "epic-1",
      "name": "Epic Name",
      "description": "Epic description",
      "priority": "HIGH",
      "stories": [
        {
          "id": "story-1",
          "title": "Story Title",
          "userStory": "As a...",
          "description": "Description",
          "storyPoints": 5,
          "priority": "HIGH",
          "acceptanceCriteria": ["Criterion 1"],
          "dependencies": [],
          "tasks": [
            {
              "id": "task-1",
              "title": "Task title",
              "description": "Description",
              "category": "Backend",
              "storyPoints": 3,
              "priority": "HIGH",
              "suggestedAssignee": "",
              "assigneeReason": "Reason"
            }
          ]
        }
      ]
    }
  ],
  "sprints": [
    {
      "id": "sprint-1",
      "name": "Sprint 1",
      "goal": "Sprint Goal",
      "storyIds": ["story-1"],
      "totalStoryPoints": 5
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  },

  async regenerateItem(itemId: string, itemType: string, context: any, promptAddition: string) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are an expert Agile Project Manager.
Regenerate a single ${itemType} based on the following context.
Return ONLY valid JSON for the item, no markdown.

CURRENT ITEM CONTEXT:
${JSON.stringify(context, null, 2)}

USER INSTRUCTION:
${promptAddition}

If it's a Task, return:
{
  "id": "keep-same-id",
  "title": "",
  "description": "",
  "category": "",
  "storyPoints": 0,
  "priority": "",
  "suggestedAssignee": "",
  "assigneeReason": ""
}

If it's a Story, return:
{
  "id": "keep-same-id",
  "title": "",
  "userStory": "",
  "description": "",
  "storyPoints": 0,
  "priority": "",
  "acceptanceCriteria": [],
  "dependencies": [],
  "tasks": [...]
}
`;
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  }
};
