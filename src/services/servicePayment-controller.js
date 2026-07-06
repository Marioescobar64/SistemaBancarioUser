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
  try {
    const { accountId, serviceProvider, referenceNumber, amount } = req.body;

    // Validación
    if (!accountId || !serviceProvider || !referenceNumber || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos del servicio incompletos o monto inválido'
      });
    }

    const originAccount = await Account.findById(accountId);

    if (!originAccount) {
      throw new Error('Cuenta origen no encontrada');
    }

    if (originAccount.user.toString() !== req.user._id.toString()) {
      throw new Error('No puedes pagar desde una cuenta que no es tuya');
    }

    if (originAccount.balance < amount) {
      throw new Error('Fondos insuficientes');
    }

    // Restar saldo
    originAccount.balance -= amount;
    await originAccount.save();

    // Crear registro de pago
    const servicePayment = new ServicePayment({
      account: originAccount._id,
      user: req.user._id,
      serviceProvider,
      referenceNumber,
      amount,
      status: 'COMPLETADO'
    });

    await servicePayment.save();

    res.status(200).json({
      success: true,
      message: `Pago de ${serviceProvider} realizado exitosamente`,
      data: servicePayment
    });

  } catch (error) {
    console.error("Service Payment Error:", error);

    res.status(400).json({
      success: false,
      message: 'Error al procesar el pago del servicio',
      error: error.message
    });
  }
};
