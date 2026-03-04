'use strict';

import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({

  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },

  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: [1, 'El monto debe ser mayor a 0']
  },

  status: {
    type: String,
    enum: ['COMPLETED', 'FAILED'],
    default: 'COMPLETED'
  }

}, {
  timestamps: true
});

transferSchema.index({ fromAccount: 1 });
transferSchema.index({ toAccount: 1 });

export default mongoose.model('Transfer', transferSchema);