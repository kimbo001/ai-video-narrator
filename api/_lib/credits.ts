// api/_lib/credits.ts
import { prisma } from './prisma.js';

/**
 * Checks balance and deducts credits in one transaction.
 * 1 credit = 1 character.
 */
export async function checkAndDeductCredits(userId: string, scriptText: string) {
  const characterCount = scriptText.length;

  // Use an interactive transaction to ensure data integrity
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) throw new Error("User not found");

    if (user.credits < characterCount) {
      throw new Error(`Insufficient credits. You need ${characterCount} characters but only have ${user.credits}.`);
    }

    // 1. Deduct credits from user
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: characterCount } }
    });

    // 2. Log the generation
    const generation = await tx.generation.create({
      data: {
        userId: userId,
        characterCount: characterCount
      }
    });

    return { updatedUser, generation };
  });
}
