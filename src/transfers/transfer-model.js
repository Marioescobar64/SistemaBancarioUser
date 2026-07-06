'use strict';

import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({
  // Número de referencia único (para recibos y comprobantes)
  referenceNumber: {
    type: String,
    required: [true, 'El número de referencia es obligatorio'],
    unique: true
  },

  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'La cuenta origen es obligatoria']
  },

  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: false
  },

  amount: {
    type: Number,
    required: [true, 'El monto es obligatorio'],
    min: [0.01, 'El monto debe ser mayor a Q0.01']
  },

  currency: {
    type: String,
    enum: {
      values: ['GTQ', 'USD'],
      message: 'La moneda debe ser GTQ o USD'
    },
    default: 'GTQ'
  },

  exchangeRate: {
    type: Number,
    default: 1
  },

  convertedAmount: {
    type: Number,
    default: null
  },

  // Tipo de transferencia (sistemas de pago guatemaltecos)
  transferType: {
    type: String,
    enum: {
      values: [
        'INTERNA',              // Entre cuentas del mismo banco (Veraff)
        'INTERBANCARIA_ACH',    // ACH - Cámara de Compensación Bancaria (1-2 días)
        'INTERBANCARIA_LBTR',   // LBTR - Liquidación Bruta en Tiempo Real
        'INTERNACIONAL'         // Transferencia SWIFT internacional
      ],
      message: 'Tipo de transferencia no válido'
    },
    default: 'INTERNA',
    required: true
  },

  // Descripción / concepto del pago
  description: {
    type: String,
    trim: true,
    maxLength: [250, 'La descripción no puede tener más de 250 caracteres'],
    default: null
  },

  // Datos del beneficiario (para transferencias interbancarias)
  beneficiary: {
    name: { type: String, default: null, trim: true },
    bankName: { type: String, default: null, trim: true },
    bankCode: { type: String, default: null, trim: true },
    accountNumber: { type: String, default: null, trim: true }
  },

  // Comisiones
  fee: {
    type: Number,
    default: 0
  },

  // Estado
  status: {
    type: String,
    enum: {
      values: ['PENDIENTE', 'PROCESANDO', 'COMPLETADA', 'FALLIDA', 'REVERSADA'],
      message: 'Estado de transferencia no válido'
    },
    default: 'PENDIENTE'
  },

  // Para reversiones
  reversedAt: {
    type: Date,
    default: null
  },

  reversalReason: {
    type: String,
    default: null,
    trim: true
  },

  // Canal de la operación
  channel: {
    type: String,
    enum: {
      values: ['BANCA_EN_LINEA', 'APP_MOVIL', 'VENTANILLA', 'ATM'],
      message: 'Canal no válido'
    },
    default: 'BANCA_EN_LINEA'
  },

  // IP del dispositivo (seguridad)
  ipAddress: {
    type: String,
    default: null
  },

  // Procesado por (cajero/admin)
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }

}, {
  timestamps: true
});

// Indexes
transferSchema.index({ fromAccount: 1 });
transferSchema.index({ toAccount: 1 });
transferSchema.index({ referenceNumber: 1 });
transferSchema.index({ status: 1 });
transferSchema.index({ transferType: 1 });
transferSchema.index({ createdAt: -1 });

export default mongoose.model('Transfer', transferSchema);