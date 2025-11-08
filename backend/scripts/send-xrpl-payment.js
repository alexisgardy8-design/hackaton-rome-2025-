#!/usr/bin/env node

/**
 * Script pour envoyer une transaction XRPL Testnet
 * Usage: node send-xrpl-payment.js <seed> <destination> <amount>
 */

import { Client, Wallet, xrpToDrops } from 'xrpl';

const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: node send-xrpl-payment.js <seed> <destination> <amount>');
  console.error('Example: node send-xrpl-payment.js sEd... rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY 1000');
  process.exit(1);
}

const [seed, destination, amount] = args;

(async () => {
  try {
    console.log('🔌 Connexion à XRPL Testnet...');
    const client = new Client('wss://s.altnet.rippletest.net:51233');
    await client.connect();
    console.log('✅ Connecté à XRPL Testnet');
    
    const wallet = Wallet.fromSeed(seed);
    console.log('💼 Wallet source:', wallet.address);
    console.log('📤 Destination:', destination);
    console.log('💰 Montant:', amount, 'XRP');
    
    // Vérifier le solde
    const accountInfo = await client.request({
      command: 'account_info',
      account: wallet.address
    });
    const balance = parseFloat(accountInfo.result.account_data.Balance) / 1000000;
    console.log('💵 Solde actuel:', balance, 'XRP');
    
    if (balance < parseFloat(amount) + 0.01) {
      console.error('❌ Solde insuffisant. Besoin:', parseFloat(amount) + 0.01, 'XRP');
      await client.disconnect();
      process.exit(1);
    }
    
    // Préparer la transaction
    const payment = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: destination,
      Amount: xrpToDrops(parseFloat(amount))
    };
    
    console.log('📝 Préparation de la transaction...');
    const prepared = await client.autofill(payment);
    const signed = wallet.sign(prepared);
    
    console.log('📤 Envoi de la transaction...');
    const result = await client.submitAndWait(signed.tx_blob);
    
    if (result.result.validated) {
      console.log('✅ Transaction validée !');
      console.log('📝 Transaction Hash:', result.result.hash);
      console.log('📊 Ledger Index:', result.result.ledger_index);
      console.log('');
      console.log('💡 Utilisez ce hash pour confirmer l\'investissement:');
      console.log('   POST /api/investments/confirm');
      console.log('   { "investmentId": "...", "transactionHash": "' + result.result.hash + '" }');
    } else {
      console.error('❌ Transaction non validée');
      console.error('Résultat:', result.result);
    }
    
    await client.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.data) {
      console.error('Détails:', error.data);
    }
    process.exit(1);
  }
})();

