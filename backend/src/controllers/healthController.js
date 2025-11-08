import { PrismaClient } from '@prisma/client';
import { getClient, getPlatformWallet, getAccountBalance } from '../lib/xrplClient.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Enhanced health check endpoint
 * Checks database, XRPL connection, and platform wallet status
 */
export const healthCheck = async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  try {
    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.checks.database = {
        status: 'ok',
        message: 'Database connection successful'
      };
    } catch (dbError) {
      checks.status = 'degraded';
      checks.checks.database = {
        status: 'error',
        message: dbError.message
      };
      logger.error('Health check - Database error', { error: dbError.message });
    }

    // Check XRPL connection
    try {
      const client = await getClient();
      const isConnected = client.isConnected();
      
      if (isConnected) {
        checks.checks.xrpl = {
          status: 'ok',
          message: 'XRPL connection active',
          server: process.env.XRPL_SERVER || 'wss://s.altnet.rippletest.net:51233'
        };
      } else {
        checks.status = 'degraded';
        checks.checks.xrpl = {
          status: 'error',
          message: 'XRPL not connected'
        };
        logger.error('Health check - XRPL not connected');
      }
    } catch (xrplError) {
      checks.status = 'degraded';
      checks.checks.xrpl = {
        status: 'error',
        message: xrplError.message
      };
      logger.error('Health check - XRPL error', { error: xrplError.message });
    }

    // Check platform wallet
    try {
      const wallet = getPlatformWallet();
      const balance = await getAccountBalance(wallet.address);
      
      const balanceNum = parseFloat(balance);
      const lowBalanceThreshold = 10; // 10 XRP threshold
      
      checks.checks.wallet = {
        status: balanceNum > lowBalanceThreshold ? 'ok' : 'warning',
        address: wallet.address,
        balance: `${balance} XRP`,
        message: balanceNum > lowBalanceThreshold 
          ? 'Wallet balance sufficient' 
          : `Wallet balance low (${balance} XRP)`
      };

      if (balanceNum <= lowBalanceThreshold) {
        checks.status = 'degraded';
        logger.warn('Health check - Low wallet balance', {
          address: wallet.address,
          balance: balance,
          threshold: lowBalanceThreshold
        });
      }
    } catch (walletError) {
      checks.status = 'degraded';
      checks.checks.wallet = {
        status: 'error',
        message: walletError.message
      };
      logger.error('Health check - Wallet error', { error: walletError.message });
    }

    // Set HTTP status code based on overall status
    const statusCode = checks.status === 'ok' ? 200 : 503;
    
    res.status(statusCode).json(checks);
  } catch (error) {
    logger.error('Health check failed', { error: error.message, stack: error.stack });
    
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: error.message
    });
  }
};

/**
 * Readiness check - lightweight check for load balancers
 */
export const readinessCheck = async (req, res) => {
  try {
    // Quick database check
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

/**
 * Liveness check - basic check that server is responding
 */
export const livenessCheck = (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};
