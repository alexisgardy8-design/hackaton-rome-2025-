import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { verifyTransaction, getPlatformWallet } from '../lib/xrplClient.js';
import { verifyEscrowTransaction, finishEscrow } from '../lib/escrowUtils.js';

const prisma = new PrismaClient();

// Platform wallet address for testnet
let PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY';

// Try to get the actual platform wallet address from seed
try {
  const wallet = getPlatformWallet();
  PLATFORM_WALLET = wallet.address;
} catch (error) {
  console.warn('⚠️  Using default platform wallet address. Set XRPL_PLATFORM_SEED for actual wallet.');
}

/**
 * Validation rules for investment intent
 */
export const investValidation = [
  body('campaignId')
    .notEmpty()
    .withMessage('Campaign ID is required'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1')
];

/**
 * Validation rules for investment confirmation
 */
export const confirmInvestmentValidation = [
  body('investmentId')
    .notEmpty()
    .withMessage('Investment ID is required'),
  body('transactionHash')
    .notEmpty()
    .withMessage('Transaction hash is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Transaction hash must be 64 characters'),
  body('escrowSequence')
    .optional()
    .isInt()
    .withMessage('Escrow sequence must be an integer'),
  body('escrowCondition')
    .optional()
    .isString()
    .withMessage('Escrow condition must be a string'),
  body('escrowPreimage')
    .optional()
    .isString()
    .withMessage('Escrow preimage must be a string')
];

/**
 * Release all escrows for a campaign when it reaches 100%
 * @param {string} campaignId - Campaign ID
 */
const releaseCampaignEscrows = async (campaignId) => {
  try {
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
      console.log(`ℹ️  No escrows to release for campaign ${campaignId}`);
      return;
    }

    console.log(`🔓 Releasing ${investments.length} escrow(s) for campaign ${campaignId}...`);

    const platformWallet = getPlatformWallet();
    const platformSeed = process.env.XRPL_PLATFORM_SEED;

    if (!platformSeed) {
      throw new Error('XRPL_PLATFORM_SEED not configured');
    }

    // Release each escrow
    for (const investment of investments) {
      try {
        // Get investor wallet address from the escrow transaction
        // Query the escrow transaction to get the owner (Account field)
        let investorAddress = investment.investor.walletAddress;
        
        // If no wallet address in user profile, get it from the escrow transaction
        if (!investorAddress && investment.transactionHash) {
          try {
            const escrowDetails = await verifyEscrowTransaction(investment.transactionHash);
            investorAddress = escrowDetails.account; // Account that created the escrow
          } catch (error) {
            console.warn(`⚠️  Could not get investor address from escrow transaction: ${error.message}`);
          }
        }
        
        if (!investorAddress) {
          console.warn(`⚠️  Investor ${investment.investorId} has no wallet address, skipping escrow release`);
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

        console.log(`✅ Escrow released for investment ${investment.id}`);
        console.log(`   Transaction hash: ${result.hash}`);
      } catch (error) {
        console.error(`❌ Failed to release escrow for investment ${investment.id}:`, error.message);
        // Continue with other escrows even if one fails
      }
    }

    console.log(`✅ Finished releasing escrows for campaign ${campaignId}`);
  } catch (error) {
    console.error('❌ Error in releaseCampaignEscrows:', error);
    throw error;
  }
};

/**
 * Create investment intent
 * POST /api/investments/invest
 * @access Private (INVESTOR only)
 */
export const createInvestmentIntent = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        errors: errors.array()
      });
    }

    // Check if user is an investor
    if (req.user.role !== 'INVESTOR') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only investors can make investments'
      });
    }

    const { campaignId, amount } = req.body;

    // Check if campaign exists and is active
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'ACTIVE') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Campaign is not active'
      });
    }

    // Check if campaign has ended
    if (new Date() > new Date(campaign.endDate)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Campaign has ended'
      });
    }

    // Check if goal has been reached
    if (campaign.currentAmount >= campaign.goalAmount) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Campaign goal has been reached'
      });
    }

    // Create investment record (pending confirmation)
    const investment = await prisma.investment.create({
      data: {
        amount: parseFloat(amount),
        investorId: req.user.id,
        campaignId,
        transactionHash: null // Will be set on confirmation
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            goalAmount: true,
            currentAmount: true
          }
        },
        investor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Investment intent created successfully',
      investment,
      depositAddress: PLATFORM_WALLET,
      instructions: {
        step1: 'Send exactly the investment amount to the deposit address',
        step2: 'Copy the transaction hash from XRPL',
        step3: 'Call POST /api/investments/confirm with the transaction hash',
        note: 'Your investment will be confirmed once the transaction is verified'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm investment with transaction hash
 * POST /api/investments/confirm
 * @access Private (INVESTOR only)
 */
export const confirmInvestment = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        errors: errors.array()
      });
    }

    const { investmentId, transactionHash } = req.body;

    // Find investment
    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        campaign: true,
        investor: {
          select: {
            id: true,
            walletAddress: true
          }
        }
      }
    });

    if (!investment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Investment not found'
      });
    }

    // Check ownership
    if (investment.investorId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only confirm your own investments'
      });
    }

    // Check if already confirmed
    if (investment.transactionHash) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Investment already confirmed'
      });
    }

    // PHASE 3: Verify transaction on XRPL Testnet (escrow or payment)
    const { escrowSequence, escrowCondition, escrowPreimage, investorAddress } = req.body;
    const isEscrow = !!escrowSequence && !!escrowCondition && !!escrowPreimage;
    
    // Update investor's wallet address if provided
    if (investorAddress && !investment.investor.walletAddress) {
      await prisma.user.update({
        where: { id: investment.investorId },
        data: { walletAddress: investorAddress }
      });
    }
    
    console.log(`🔍 Verifying ${isEscrow ? 'escrow' : 'payment'} transaction ${transactionHash} on XRPL...`);
    
    let txDetails;
    try {
      if (isEscrow) {
        txDetails = await verifyEscrowTransaction(transactionHash);
      } else {
        txDetails = await verifyTransaction(transactionHash);
      }
    } catch (error) {
      return res.status(400).json({
        error: 'Transaction Verification Failed',
        message: 'Unable to verify transaction on XRPL',
        details: error.message
      });
    }

    // Check if transaction was found and validated
    if (!txDetails.verified) {
      return res.status(400).json({
        error: 'Transaction Not Verified',
        message: txDetails.message || 'Transaction not found or not validated on XRPL'
      });
    }

    // Check if transaction was successful
    if (!txDetails.success) {
      return res.status(400).json({
        error: 'Transaction Failed',
        message: `Transaction found but failed with result: ${txDetails.result}`
      });
    }

    // Verify transaction type
    if (isEscrow && txDetails.transactionType !== 'EscrowCreate') {
      return res.status(400).json({
        error: 'Invalid Transaction Type',
        message: `Expected EscrowCreate transaction, got ${txDetails.transactionType}`
      });
    } else if (!isEscrow && txDetails.transactionType !== 'Payment') {
      return res.status(400).json({
        error: 'Invalid Transaction Type',
        message: `Expected Payment transaction, got ${txDetails.transactionType}`
      });
    }

    // Verify destination is platform wallet
    if (txDetails.destination !== PLATFORM_WALLET) {
      return res.status(400).json({
        error: 'Invalid Destination',
        message: `${isEscrow ? 'Escrow' : 'Payment'} must be sent to platform wallet: ${PLATFORM_WALLET}`
      });
    }

    // Verify amount matches (with small tolerance for fees)
    const expectedAmount = parseFloat(investment.amount);
    const actualAmount = parseFloat(txDetails.amount);
    const tolerance = 0.01; // 0.01 XRP tolerance

    if (Math.abs(actualAmount - expectedAmount) > tolerance) {
      return res.status(400).json({
        error: 'Amount Mismatch',
        message: `Expected ${expectedAmount} XRP, but transaction was for ${actualAmount} XRP`
      });
    }

    console.log(`✅ ${isEscrow ? 'Escrow' : 'Transaction'} verified successfully`);
    console.log(`   Amount: ${actualAmount} XRP`);
    console.log(`   From: ${txDetails.account}`);
    console.log(`   To: ${txDetails.destination}`);
    if (isEscrow) {
      console.log(`   Condition: ${txDetails.condition}`);
      console.log(`   FinishAfter: ${new Date(txDetails.finishAfter * 1000).toISOString()}`);
    }

    // Update investment with transaction hash and escrow data
    const updateData = {
      transactionHash,
    };
    
    if (isEscrow) {
      updateData.escrowSequence = escrowSequence;
      updateData.escrowCondition = escrowCondition;
      updateData.escrowPreimage = escrowPreimage;
    }
    
    const updatedInvestment = await prisma.investment.update({
      where: { id: investmentId },
      data: updateData
    });

    // Update campaign's current amount
    const updatedCampaign = await prisma.campaign.update({
      where: { id: investment.campaignId },
      data: {
        currentAmount: {
          increment: investment.amount
        }
      }
    });

    // Check if campaign reached 100% and release escrows if needed
    const percentageFunded = (parseFloat(updatedCampaign.currentAmount) / parseFloat(updatedCampaign.goalAmount)) * 100;
    
    if (percentageFunded >= 100 && updatedCampaign.status === 'ACTIVE') {
      console.log(`🎯 Campaign ${updatedCampaign.id} reached 100%! Releasing escrows...`);
      
      // Release all escrows for this campaign
      try {
        await releaseCampaignEscrows(updatedCampaign.id);
      } catch (error) {
        console.error('❌ Error releasing escrows:', error);
        // Don't fail the investment confirmation if escrow release fails
      }
      
      // Update campaign status to FUNDED
      await prisma.campaign.update({
        where: { id: updatedCampaign.id },
        data: { status: 'FUNDED' }
      });
    }

    res.json({
      message: 'Investment confirmed successfully',
      investment: updatedInvestment,
      transaction: {
        hash: txDetails.hash,
        amount: txDetails.amount,
        from: txDetails.account,
        to: txDetails.destination,
        validated: txDetails.validated,
        ledgerIndex: txDetails.ledgerIndex
      },
      campaign: {
        id: updatedCampaign.id,
        title: updatedCampaign.title,
        currentAmount: updatedCampaign.currentAmount,
        goalAmount: updatedCampaign.goalAmount,
        percentageFunded: ((updatedCampaign.currentAmount / updatedCampaign.goalAmount) * 100).toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all investments (for logged in user)
 * GET /api/investments
 * @access Private
 */
export const getMyInvestments = async (req, res, next) => {
  try {
    const investments = await prisma.investment.findMany({
      where: {
        investorId: req.user.id
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            status: true,
            goalAmount: true,
            currentAmount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    res.json({
      investments,
      summary: {
        totalInvestments: investments.length,
        totalInvested: totalInvested.toFixed(2),
        confirmedInvestments: investments.filter(inv => inv.transactionHash).length,
        pendingInvestments: investments.filter(inv => !inv.transactionHash).length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get investment by ID
 * GET /api/investments/:id
 * @access Private
 */
export const getInvestmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const investment = await prisma.investment.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            goalAmount: true,
            currentAmount: true,
            creator: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        investor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!investment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Investment not found'
      });
    }

    // Only allow investor or campaign creator to view
    if (investment.investorId !== req.user.id && investment.campaign.creator.id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this investment'
      });
    }

    res.json({ investment });
  } catch (error) {
    next(error);
  }
};
