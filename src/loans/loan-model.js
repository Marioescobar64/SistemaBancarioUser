'use strict';

import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es obligatorio']
  },

  amount: {
    type: Number,
    required: [true, 'El monto es obligatorio'],
    min: [1, 'El monto debe ser mayor a 0']
  },

  interestRate: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAID'],
    default: 'PENDING'
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

loanSchema.index({ user: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ isActive: 1 });

export default mongoose.model('Loan', loanSchema);