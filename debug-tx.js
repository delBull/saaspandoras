const { ethers } = require('ethers');

async function debugTx() {
  const provider = new ethers.providers.JsonRpcProvider('https://sepolia.drpc.org'); // Using a reliable public RPC
  const txHash = '0xdd745a9cf9f34c2b549871dbb859f61440c3e3b7f8ca4e1afd0bf665404a449a';

  console.log(`Debugging tx: ${txHash}`);

  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
        console.log('Transaction not found (might be dropped or not indexed yet).');
        return;
    }
    console.log('Transaction found:', {
        to: tx.to,
        from: tx.from,
        nonce: tx.nonce,
        gasLimit: tx.gasLimit.toString(),
        dataLength: tx.data.length
    });

    const receipt = await provider.getTransactionReceipt(txHash);
    console.log('Receipt status:', receipt ? receipt.status : 'No receipt yet');

    if (receipt && receipt.status === 0) {
        console.log('Transaction reverted. Attempting to replay to get reason...');
        try {
            // Replay the transaction locally to get the revert reason
            await provider.call(tx, receipt.blockNumber);
        } catch (err) {
            console.log('Replay Error (Revert Reason):');
            console.log(err.reason || err.message || err);
            
             if (err.data) {
                console.log('Revert Data:', err.data);
                if (err.data.startsWith('0x08c379a0')) { // Error(string) selector
                    const reason = ethers.utils.defaultAbiCoder.decode(['string'], '0x' + err.data.substring(10))[0];
                    console.log('Decoded Reason:', reason);
                }
            }
        }
    }

  } catch (error) {
    console.error('Error fetching tx:', error);
  }
}

debugTx();
