#!/usr/bin/env node

import { execSync } from 'child_process';

const PORT = process.env.PORT || 3000;

try {
  // Find processes using the port
  const result = execSync(`lsof -ti:${PORT}`, { encoding: 'utf-8', stdio: 'pipe' });
  const pids = result.trim().split('\n').filter(Boolean);
  
  if (pids.length > 0) {
    console.log(`🔧 Freeing port ${PORT}...`);
    pids.forEach(pid => {
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
        console.log(`   ✓ Killed process ${pid}`);
      } catch (error) {
        // Process might already be dead
      }
    });
    console.log(`✅ Port ${PORT} is now free\n`);
  } else {
    console.log(`✅ Port ${PORT} is already free\n`);
  }
} catch (error) {
  // No process using the port
  console.log(`✅ Port ${PORT} is already free\n`);
}

