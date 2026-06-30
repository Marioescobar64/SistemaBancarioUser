'use strict';

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  authServiceId: {
    type: String,
    required: [true, 'El ID de authservice es obligatorio'],
    unique: true,
  },

  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxLength: [100, 'El nombre no puede tener más de 100 caracteres']
  },

  email: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    trim: true
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

userSchema.index({ isActive: 1 });

export default mongoose.model('User', userSchema);