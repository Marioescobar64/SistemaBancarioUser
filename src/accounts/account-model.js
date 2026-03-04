'use strict';

import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es obligatorio']
  },

  accountNumber: {
    type: String,
    required: [true, 'El número de cuenta es obligatorio'],
    unique: true
  },

  balance: {
    type: Number,
    default: 0,
    min: [0, 'El saldo no puede ser negativo']
  },

  type: {
    type: String,
    enum: ['AHORRO', 'MONETARIA'],
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

accountSchema.index({ user: 1 });
accountSchema.index({ isActive: 1 });

export default mongoose.model('Account', accountSchema);