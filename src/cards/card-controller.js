import Card from './card-model.js';
import { cloudinary } from '../../middlewares/file-uploader.js';

// Obtener todas las tarjetas con paginación y filtros
export const getCards = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive = true } = req.query;

    const filter = { isActive };

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

// Crear nueva tarjeta
export const createCard = async (req, res) => {
  try {
    const cardData = req.body;

    if (req.file) {
      const extension = req.file.path.split('.').pop();
      const filename = req.file.filename;

      const relativePath = filename.includes('card/')
        ? filename.substring(filename.indexOf('card/'))
        : filename;

      cardData.photo = `${relativePath}.${extension}`;
    } else {
      // Imagen por defecto
      cardData.photo = 'card/Virraf';
    }

    const card = new Card(cardData);
    await card.save();

    res.status(201).json({
      success: true,
      message: 'Tarjeta creada exitosamente',
      data: card,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear la tarjeta',
      error: error.message,
    });
  }
};

// Actualizar tarjeta
export const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      const currentCard = await Card.findById(id);

      // Eliminar imagen anterior de Cloudinary
      if (currentCard && currentCard.photo) {
        const photoPath = currentCard.photo;
        const photoWithoutExt = photoPath.substring(
          0,
          photoPath.lastIndexOf('.')
        );

        const publicId = `${photoWithoutExt}`;

        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.error(
            `Error al eliminar imagen anterior: ${deleteError.message}`
          );
        }
      }

      const extension = req.file.path.split('.').pop();
      const filename = req.file.filename;

      const relativePath = filename.includes('card/')
        ? filename.substring(filename.indexOf('card/'))
        : filename;

      updateData.photo = `${relativePath}.${extension}`;
    }

    const card = await Card.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tarjeta actualizada exitosamente',
      data: card,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar la tarjeta',
      error: error.message,
    });
  }
};

// Activar / Desactivar tarjeta
export const changeCardStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const isActive = req.url.includes('/activate');
    const action = isActive ? 'activada' : 'desactivada';

    const card = await Card.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada',
      });
    }

    res.status(200).json({
      success: true,
      message: `Tarjeta ${action} exitosamente`,
      data: card,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado de la tarjeta',
      error: error.message,
    });
  }
};