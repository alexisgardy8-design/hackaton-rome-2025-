import { verifyTransaction, getAccountBalance, generateWallet } from '../lib/xrplClient.js';

/**
 * Get transaction details by hash
 * GET /api/xrpl/tx/:hash
 * @access Public (for debugging)
 */
export const getTransaction = async (req, res, next) => {
  try {
    const { hash } = req.params;

    console.log(`🔍 Looking up transaction: ${hash}`);

    const txDetails = await verifyTransaction(hash);

    if (!txDetails.verified) {
      return res.status(404).json({
        error: 'Transaction Not Found',
        message: txDetails.message || 'Transaction not found on XRPL Testnet',
        hash
      });
    }

    res.json({
      message: 'Transaction found',
      transaction: {
        hash: txDetails.hash,
        validated: txDetails.validated,
        success: txDetails.success,
        result: txDetails.result,
        transactionType: txDetails.transactionType,
        account: txDetails.account,
        destination: txDetails.destination,
        amount: txDetails.amount,
        ledgerIndex: txDetails.ledgerIndex,
        closeTime: txDetails.closeTime
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get account balance by address
 * GET /api/xrpl/balance/:address
 * @access Public (for debugging)
 */
export const getBalance = async (req, res, next) => {
  try {
    const { address } = req.params;

    console.log(`💰 Checking balance for: ${address}`);

    const balance = await getAccountBalance(address);

    res.json({
      message: 'Balance retrieved successfully',
      address,
      balance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a new Testnet wallet with funding
 * POST /api/xrpl/wallet/generate
 * @access Public (for testing only - remove in production!)
 */
export const createTestnetWallet = async (req, res, next) => {
  try {
    console.log('🔑 Generating new Testnet wallet...');

    const wallet = await generateWallet();

    res.json({
      message: 'Testnet wallet created and funded successfully',
      wallet: {
        address: wallet.address,
        seed: wallet.seed,
        publicKey: wallet.publicKey
      },
      warning: '⚠️ Store the seed securely! This is the only time it will be shown.',
      faucet: 'Wallet has been funded with 1000 XRP from Testnet faucet'
    });
  } catch (error) {
    next(error);
  }
};
