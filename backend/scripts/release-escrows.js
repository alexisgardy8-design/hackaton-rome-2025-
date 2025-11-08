#!/usr/bin/env node

/**
 * Script to automatically release escrows for campaigns that reached 100%
 * This can be run periodically (e.g., via cron) or manually
 */

import { PrismaClient } from '@prisma/client';
import { finishEscrow, verifyEscrowTransaction } from '../src/lib/escrowUtils.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function releaseEscrowsForCampaigns() {
  try {
    console.log('🔍 Checking campaigns for escrow release...');

    // Find all active campaigns that reached 100%
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE'
      }
    });

    const campaignsToRelease = campaigns.filter(campaign => {
      const percentageFunded = (parseFloat(campaign.currentAmount) / parseFloat(campaign.goalAmount)) * 100;
      return percentageFunded >= 100;
    });

    if (campaignsToRelease.length === 0) {
      console.log('✅ No campaigns reached 100%');
      return;
    }

    console.log(`📊 Found ${campaignsToRelease.length} campaign(s) that reached 100%`);

    const platformSeed = process.env.XRPL_PLATFORM_SEED;
    if (!platformSeed) {
      throw new Error('XRPL_PLATFORM_SEED not configured');
    }

    for (const campaign of campaignsToRelease) {
      console.log(`\n🎯 Processing campaign: ${campaign.title} (${campaign.id})`);

      // Get all investments with escrows for this campaign
      const investments = await prisma.investment.findMany({
        where: {
          campaignId: campaign.id,
          escrowSequence: { not: null },
          escrowCondition: { not: null },
          escrowPreimage: { not: null },
          escrowFinished: false
        },
        include: {
          investor: {
            select: {
              walletAddress: true
            }
          }
        }
      });

      if (investments.length === 0) {
        console.log(`   ℹ️  No escrows to release`);
        continue;
      }

      console.log(`   🔓 Releasing ${investments.length} escrow(s)...`);

      let released = 0;
      let failed = 0;

      for (const investment of investments) {
        try {
          let investorAddress = investment.investor.walletAddress;
          
          if (!investorAddress && investment.transactionHash) {
            try {
              const escrowDetails = await verifyEscrowTransaction(investment.transactionHash);
              investorAddress = escrowDetails.account;
            } catch (error) {
              console.error(`   ❌ Could not get investor address: ${error.message}`);
              failed++;
              continue;
            }
          }
          
          if (!investorAddress) {
            console.warn(`   ⚠️  Investor has no wallet address, skipping`);
            failed++;
            continue;
          }

          const result = await finishEscrow(
            platformSeed,
            investorAddress,
            investment.escrowSequence,
            investment.escrowCondition,
            investment.escrowPreimage
          );

          await prisma.investment.update({
            where: { id: investment.id },
            data: {
              escrowFinished: true,
              finishedAt: new Date()
            }
          });

          console.log(`   ✅ Escrow released: ${result.hash}`);
          released++;
        } catch (error) {
          console.error(`   ❌ Failed to release escrow: ${error.message}`);
          failed++;
        }
      }

      // Update campaign status if all escrows were released
      if (failed === 0 && investments.length > 0) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'FUNDED' }
        });
        console.log(`   ✅ Campaign status updated to FUNDED`);
      }

      console.log(`   📊 Summary: ${released} released, ${failed} failed`);
    }

    console.log('\n✅ Escrow release process completed');
  } catch (error) {
    console.error('❌ Error releasing escrows:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Run the script
releaseEscrowsForCampaigns().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

