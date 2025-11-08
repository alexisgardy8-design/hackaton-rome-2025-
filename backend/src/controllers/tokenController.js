import { PrismaClient } from '@prisma/client';
import { 
  getPlatformWallet, 
  generateTokenSymbol,
  sendTokenPayment,
  checkTrustLine,
  getTokenBalance
} from '../lib/xrplClient.js';

const prisma = new PrismaClient();

/**
 * Issue a token for a campaign
 * POST /api/campaigns/:id/issue-token
 * @access Private (STARTUP only, campaign owner)
 */
export const issueToken = async (req, res, next) => {
  try {
    const { id: campaignId } = req.params;
    const { totalSupply, metadata } = req.body;

    // Find campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        token: true,
        investments: {
          where: { transactionHash: { not: null } } // Only confirmed investments
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    // Check ownership
    if (campaign.creatorId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only campaign owner can issue tokens'
      });
    }

    // Check if token already exists
    if (campaign.token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Token already issued for this campaign'
      });
    }

    // Check campaign status
    if (campaign.status !== 'ACTIVE' && campaign.status !== 'COMPLETED') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Campaign must be ACTIVE or COMPLETED to issue tokens'
      });
    }

    // Check if campaign has investments
    if (campaign.investments.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Campaign must have confirmed investments before issuing tokens'
      });
    }

    // Get platform wallet (token issuer)
    const platformWallet = getPlatformWallet();

    // Generate token symbol
    const tokenSymbol = generateTokenSymbol(campaign.title, campaignId);

    // Calculate total supply if not provided
    const supply = totalSupply || parseFloat(campaign.currentAmount);

    // Create token record
    const token = await prisma.token.create({
      data: {
        symbol: tokenSymbol,
        issuerAddress: platformWallet.address,
        totalSupply: supply,
        distributedAmount: 0,
        status: 'ISSUED',
        metadata: metadata || {
          name: `${campaign.title} Token`,
          description: `Tokenized shares for ${campaign.title}`,
          campaignTitle: campaign.title,
          issuedAt: new Date().toISOString()
        },
        campaignId
      }
    });

    console.log(`🎫 Token issued: ${tokenSymbol} for campaign ${campaign.title}`);

    res.status(201).json({
      message: 'Token issued successfully',
      token: {
        id: token.id,
        symbol: token.symbol,
        issuerAddress: token.issuerAddress,
        totalSupply: token.totalSupply,
        distributedAmount: token.distributedAmount,
        status: token.status,
        metadata: token.metadata,
        campaignId: token.campaignId
      },
      instructions: {
        nextStep: 'Investors must create trustlines before token distribution',
        trustlineRequired: true,
        howTo: `Investors need to establish a TrustSet for currency "${tokenSymbol}" issued by ${platformWallet.address}`,
        trustlineEndpoint: `/api/investments/:investmentId/trustline-status`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Distribute tokens to investors
 * POST /api/campaigns/:id/distribute-tokens
 * @access Private (STARTUP only, campaign owner)
 */
export const distributeTokens = async (req, res, next) => {
  try {
    const { id: campaignId } = req.params;

    // Find campaign with token and investments
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        token: {
          include: {
            tokenDistributions: true
          }
        },
        investments: {
          where: { transactionHash: { not: null } }, // Only confirmed investments
          include: {
            investor: true
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    // Check ownership
    if (campaign.creatorId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only campaign owner can distribute tokens'
      });
    }

    // Check if token exists
    if (!campaign.token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Token must be issued before distribution. Use POST /api/campaigns/:id/issue-token first'
      });
    }

    // Check token status
    if (campaign.token.status === 'DISTRIBUTED') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Tokens already distributed'
      });
    }

    // Check if campaign has investments
    if (campaign.investments.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No confirmed investments to distribute tokens to'
      });
    }

    // Update token status to DISTRIBUTING
    await prisma.token.update({
      where: { id: campaign.token.id },
      data: { status: 'DISTRIBUTING' }
    });

    const platformWallet = getPlatformWallet();
    const distributions = [];
    const errors = [];

    // Calculate token allocation for each investor
    const totalInvested = campaign.investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    for (const investment of campaign.investments) {
      try {
        const investorAddress = investment.investor.walletAddress;

        if (!investorAddress) {
          errors.push({
            investmentId: investment.id,
            investor: investment.investor.email,
            error: 'Investor wallet address not set'
          });
          continue;
        }

        // Calculate token amount based on investment ratio
        const investmentRatio = parseFloat(investment.amount) / totalInvested;
        const tokenAmount = investmentRatio * parseFloat(campaign.token.totalSupply);

        console.log(`📊 Investment ratio for ${investment.investor.email}: ${(investmentRatio * 100).toFixed(2)}%`);
        console.log(`🎫 Token allocation: ${tokenAmount.toFixed(2)} ${campaign.token.symbol}`);

        // Check if investor has trustline
        const trustlineStatus = await checkTrustLine(
          investorAddress,
          campaign.token.symbol,
          platformWallet.address
        );

        if (!trustlineStatus.exists) {
          errors.push({
            investmentId: investment.id,
            investor: investment.investor.email,
            investorAddress,
            error: 'Trustline not established. Investor must create trustline first.',
            tokenSymbol: campaign.token.symbol,
            issuerAddress: platformWallet.address
          });
          continue;
        }

        // Send token payment
        const paymentResult = await sendTokenPayment(
          process.env.XRPL_PLATFORM_SEED,
          investorAddress,
          campaign.token.symbol,
          tokenAmount.toFixed(2)
        );

        // Record distribution
        const distribution = await prisma.tokenDistribution.create({
          data: {
            tokenId: campaign.token.id,
            investorAddress,
            amount: tokenAmount,
            transactionHash: paymentResult.hash,
            trustlineVerified: true,
            distributedAt: new Date()
          }
        });

        distributions.push({
          investmentId: investment.id,
          investor: investment.investor.email,
          investorAddress,
          amount: tokenAmount,
          transactionHash: paymentResult.hash,
          success: true
        });

        console.log(`✅ Distributed ${tokenAmount.toFixed(2)} ${campaign.token.symbol} to ${investment.investor.email}`);
      } catch (error) {
        console.error(`❌ Failed to distribute to ${investment.investor.email}:`, error.message);
        errors.push({
          investmentId: investment.id,
          investor: investment.investor.email,
          error: error.message
        });
      }
    }

    // Update token distributed amount
    const totalDistributed = distributions.reduce((sum, dist) => sum + parseFloat(dist.amount), 0);
    await prisma.token.update({
      where: { id: campaign.token.id },
      data: {
        distributedAmount: totalDistributed,
        status: errors.length === 0 ? 'DISTRIBUTED' : 'DISTRIBUTING'
      }
    });

    res.json({
      message: `Token distribution ${errors.length === 0 ? 'completed' : 'partially completed'}`,
      summary: {
        totalInvestors: campaign.investments.length,
        successful: distributions.length,
        failed: errors.length,
        totalDistributed: totalDistributed.toFixed(2),
        tokenSymbol: campaign.token.symbol,
        issuerAddress: platformWallet.address
      },
      distributions,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    // Rollback status if error
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: { token: true }
      });
      if (campaign?.token) {
        await prisma.token.update({
          where: { id: campaign.token.id },
          data: { status: 'ISSUED' }
        });
      }
    } catch (rollbackError) {
      console.error('Failed to rollback token status:', rollbackError);
    }
    next(error);
  }
};

/**
 * Get token details for a campaign
 * GET /api/campaigns/:id/token
 * @access Public
 */
export const getCampaignToken = async (req, res, next) => {
  try {
    const { id: campaignId } = req.params;

    const token = await prisma.token.findUnique({
      where: { campaignId },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            currentAmount: true,
            goalAmount: true,
            status: true
          }
        },
        tokenDistributions: {
          select: {
            investorAddress: true,
            amount: true,
            transactionHash: true,
            distributedAt: true
          }
        }
      }
    });

    if (!token) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No token issued for this campaign'
      });
    }

    res.json({
      token: {
        id: token.id,
        symbol: token.symbol,
        issuerAddress: token.issuerAddress,
        totalSupply: token.totalSupply,
        distributedAmount: token.distributedAmount,
        remainingSupply: parseFloat(token.totalSupply) - parseFloat(token.distributedAmount),
        status: token.status,
        metadata: token.metadata,
        createdAt: token.createdAt,
        updatedAt: token.updatedAt
      },
      campaign: token.campaign,
      distributions: token.tokenDistributions.map(dist => ({
        investorAddress: dist.investorAddress,
        amount: dist.amount,
        transactionHash: dist.transactionHash,
        distributedAt: dist.distributedAt
      })),
      summary: {
        totalDistributions: token.tokenDistributions.length,
        distributionProgress: ((parseFloat(token.distributedAmount) / parseFloat(token.totalSupply)) * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check trustline status for an investment
 * GET /api/investments/:id/trustline-status
 * @access Private (Investor or Campaign Owner)
 */
export const checkInvestmentTrustline = async (req, res, next) => {
  try {
    const { id: investmentId } = req.params;

    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        investor: true,
        campaign: {
          include: {
            token: true
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

    // Check access (investor or campaign owner)
    if (investment.investorId !== req.user.id && investment.campaign.creatorId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    // Check if token exists
    if (!investment.campaign.token) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No token issued for this campaign yet'
      });
    }

    // Check if investor has wallet address
    if (!investment.investor.walletAddress) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Investor wallet address not set',
        instructions: 'Investor must set their XRPL wallet address in profile'
      });
    }

    // Check trustline
    const platformWallet = getPlatformWallet();
    const trustlineStatus = await checkTrustLine(
      investment.investor.walletAddress,
      investment.campaign.token.symbol,
      platformWallet.address
    );

    // Get token balance if trustline exists
    let tokenBalance = '0';
    if (trustlineStatus.exists) {
      try {
        tokenBalance = await getTokenBalance(
          investment.investor.walletAddress,
          investment.campaign.token.symbol,
          platformWallet.address
        );
      } catch (error) {
        console.error('Failed to get token balance:', error);
      }
    }

    res.json({
      investmentId: investment.id,
      campaignId: investment.campaign.id,
      campaignTitle: investment.campaign.title,
      investor: {
        email: investment.investor.email,
        walletAddress: investment.investor.walletAddress
      },
      token: {
        symbol: investment.campaign.token.symbol,
        issuerAddress: platformWallet.address
      },
      trustline: {
        exists: trustlineStatus.exists,
        balance: trustlineStatus.balance || tokenBalance,
        limit: trustlineStatus.limit,
        ready: trustlineStatus.exists
      },
      instructions: trustlineStatus.exists
        ? 'Trustline is established. Ready to receive tokens.'
        : {
            message: 'Trustline must be established before receiving tokens',
            howTo: `Create a TrustSet transaction for currency "${investment.campaign.token.symbol}" issued by ${platformWallet.address}`,
            requiredFields: {
              TransactionType: 'TrustSet',
              Account: investment.investor.walletAddress,
              LimitAmount: {
                currency: investment.campaign.token.symbol,
                issuer: platformWallet.address,
                value: '1000000'
              }
            }
          }
    });
  } catch (error) {
    next(error);
  }
};
