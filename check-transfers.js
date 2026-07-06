import mongoose from 'mongoose';

async function checkTransfers() {
  await mongoose.connect('mongodb://localhost:27017/veraff');
  const db = mongoose.connection.db;
  const transfers = await db.collection('transfers').find().sort({_id: -1}).limit(2).toArray();
  console.log(JSON.stringify(transfers, null, 2));
  process.exit(0);
}
checkTransfers();
