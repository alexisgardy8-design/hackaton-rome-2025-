import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { verifyTransaction, getPlatformWallet } from '../lib/xrplClient.js';

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
    .withMessage('Transaction hash must be 64 characters')
];

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
        campaign: true
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

    // PHASE 3: Verify transaction on XRPL Testnet
    console.log(`🔍 Verifying transaction ${transactionHash} on XRPL...`);
    
    let txDetails;
    try {
      txDetails = await verifyTransaction(transactionHash);
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

    // Verify transaction is a Payment
    if (txDetails.transactionType !== 'Payment') {
      return res.status(400).json({
        error: 'Invalid Transaction Type',
        message: `Expected Payment transaction, got ${txDetails.transactionType}`
      });
    }

    // Verify destination is platform wallet
    if (txDetails.destination !== PLATFORM_WALLET) {
      return res.status(400).json({
        error: 'Invalid Destination',
        message: `Payment must be sent to platform wallet: ${PLATFORM_WALLET}`
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

    console.log(`✅ Transaction verified successfully`);
    console.log(`   Amount: ${actualAmount} XRP`);
    console.log(`   From: ${txDetails.account}`);
    console.log(`   To: ${txDetails.destination}`);

    // Update investment with transaction hash
    const updatedInvestment = await prisma.investment.update({
      where: { id: investmentId },
      data: {
        transactionHash
      }
    });

    // Update campaign's current amount
    await prisma.campaign.update({
      where: { id: investment.campaignId },
      data: {
        currentAmount: {
          increment: investment.amount
        }
      }
    });

    // Get updated campaign data
    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: investment.campaignId }
    });

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
