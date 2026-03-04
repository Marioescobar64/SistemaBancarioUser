'use strict';

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
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

  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria']
  },

  role: {
    type: String,
    enum: ['ADMIN', 'USER'],
    default: 'USER'
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

export default mongoose.model('User', userSchema);