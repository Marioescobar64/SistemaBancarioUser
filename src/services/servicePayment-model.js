import mongoose from 'mongoose';

const servicePaymentSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'La cuenta es obligatoria']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es obligatorio']
  },
  serviceProvider: {
    type: String,
    enum: ['EEGSA', 'ENERGUATE', 'EMPAGUA', 'CLARO', 'TIGO', 'SAT'],
    required: [true, 'El proveedor es obligatorio']
  },
  referenceNumber: {
    type: String, // NIS, Número de teléfono, o número de formulario
    required: [true, 'El número de referencia es obligatorio']
  },
  amount: {
    type: Number,
    required: [true, 'El monto es obligatorio'],
    min: [0.01, 'El monto debe ser mayor a 0']
  },
  currency: {
    type: String,
    enum: ['GTQ', 'USD'],
    default: 'GTQ'
  },
  receiptNumber: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['COMPLETADO', 'RECHAZADO'],
    default: 'COMPLETADO'
  }
}, {
  timestamps: true,
  versionKey: false
});

// Auto-generate receipt number
servicePaymentSchema.pre('save', function () {
  if (!this.receiptNumber) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    this.receiptNumber = `REC-${this.serviceProvider}-${dateStr}-${randomStr}`;
  }
});

export default mongoose.model('ServicePayment', servicePaymentSchema);
