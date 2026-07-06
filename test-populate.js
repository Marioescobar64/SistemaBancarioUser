import mongoose from 'mongoose';
import Transfer from './src/transfers/transfer-model.js';
import Account from './src/accounts/account-model.js';
import User from './src/users/user-model.js';

async function testPopulate() {
  await mongoose.connect('mongodb://localhost:27017/veraff');
  const transfers = await Transfer.find()
      .populate('fromAccount', 'accountNumber balance currency')
      .populate('toAccount', 'accountNumber balance currency')
      .sort({ createdAt: -1 })
      .limit(2);
  
  console.log(JSON.stringify(transfers, null, 2));
  process.exit(0);
}
testPopulate();
