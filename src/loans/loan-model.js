'use strict';

import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es obligatorio']
  },

  // Cuenta donde se deposita el desembolso
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'La cuenta de desembolso es obligatoria']
  },

  // Número de préstamo único
  loanNumber: {
    type: String,
    required: [true, 'El número de préstamo es obligatorio'],
    unique: true
  },

  // Tipo de préstamo (productos reales de bancos guatemaltecos)
  loanType: {
    type: String,
    enum: {
      values: [
        'PERSONAL',       // Préstamo personal / fiduciario
        'HIPOTECARIO',    // Para compra de vivienda
        'VEHICULAR',      // Para compra de vehículo
        'EDUCATIVO',      // Préstamo educativo
        'EMPRESARIAL',    // Para negocios/empresas
        'MICROCREDITO',   // Microcrédito (popular en Guatemala rural)
        'AGRICOLA',       // Préstamo agrícola (café, cardamomo, etc.)
        'MICRO_ADELANTO'  // Adelantos rápidos estilo Zigi
      ],
      message: 'Tipo de préstamo no válido'
    },
    required: [true, 'El tipo de préstamo es obligatorio']
  },

  amount: {
    type: Number,
    required: [true, 'El monto es obligatorio'],
    min: [50, 'El monto mínimo es Q50']
  },

  currency: {
    type: String,
    enum: {
      values: ['GTQ', 'USD'],
      message: 'La moneda debe ser GTQ o USD'
    },
    default: 'GTQ'
  },

  // Tasa de interés anual (en Guatemala típicamente 10%-24%)
  interestRate: {
    type: Number,
    required: [true, 'La tasa de interés es obligatoria'],
    min: [0, 'La tasa no puede ser negativa'],
    max: [100, 'La tasa no puede ser mayor al 100%']
  },

  interestType: {
    type: String,
    enum: {
      values: ['FIJA', 'VARIABLE'],
      message: 'El tipo de interés debe ser FIJA o VARIABLE'
    },
    default: 'FIJA'
  },

  // Plazo del préstamo (en meses o días según el tipo)
  termMonths: {
    type: Number,
    required: [true, 'El plazo es obligatorio'],
    min: [1, 'El plazo mínimo es 1 unidad']
  },

  // Frecuencia de pago (para adelantos Zigi y préstamos)
  paymentFrequency: {
    type: String,
    enum: {
      values: ['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL'],
      message: 'Frecuencia de pago no válida'
    },
    default: 'MENSUAL'
  },

  // Comisión por servicio (Flat fee para adelantos Zigi)
  serviceFee: {
    type: Number,
    default: 0
  },

  // Cuota mensual calculada (amortización francesa)
  monthlyPayment: {
    type: Number,
    default: 0
  },

  // Control de pagos
  totalPaid: {
    type: Number,
    default: 0
  },

  remainingBalance: {
    type: Number,
    default: 0
  },

  paidInstallments: {
    type: Number,
    default: 0
  },

  nextPaymentDate: {
    type: Date,
    default: null
  },

  // Mora
  daysOverdue: {
    type: Number,
    default: 0
  },

  overdueAmount: {
    type: Number,
    default: 0
  },

  penaltyRate: {
    type: Number,
    default: 3 // 3% mora (estándar Guatemala)
  },

  // Garantía (para préstamos hipotecarios/vehiculares)
  collateral: {
    type: {
      type: String,
      enum: ['INMUEBLE', 'VEHICULO', 'FIDUCIARIA', 'MIXTA', 'NINGUNA'],
      default: 'NINGUNA'
    },
    description: {
      type: String,
      default: null,
      trim: true
    },
    estimatedValue: {
      type: Number,
      default: 0
    }
  },

  // Estado del préstamo (flujo completo)
  status: {
    type: String,
    enum: {
      values: [
        'SOLICITADO',
        'EN_REVISION',
        'APROBADO',
        'DESEMBOLSADO',
        'AL_DIA',
        'EN_MORA',
        'PAGADO',
        'RECHAZADO',
        'CANCELADO'
      ],
      message: 'Estado de préstamo no válido'
    },
    default: 'SOLICITADO'
  },

  // Aprobación
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  approvedAt: {
    type: Date,
    default: null
  },

  disbursedAt: {
    type: Date,
    default: null
  },

  rejectionReason: {
    type: String,
    default: null,
    trim: true
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

// Indexes
loanSchema.index({ user: 1 });
loanSchema.index({ account: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ isActive: 1 });
loanSchema.index({ loanType: 1 });
loanSchema.index({ loanNumber: 1 });
loanSchema.index({ user: 1, status: 1 });

export default mongoose.model('Loan', loanSchema);