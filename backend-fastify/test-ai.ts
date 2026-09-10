import mongoose from 'mongoose';
import { aiService } from './src/services/aiService';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexus-zoom');
    console.log('Connected to Mongo');
    
    // We just need some dummy requirements to test the AI service
    const rawReqs = `
Build a College ERP system.

Roles: Student, Faculty, Admin

Student features:
- Student registration
- Student login
- View attendance
- View exam results
- View fee details

Faculty features:
- Faculty login
- Mark attendance
- Enter marks
- Schedule exams

Admin features:
- Admin login
- Manage students
- Manage courses
- Generate reports
    `;
    
    console.log('Calling AI Service...');
    const result = await aiService.analyzeRequirements(rawReqs, 40, []);
    console.log('Success!', Object.keys(result));
    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  }
}

run();
