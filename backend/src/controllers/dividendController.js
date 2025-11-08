import { PrismaClient } from '@prisma/client';
import { sendDividendPayment, checkDividendBalance } from '../lib/xrplClient.js';

const prisma = new PrismaClient();

/**
 * Create and distribute dividend to investors
 * POST /api/dividends/create
 */
export const createDividend = async (req, res) => {
  try {
    const { campaignId, totalAmount, asset = 'XRP', issuerAddress, distributionType = 'BY_INVESTMENT', notes } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!campaignId || !totalAmount) {
      return res.status(400).json({ error: 'campaignId and totalAmount are required' });
    }

    if (parseFloat(totalAmount) <= 0) {
      return res.status(400).json({ error: 'totalAmount must be greater than 0' });
    }

    // Validate asset
    if (asset !== 'XRP' && !issuerAddress) {
      return res.status(400).json({ error: 'issuerAddress is required for token dividends' });
    }

    // Check campaign exists and user is owner
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        investments: {
          include: {
            investor: true
          }
        },
        token: {
          include: {
            tokenDistributions: true
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.creatorId !== userId) {
      return res.status(403).json({ error: 'Only campaign owner can create dividends' });
    }

    // Check campaign has investments
    const confirmedInvestments = campaign.investments.filter(inv => inv.transactionHash);
    
    if (confirmedInvestments.length === 0) {
      return res.status(400).json({ error: 'Campaign has no confirmed investments' });
    }

    // Check platform has sufficient balance
    const platformBalance = await checkDividendBalance(
      process.env.XRPL_PLATFORM_ADDRESS,
      asset,
      issuerAddress
    );

    if (!platformBalance.hasSufficient || parseFloat(platformBalance.balance) < parseFloat(totalAmount)) {
      return res.status(400).json({ 
        error: 'Insufficient platform balance for dividend distribution',
        available: platformBalance.balance,
        required: totalAmount
      });
    }

    // Calculate shares based on distribution type
    let shares = [];
    let totalShares = 0;

    if (distributionType === 'BY_INVESTMENT') {
      // Calculate by investment amount
      confirmedInvestments.forEach(investment => {
        const share = parseFloat(investment.amount);
        shares.push({
          investorId: investment.investorId,
          investorAddress: investment.investor.walletAddress,
          investorEmail: investment.investor.email,
          investorName: investment.investor.name,
          share: share,
          investmentAmount: share
        });
        totalShares += share;
      });
    } else if (distributionType === 'BY_TOKENS') {
      // Calculate by token holdings
      if (!campaign.token) {
        return res.status(400).json({ error: 'Campaign has no token issued. Cannot distribute by tokens.' });
      }

      const tokenDistributions = campaign.token.tokenDistributions;
      
      if (tokenDistributions.length === 0) {
        return res.status(400).json({ error: 'No tokens have been distributed yet' });
      }

      tokenDistributions.forEach(dist => {
        const share = parseFloat(dist.amount);
        shares.push({
          investorAddress: dist.investorAddress,
          share: share,
          tokenAmount: share
        });
        totalShares += share;
      });
    }

    // Validate investors have wallet addresses
    const missingWallets = shares.filter(s => !s.investorAddress);
    if (missingWallets.length > 0) {
      return res.status(400).json({ 
        error: `${missingWallets.length} investor(s) missing XRPL wallet addresses`,
        details: 'All investors must have wallet addresses to receive dividends'
      });
    }

    // Create dividend record
    const dividend = await prisma.dividend.create({
      data: {
        campaignId,
        totalAmount: parseFloat(totalAmount),
        asset,
        issuerAddress: issuerAddress || null,
        distributionType,
        distributionDate: new Date(),
        status: 'DISTRIBUTING',
        notes: notes || null
      }
    });

    console.log(`\n💰 Starting dividend distribution for campaign ${campaignId}`);
    console.log(`   Total amount: ${totalAmount} ${asset}`);
    console.log(`   Recipients: ${shares.length}`);
    console.log(`   Distribution type: ${distributionType}\n`);

    // Sequential distribution to each investor
    const payments = [];
    let successCount = 0;
    let failCount = 0;
    let totalDistributed = 0;

    for (const share of shares) {
      // Calculate investor's dividend amount
      const investorAmount = (share.share / totalShares) * parseFloat(totalAmount);
      const roundedAmount = investorAmount.toFixed(6); // 6 decimal precision

      console.log(`📤 Sending ${roundedAmount} ${asset} to ${share.investorAddress}...`);

      // Create payment record
      const payment = await prisma.dividendPayment.create({
        data: {
          dividendId: dividend.id,
          investorAddress: share.investorAddress,
          amount: parseFloat(roundedAmount),
          status: 'PENDING'
        }
      });

      // Attempt XRPL payment
      const result = await sendDividendPayment(
        share.investorAddress,
        roundedAmount,
        asset,
        issuerAddress
      );

      if (result.success) {
        // Update payment as successful
        await prisma.dividendPayment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            transactionHash: result.hash,
            paidAt: new Date()
          }
        });

        payments.push({
          investorAddress: share.investorAddress,
          investorName: share.investorName || 'Unknown',
          investorEmail: share.investorEmail || 'N/A',
          amount: roundedAmount,
          transactionHash: result.hash,
          status: 'SUCCESS'
        });

        successCount++;
        totalDistributed += parseFloat(roundedAmount);
        console.log(`   ✅ Success! TX: ${result.hash}`);
      } else {
        // Update payment as failed
        await prisma.dividendPayment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            errorMessage: result.error
          }
        });

        payments.push({
          investorAddress: share.investorAddress,
          investorName: share.investorName || 'Unknown',
          investorEmail: share.investorEmail || 'N/A',
          amount: roundedAmount,
          error: result.error,
          status: 'FAILED'
        });

        failCount++;
        console.log(`   ❌ Failed: ${result.error}`);
      }
    }

    // Update dividend status based on results
    let finalStatus;
    if (successCount === shares.length) {
      finalStatus = 'DISTRIBUTED'; // All successful
    } else if (successCount > 0) {
      finalStatus = 'PARTIAL'; // Some successful, some failed
    } else {
      finalStatus = 'FAILED'; // All failed
    }

    await prisma.dividend.update({
      where: { id: dividend.id },
      data: {
        status: finalStatus,
        distributedAmount: totalDistributed
      }
    });

    console.log(`\n✨ Distribution complete!`);
    console.log(`   Success: ${successCount}/${shares.length}`);
    console.log(`   Failed: ${failCount}/${shares.length}`);
    console.log(`   Total distributed: ${totalDistributed} ${asset}\n`);

    res.status(201).json({
      dividend: {
        id: dividend.id,
        campaignId: dividend.campaignId,
        totalAmount: dividend.totalAmount,
        distributedAmount: totalDistributed,
        asset: dividend.asset,
        distributionType: dividend.distributionType,
        status: finalStatus,
        distributionDate: dividend.distributionDate
      },
      summary: {
        totalRecipients: shares.length,
        successfulPayments: successCount,
        failedPayments: failCount,
        totalDistributed: totalDistributed,
        successRate: ((successCount / shares.length) * 100).toFixed(2) + '%'
      },
      payments
    });

  } catch (error) {
    console.error('Error creating dividend:', error);
    res.status(500).json({ error: 'Failed to create dividend', details: error.message });
  }
};

/**
 * Get all dividends for a campaign
 * GET /api/campaigns/:campaignId/dividends
 */
export const getCampaignDividends = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const dividends = await prisma.dividend.findMany({
      where: { campaignId },
      include: {
        payments: {
          select: {
            id: true,
            investorAddress: true,
            amount: true,
            status: true,
            transactionHash: true,
            paidAt: true
          }
        }
      },
      orderBy: { distributionDate: 'desc' }
    });

    // Calculate summary for each dividend
    const dividendsWithSummary = dividends.map(dividend => {
      const successfulPayments = dividend.payments.filter(p => p.status === 'SUCCESS').length;
      const failedPayments = dividend.payments.filter(p => p.status === 'FAILED').length;
      
      return {
        id: dividend.id,
        totalAmount: dividend.totalAmount,
        distributedAmount: dividend.distributedAmount,
        asset: dividend.asset,
        distributionType: dividend.distributionType,
        status: dividend.status,
        distributionDate: dividend.distributionDate,
        notes: dividend.notes,
        summary: {
          totalPayments: dividend.payments.length,
          successfulPayments,
          failedPayments,
          successRate: dividend.payments.length > 0 
            ? ((successfulPayments / dividend.payments.length) * 100).toFixed(2) + '%'
            : '0%'
        },
        paymentsCount: dividend.payments.length
      };
    });

    res.json({
      campaignId,
      dividends: dividendsWithSummary,
      total: dividendsWithSummary.length
    });

  } catch (error) {
    console.error('Error fetching campaign dividends:', error);
    res.status(500).json({ error: 'Failed to fetch dividends', details: error.message });
  }
};

/**
 * Get dividend details with all payments
 * GET /api/dividends/:id
 */
export const getDividendDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const dividend = await prisma.dividend.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        payments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!dividend) {
      return res.status(404).json({ error: 'Dividend not found' });
    }

    const successfulPayments = dividend.payments.filter(p => p.status === 'SUCCESS').length;
    const failedPayments = dividend.payments.filter(p => p.status === 'FAILED').length;
    const pendingPayments = dividend.payments.filter(p => p.status === 'PENDING').length;

    res.json({
      dividend: {
        id: dividend.id,
        campaignId: dividend.campaignId,
        campaignTitle: dividend.campaign.title,
        creator: dividend.campaign.creator,
        totalAmount: dividend.totalAmount,
        distributedAmount: dividend.distributedAmount,
        asset: dividend.asset,
        issuerAddress: dividend.issuerAddress,
        distributionType: dividend.distributionType,
        status: dividend.status,
        distributionDate: dividend.distributionDate,
        notes: dividend.notes,
        createdAt: dividend.createdAt
      },
      summary: {
        totalPayments: dividend.payments.length,
        successfulPayments,
        failedPayments,
        pendingPayments,
        successRate: dividend.payments.length > 0 
          ? ((successfulPayments / dividend.payments.length) * 100).toFixed(2) + '%'
          : '0%'
      },
      payments: dividend.payments
    });

  } catch (error) {
    console.error('Error fetching dividend details:', error);
    res.status(500).json({ error: 'Failed to fetch dividend details', details: error.message });
  }
};

/**
 * Get dividend distribution status (for frontend polling)
 * GET /api/dividends/:id/status
 */
export const getDividendStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const dividend = await prisma.dividend.findUnique({
      where: { id },
      include: {
        payments: {
          select: {
            status: true,
            amount: true
          }
        }
      }
    });

    if (!dividend) {
      return res.status(404).json({ error: 'Dividend not found' });
    }

    const successfulPayments = dividend.payments.filter(p => p.status === 'SUCCESS').length;
    const failedPayments = dividend.payments.filter(p => p.status === 'FAILED').length;
    const pendingPayments = dividend.payments.filter(p => p.status === 'PENDING').length;

    const progress = dividend.payments.length > 0
      ? ((successfulPayments / dividend.payments.length) * 100).toFixed(2)
      : 0;

    res.json({
      dividendId: id,
      status: dividend.status,
      totalAmount: dividend.totalAmount,
      distributedAmount: dividend.distributedAmount,
      asset: dividend.asset,
      progress: {
        percentage: parseFloat(progress),
        completed: successfulPayments,
        failed: failedPayments,
        pending: pendingPayments,
        total: dividend.payments.length
      },
      isComplete: dividend.status === 'DISTRIBUTED' || dividend.status === 'FAILED' || dividend.status === 'PARTIAL'
    });

  } catch (error) {
    console.error('Error fetching dividend status:', error);
    res.status(500).json({ error: 'Failed to fetch dividend status', details: error.message });
  }
};
