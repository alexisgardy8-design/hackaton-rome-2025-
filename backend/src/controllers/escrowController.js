import { PrismaClient } from '@prisma/client';
import { finishEscrow, verifyEscrowTransaction } from '../lib/escrowUtils.js';
import { getPlatformWallet } from '../lib/xrplClient.js';

const prisma = new PrismaClient();

/**
 * Release escrows for a campaign when it reaches 100%
 * POST /api/escrows/release/:campaignId
 * @access Private (STARTUP only - campaign owner)
 */
export const releaseCampaignEscrows = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user.id;

    // Find campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        creator: true
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    // Check ownership
    if (campaign.creatorId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only campaign owner can release escrows'
      });
    }

    // Check if campaign reached 100%
    const percentageFunded = (parseFloat(campaign.currentAmount) / parseFloat(campaign.goalAmount)) * 100;
    
    if (percentageFunded < 100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Campaign has only reached ${percentageFunded.toFixed(2)}%. Escrows can only be released when campaign reaches 100%.`
      });
    }

    // Get all investments with escrows for this campaign
    const investments = await prisma.investment.findMany({
      where: {
        campaignId,
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
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No escrows to release for this campaign'
      });
    }

    const platformSeed = process.env.XRPL_PLATFORM_SEED;
    if (!platformSeed) {
      return res.status(500).json({
        error: 'Server Error',
        message: 'XRPL_PLATFORM_SEED not configured'
      });
    }

    const results = [];
    const errors = [];

    // Release each escrow
    for (const investment of investments) {
      try {
        // Get investor wallet address
        let investorAddress = investment.investor.walletAddress;
        
        // If no wallet address in user profile, get it from the escrow transaction
        if (!investorAddress && investment.transactionHash) {
          try {
            const escrowDetails = await verifyEscrowTransaction(investment.transactionHash);
            investorAddress = escrowDetails.account; // Account that created the escrow
          } catch (error) {
            errors.push({
              investmentId: investment.id,
              error: `Could not get investor address: ${error.message}`
            });
            continue;
          }
        }
        
        if (!investorAddress) {
          errors.push({
            investmentId: investment.id,
            error: 'Investor has no wallet address'
          });
          continue;
        }

        // Finish the escrow using the preimage
        const result = await finishEscrow(
          platformSeed,
          investorAddress,
          investment.escrowSequence,
          investment.escrowCondition,
          investment.escrowPreimage
        );

        // Update investment to mark escrow as finished
        await prisma.investment.update({
          where: { id: investment.id },
          data: {
            escrowFinished: true,
            finishedAt: new Date()
          }
        });

        results.push({
          investmentId: investment.id,
          transactionHash: result.hash,
          success: true
        });

        console.log(`✅ Escrow released for investment ${investment.id}`);
      } catch (error) {
        console.error(`❌ Failed to release escrow for investment ${investment.id}:`, error.message);
        errors.push({
          investmentId: investment.id,
          error: error.message
        });
      }
    }

    // Update campaign status to FUNDED if all escrows were released
    if (errors.length === 0 && campaign.status === 'ACTIVE') {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'FUNDED' }
      });
    }

    res.json({
      message: `Released ${results.length} escrow(s) for campaign ${campaignId}`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: investments.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check and release escrows for campaigns that reached 100%
 * This can be called periodically or manually
 * POST /api/escrows/check-and-release
 * @access Private (Admin or automated)
 */
export const checkAndReleaseEscrows = async (req, res, next) => {
  try {
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
      return res.json({
        message: 'No campaigns reached 100%',
        campaignsChecked: campaigns.length,
        campaignsReleased: 0
      });
    }

    const platformSeed = process.env.XRPL_PLATFORM_SEED;
    if (!platformSeed) {
      return res.status(500).json({
        error: 'Server Error',
        message: 'XRPL_PLATFORM_SEED not configured'
      });
    }

    const results = [];

    for (const campaign of campaignsToRelease) {
      try {
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
          continue;
        }

        let released = 0;
        let failed = 0;

        // Release each escrow
        for (const investment of investments) {
          try {
            let investorAddress = investment.investor.walletAddress;
            
            if (!investorAddress && investment.transactionHash) {
              try {
                const escrowDetails = await verifyEscrowTransaction(investment.transactionHash);
                investorAddress = escrowDetails.account;
              } catch (error) {
                failed++;
                continue;
              }
            }
            
            if (!investorAddress) {
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

            released++;
          } catch (error) {
            failed++;
            console.error(`Failed to release escrow for investment ${investment.id}:`, error.message);
          }
        }

        // Update campaign status if all escrows were released
        if (failed === 0 && investments.length > 0) {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: 'FUNDED' }
          });
        }

        results.push({
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          escrowsReleased: released,
          escrowsFailed: failed,
          totalEscrows: investments.length
        });
      } catch (error) {
        console.error(`Error processing campaign ${campaign.id}:`, error);
        results.push({
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          error: error.message
        });
      }
    }

    res.json({
      message: `Checked ${campaigns.length} campaigns, released escrows for ${campaignsToRelease.length} campaign(s)`,
      campaignsChecked: campaigns.length,
      campaignsReleased: campaignsToRelease.length,
      results
    });
  } catch (error) {
    next(error);
  }
};

