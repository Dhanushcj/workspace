const fs = require('fs');
let data = fs.readFileSync('src/services/aiService.ts', 'utf8');

// Replace the rules completely
const startStr = '3. Prefix Module names with their sequence';
const endStr = '5. TASK TITLES MUST BE EXTREMELY DETAILED. For example, instead of "Create member dashboard", use "1.3 Create Member Dashboard layout with Sidebar (Home, Profile, Settings) and top navbar".';

const startIndex = data.indexOf(startStr);
const endIndex = data.indexOf(endStr) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  const newRules = `3. DO NOT prefix Module names or Task titles with numbers. Just provide descriptive names (e.g. "Authentication", "Create User table").
  4. TASK TITLES MUST BE EXTREMELY DETAILED. For example, instead of "Create member dashboard", use "Create Member Dashboard layout with Sidebar (Home, Profile, Settings) and top navbar".
  12. FEATURE EXTRAPOLATION: The customer requirements might be brief (e.g. "Gym Dashboard - Analytics"). You MUST logically infer and generate the full suite of expected standard features for that module. Do not limit yourself strictly to the short text provided.`;
  
  data = data.substring(0, startIndex) + newRules + data.substring(endIndex);
  fs.writeFileSync('src/services/aiService.ts', data);
  console.log('Successfully updated rules!');
} else {
  console.log('Could not find rules string.');
}
