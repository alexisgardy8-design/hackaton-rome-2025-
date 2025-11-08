import crypto from 'crypto';
import { Client, Wallet, xrpToDrops } from 'xrpl';
import { getClient, getPlatformWallet } from './xrplClient.js';

/**
 * Generate a condition (preimage) for escrow based on campaign ID
 * This condition will be used to release the escrow when campaign reaches 100%
 * @param {string} campaignId - Campaign ID
 * @returns {Object} Condition object with preimage and fulfillment
 */
export const generateEscrowCondition = (campaignId) => {
  // Generate a preimage (secret) based on campaign ID
  const preimage = crypto.randomBytes(32);
  const preimageHex = preimage.toString('hex').toUpperCase();
  
  // Create SHA-256 hash of the preimage (this is the condition)
  const condition = crypto.createHash('sha256').update(preimage).digest('hex').toUpperCase();
  
  return {
    condition,
    preimage: preimageHex,
    fulfillment: preimageHex // The fulfillment is the preimage itself
  };
};

/**
 * Create an escrow on XRPL
 * @param {string} investorSeed - Investor's wallet seed
 * @param {string} destination - Destination wallet address (platform wallet)
 * @param {number} amount - Amount in XRP
 * @param {string} condition - Condition hash (SHA-256 of preimage)
 * @param {number} finishAfter - Unix timestamp (seconds) when escrow can be finished
 * @param {number} cancelAfter - Unix timestamp (seconds) when escrow can be cancelled (optional)
 * @returns {Promise<Object>} Escrow creation result
 */
export const createEscrow = async (
  investorSeed,
  destination,
  amount,
  condition,
  finishAfter,
  cancelAfter = null
) => {
  const xrplClient = await getClient();
  const investorWallet = Wallet.fromSeed(investorSeed);

  try {
    const escrowCreate = {
      TransactionType: 'EscrowCreate',
      Account: investorWallet.address,
      Destination: destination,
      Amount: xrpToDrops(amount),
      Condition: condition,
      FinishAfter: finishAfter,
    };

    if (cancelAfter) {
      escrowCreate.CancelAfter = cancelAfter;
    }

    console.log(`🔒 Creating escrow for ${amount} XRP from ${investorWallet.address} to ${destination}...`);
    console.log(`   Condition: ${condition}`);
    console.log(`   FinishAfter: ${new Date(finishAfter * 1000).toISOString()}`);

    const prepared = await xrplClient.autofill(escrowCreate);
    const signed = investorWallet.sign(prepared);
    const result = await xrplClient.submitAndWait(signed.tx_blob);

    if (result.result.validated) {
      console.log(`✅ Escrow created successfully`);
      console.log(`   Transaction hash: ${result.result.hash}`);
      console.log(`   Sequence: ${prepared.Sequence}`);
      
      return {
        success: true,
        hash: result.result.hash,
        sequence: prepared.Sequence,
        validated: result.result.validated,
        investorAddress: investorWallet.address,
        destination,
        amount,
        condition,
        finishAfter
      };
    } else {
      throw new Error('Escrow creation not validated');
    }
  } catch (error) {
    console.error('❌ Failed to create escrow:', error);
    throw new Error(`Failed to create escrow: ${error.message}`);
  }
};

/**
 * Finish an escrow (release funds) using the preimage
 * @param {string} platformSeed - Platform wallet seed
 * @param {string} ownerAddress - Owner of the escrow (investor address)
 * @param {number} sequence - Sequence number of the escrow
 * @param {string} condition - Condition hash
 * @param {string} fulfillment - Preimage (fulfillment) to satisfy the condition
 * @returns {Promise<Object>} Escrow finish result
 */
export const finishEscrow = async (
  platformSeed,
  ownerAddress,
  sequence,
  condition,
  fulfillment
) => {
  const xrplClient = await getClient();
  const platformWallet = Wallet.fromSeed(platformSeed);

  try {
    const escrowFinish = {
      TransactionType: 'EscrowFinish',
      Account: platformWallet.address,
      Owner: ownerAddress,
      OfferSequence: sequence,
      Condition: condition,
      Fulfillment: fulfillment,
    };

    console.log(`🔓 Finishing escrow for owner ${ownerAddress}...`);
    console.log(`   Sequence: ${sequence}`);
    console.log(`   Condition: ${condition}`);

    const prepared = await xrplClient.autofill(escrowFinish);
    const signed = platformWallet.sign(prepared);
    const result = await xrplClient.submitAndWait(signed.tx_blob);

    if (result.result.validated) {
      console.log(`✅ Escrow finished successfully`);
      console.log(`   Transaction hash: ${result.result.hash}`);
      
      return {
        success: true,
        hash: result.result.hash,
        validated: result.result.validated,
        ownerAddress,
        sequence
      };
    } else {
      throw new Error('Escrow finish not validated');
    }
  } catch (error) {
    console.error('❌ Failed to finish escrow:', error);
    throw new Error(`Failed to finish escrow: ${error.message}`);
  }
};

/**
 * Verify an escrow transaction on XRPL
 * @param {string} txHash - Transaction hash
 * @returns {Promise<Object>} Escrow transaction details
 */
export const verifyEscrowTransaction = async (txHash) => {
  const xrplClient = await getClient();

  try {
    const txResponse = await xrplClient.request({
      command: 'tx',
      transaction: txHash
    });

    const tx = txResponse.result;

    if (!tx) {
      return {
        verified: false,
        message: 'Transaction not found'
      };
    }

    if (tx.TransactionType !== 'EscrowCreate') {
      return {
        verified: false,
        message: `Expected EscrowCreate transaction, got ${tx.TransactionType}`
      };
    }

    // Check if transaction is validated
    const validated = tx.validated || false;
    const success = tx.meta?.TransactionResult === 'tesSUCCESS';

    return {
      verified: validated && success,
      success,
      transactionType: tx.TransactionType,
      account: tx.Account,
      destination: tx.Destination,
      amount: parseFloat(tx.Amount) / 1000000, // Convert drops to XRP
      condition: tx.Condition,
      finishAfter: tx.FinishAfter,
      cancelAfter: tx.CancelAfter,
      hash: tx.hash,
      validated,
      ledgerIndex: tx.ledger_index,
      result: tx.meta?.TransactionResult
    };
  } catch (error) {
    console.error('❌ Failed to verify escrow transaction:', error);
    throw new Error(`Failed to verify escrow transaction: ${error.message}`);
  }
};

