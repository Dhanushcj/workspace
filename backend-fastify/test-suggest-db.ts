import mongoose from 'mongoose';
import 'dotenv/config';
import { Project } from './src/models/Project';
import { aiService } from './src/services/aiService';

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/forge-india-connect');
  console.log('Connected to Mongo');
  
  const projects = await Project.find({});
  const project = projects.find(p => p.requirements && p.requirements.length > 10);
  
  if (!project) {
    console.log('No projects with requirements found');
    await mongoose.disconnect();
    process.exit(1);
  }
  
  console.log('Testing with project:', project.name);
  
  try {
    const result = await aiService.suggestProjectPlan(project.requirements || '');
    console.log('Success!', result.substring(0, 100));
  } catch (err: any) {
    console.error('Error:', err.message);
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

run();
