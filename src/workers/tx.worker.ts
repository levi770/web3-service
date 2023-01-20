import Web3 from 'web3';
import { Job, DoneCallback } from 'bull';
import { Networks, Statuses } from '../common/constants';
import Transaction from './models/transaction';
import Contract from './models/contract';

const ethereum = new Web3(new Web3.providers.HttpProvider(process.env.ETHEREUM_HOST));
const polygon = new Web3(new Web3.providers.HttpProvider(process.env.POLYGON_HOST));

async function txWorker(job: Job, doneCallback: DoneCallback) {
  try {
    const transactions = await Transaction.findAll({ where: { status: Statuses.PENDING } });

    for (const tx of transactions) {
      const txHash = tx.tx_hash;
      if (!txHash) continue;

      const w3 = tx.network === Networks.ETHEREUM ? ethereum : polygon;
      const txReciept = await w3.eth.getTransactionReceipt(txHash);

      if (!txReciept) {
        continue;
      } else if (txReciept.status) {
        const contract = await Contract.findOne({ where: { id: tx.contract } });
        
        if (contract) {
          contract.address = txReciept.contractAddress;
          await contract.save();
        }
        
        tx.status = Statuses.PROCESSED;
        tx.tx_receipt = txReciept;
        await tx.save();
        
        continue;
      } else if (!txReciept.status) {
        tx.status = Statuses.FAILED;
        tx.tx_receipt = txReciept;
        await tx.save();
        
        continue;
      }
    }

    doneCallback(null, true);
  } catch (error) {
    console.log('[WORKER] tx:' + error.message, JSON.stringify(error));
    doneCallback(error, null);
  }
}

export default txWorker;
