// api/_lib/statsService.ts
// ⚠️ THE FIX: Ensure you have curly braces and the .js extension
import { prisma } from './prisma.js'; 

export async function bumpVideoCounter() {
  try {
    // This line was likely crashing because 'prisma' was undefined
    return await prisma.user.updateMany({
      where: { plan: 'PRO' }, // or whatever your stats logic is
      data: { 
        // ... your update logic
      }
    });
  } catch (error) {
    console.error("Stats Error:", error);
  }
}

// If you have a general stats table, it might look like this:
export async function bumpGlobalStats() {
    // Use the shared prisma instance
    // await prisma.stats.update(...)
}
