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
      .populate('fromAccount', 'accountNumber balance currency')
      .populate('toAccount', 'accountNumber balance currency')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transfer.countDocuments(query);

    console.log("Transfers sent to frontend:", JSON.stringify(transfers[0], null, 2));

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
  try {
    const { fromAccount, toAccount, amount } = req.body;

    // Validación básica de entrada
    if (!fromAccount || !toAccount || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos de transferencia incompletos o inválidos'
      });
    }

    let originAccount = await Account.findById(fromAccount);
    let destinationAccount;

    if (mongoose.Types.ObjectId.isValid(toAccount)) {
      destinationAccount = await Account.findById(toAccount);
    }
    if (!destinationAccount) {
      let searchAccount = toAccount;
      // Limpiar espacios y guiones
      const cleanInput = typeof toAccount === 'string' ? toAccount.replace(/[\s-]/g, '') : '';
      // Si tiene exactamente 16 dígitos, formatear como XXXX-XXXX-XXXX-XXXX
      if (cleanInput.length === 16) {
        searchAccount = `${cleanInput.substring(0,4)}-${cleanInput.substring(4,8)}-${cleanInput.substring(8,12)}-${cleanInput.substring(12,16)}`;
      }
      destinationAccount = await Account.findOne({ accountNumber: searchAccount });
    }

    if (!originAccount || !destinationAccount) {
      throw new Error('Cuenta origen o destino no encontrada');
    }

    // Validar que la cuenta de origen pertenezca al usuario autenticado
    if (originAccount.user.toString() !== req.user._id.toString()) {
      throw new Error('No puedes transferir desde una cuenta que no es tuya');
    }

    // Verificar que ambas cuentas estén activas
    if (!originAccount.isActive) {
      throw new Error('La cuenta de origen está inactiva');
    }
    
    if (!destinationAccount.isActive) {
      throw new Error('La cuenta destino está inactiva');
    }

    let convertedAmount = amount;
    let appliedRate = null;

    // Lógica multi-moneda
    if (originAccount.currency !== destinationAccount.currency) {
      throw new Error('Las transferencias entre diferentes monedas no están habilitadas por ahora.');
    }

    // Verificar saldo
    if (originAccount.balance < amount) {
      throw new Error('Fondos insuficientes');
    }

    // Limite diario (ejemplo simple)
    if (amount > originAccount.dailyTransferLimit) {
      throw new Error(`El monto excede el límite diario de transferencia (${originAccount.dailyTransferLimit})`);
    }

    // Ejecutar la transferencia
    originAccount.balance -= amount;
    destinationAccount.balance += convertedAmount;

    await originAccount.save();
    await destinationAccount.save();

    // Registrar la transferencia
    const transfer = new Transfer({
      fromAccount: originAccount._id,
      toAccount: destinationAccount._id,
      amount,
      convertedAmount: appliedRate ? convertedAmount : undefined,
      exchangeRate: appliedRate,
      status: 'COMPLETADA',
      referenceNumber: `TRF-${Date.now().toString().slice(-6)}`
    });

    await transfer.save();

    res.status(200).json({
      success: true,
      message: 'Transferencia realizada exitosamente',
      data: transfer
    });

  } catch (error) {
    console.error("Transfer error:", error);

    res.status(400).json({
      success: false,
      message: 'Error en la transferencia',
      error: error.message
    });
  }
};