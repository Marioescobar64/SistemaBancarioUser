'use strict';

import mongoose from 'mongoose';

const DEPARTAMENTOS_GUATEMALA = [
  'Guatemala', 'Sacatepéquez', 'Chimaltenango', 'El Progreso',
  'Escuintla', 'Santa Rosa', 'Sololá', 'Totonicapán',
  'Quetzaltenango', 'Suchitepéquez', 'Retalhuleu', 'San Marcos',
  'Huehuetenango', 'Quiché', 'Baja Verapaz', 'Alta Verapaz',
  'Petén', 'Izabal', 'Zacapa', 'Chiquimula',
  'Jalapa', 'Jutiapa'
];

const userSchema = new mongoose.Schema({
  authServiceId: {
    type: String,
    required: [true, 'El ID de authservice es obligatorio'],
    unique: true,
  },

  // --- Datos Personales ---
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxLength: [100, 'El nombre no puede tener más de 100 caracteres']
  },

  lastName: {
    type: String,
    trim: true,
    maxLength: [100, 'El apellido no puede tener más de 100 caracteres'],
    default: '' // Default para Lazy Sync antiguos
  },

  dpi: {
    type: String,
    unique: true,
    sparse: true, // Permite nulos únicos
    trim: true,
    match: [/^\d{13}$/, 'El DPI debe tener exactamente 13 dígitos']
  },

  nit: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },

  dateOfBirth: {
    type: Date
  },

  gender: {
    type: String,
    enum: {
      values: ['M', 'F'],
      message: 'El género debe ser M o F'
    }
  },

  nationality: {
    type: String,
    default: 'Guatemalteca',
    trim: true
  },

  // --- Dirección ---
  address: {
    street: { type: String, trim: true },
    zone: { type: Number, min: 1, max: 25 },
    municipality: { type: String, trim: true },
    department: {
      type: String,
      enum: {
        values: DEPARTAMENTOS_GUATEMALA,
        message: 'Departamento no válido'
      }
    }
  },

  // --- Contacto ---
  email: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true
  },

  phone: {
    type: String,
    match: [/^\d{8}$/, 'El teléfono debe tener 8 dígitos (formato Guatemala)']
  },

  // --- Datos Laborales ---
  occupation: {
    type: String,
    trim: true
  },

  monthlyIncome: {
    type: Number,
    min: [0, 'El ingreso no puede ser negativo']
  },

  incomeSource: {
    type: String,
    enum: {
      values: ['EMPLEO', 'NEGOCIO_PROPIO', 'REMESAS', 'INVERSIONES', 'PENSIÓN', 'OTRO'],
      message: 'Fuente de ingreso no válida'
    }
  },

  // --- Estado y Perfil Bancario ---
  isActive: {
    type: Boolean,
    default: true
  },

  profilePhoto: {
    type: String,
    default: null
  },

  isPEP: {
    type: Boolean,
    default: false
  },

  // Nivel de riesgo del cliente (evaluación KYC - Know Your Customer)
  riskLevel: {
    type: String,
    enum: {
      values: ['BAJO', 'MEDIO', 'ALTO'],
      message: 'Nivel de riesgo no válido'
    },
    default: 'BAJO'
  },

  // --- Límites de Microcréditos ---
  microLoanLimit: {
    type: Number,
    default: 500
  },
  
  microLoanScore: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

userSchema.index({ isActive: 1 });

export default mongoose.model('User', userSchema);