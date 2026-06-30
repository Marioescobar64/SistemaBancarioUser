import ServicePayment from './servicePayment-model.js';
import Account from '../accounts/account-model.js';
import { getExchangeRate } from '../banguat/banguat-service.js';
import mongoose from 'mongoose';

export const getServicePayments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Solo puede ver sus propios pagos
    const filter = { user: req.user._id };

    const payments = await ServicePayment.find(filter)
      .populate('account', 'accountNumber type currency')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ServicePayment.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los pagos de servicios',
      error: error.message
    });
  }
};

export const payService = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { accountId, serviceProvider, referenceNumber, amount } = req.body;

    if (amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    const account = await Account.findById(accountId).session(session);
    if (!account) {
      throw new Error('Cuenta no encontrada');
    }

    // Verificar propiedad de la cuenta
    if (account.user.toString() !== req.user._id.toString()) {
      throw new Error('No puedes pagar desde una cuenta que no es tuya');
    }

    if (!account.isActive) {
      throw new Error('La cuenta está inactiva');
    }

    // Services are typically paid in GTQ (Quetzales)
    let convertedAmount = amount;
    if (account.currency === 'USD') {
      const rate = getExchangeRate();
      convertedAmount = Math.round((amount / rate) * 100) / 100;
    }

    if (account.balance < convertedAmount) {
      throw new Error('Fondos insuficientes para realizar el pago');
    }

    // Restar el saldo de la cuenta
    account.balance -= convertedAmount;
    await account.save({ session });

    // Crear el registro del pago
    const payment = await ServicePayment.create([{
      account: account._id,
      user: account.user,
      serviceProvider,
      referenceNumber,
      amount,
      currency: 'GTQ', // El recibo sale en GTQ
      status: 'COMPLETADO'
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: `Pago a ${serviceProvider} realizado exitosamente.`,
      data: payment[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      success: false,
      message: 'Error al procesar el pago de servicio',
      error: error.message
    });
  }
};
