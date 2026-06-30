import Card from './card-model.js';

// Obtener todas las tarjetas con paginación y filtros
export const getCards = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive = true } = req.query;

    const filter = { 
      isActive,
      user: req.user._id
    };

    const cards = await Card.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Card.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: cards,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las tarjetas',
      error: error.message,
    });
  }
};

// Obtener tarjeta por ID
export const getCardById = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await Card.findById(id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada',
      });
    }

    if (card.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta tarjeta'
      });
    }

    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la tarjeta',
      error: error.message,
    });
  }
};