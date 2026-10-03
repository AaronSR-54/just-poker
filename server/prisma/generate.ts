import { execSync } from 'child_process';
console.log('Generating Prisma client...');
execSync('npx prisma generate', { stdio: 'inherit' });
console.log('Prisma client generated.');
