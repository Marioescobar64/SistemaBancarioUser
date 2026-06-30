import mongoose from 'mongoose';
import Transfer from './transfer-model.js';
import Account from '../accounts/account-model.js';

export const getTransfers = async (req, res) => {
  try {
    const { page = 1, limit = 10, account } = req.query;

    // Obtener todas las cuentas del usuario
    const userAccounts = await Account.find({ user: req.user._id }).select('_id');
    const userAccountIds = userAccounts.map(acc => acc._id);

    const query = {
      $or: [
        { fromAccount: { $in: userAccountIds } },
        { toAccount: { $in: userAccountIds } }
      ]
    };

    // Si se envía un ID de cuenta, validar que pertenezca al usuario y filtrar
    if (account) {
      if (!userAccountIds.some(id => id.toString() === account.toString())) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver esta cuenta'
        });
      }
      query.$or = [
        { fromAccount: account },
        { toAccount: account }
      ];
    }

    const transfers = await Transfer.find(query)
      .populate('fromAccount', 'accountNumber balance')
      .populate('toAccount', 'accountNumber balance')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transfer.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: transfers
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener transferencias',
      error: error.message
    });
  }
};

export const createTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { fromAccount, toAccount, amount } = req.body;

    if (amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    const originAccount = await Account.findById(fromAccount).session(session);
    const destinationAccount = await Account.findById(toAccount).session(session);

    if (!originAccount || !destinationAccount) {
      throw new Error('Cuenta no encontrada');
    }

    // Validar que la cuenta de origen pertenezca al usuario autenticado
    if (originAccount.user.toString() !== req.user._id.toString()) {
      throw new Error('No puedes transferir desde una cuenta que no es tuya');
    }

    if (!originAccount.isActive || !destinationAccount.isActive) {
      throw new Error('Una de las cuentas está inactiva');
    }

    if (originAccount.balance < amount) {
      throw new Error('Saldo insuficiente');
    }

    // Restar saldo
    originAccount.balance -= amount;

    // Sumar saldo
    destinationAccount.balance += amount;

    await originAccount.save({ session });
    await destinationAccount.save({ session });

    const transfer = await Transfer.create([{
      fromAccount,
      toAccount,
      amount,
      status: 'COMPLETED'
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Transferencia realizada exitosamente',
      data: transfer[0],
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      success: false,
      message: 'Error en la transferencia',
      error: error.message,
    });
  }
};