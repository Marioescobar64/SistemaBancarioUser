'use strict';

import mongoose, { mongo } from 'mongoose';

const cardSchema = new mongoose.Schema({
        ownerCard: {
        type: String,
        required: true,
        trim: true,
        maxLength: [100, 'El nombre del propiertario de la tarjeta no puede tener mas de 100 caracteres'],
    },

    cardNumbers: {
        type: Number,
        required: [true, 'El Numero de las tarjeta es obligartoria'],
        min: [0, 'El telefono no puede ser mayor o igual a 0']
    },  

 expirationDate: {
    type: Date,
    required: [true, 'La fecha de expiración es obligatoria']
},   

    securityCode: {
        type: Number,
        required: [true, 'El Numero de las tarjeta es obligartoria'],
        min: [0, 'El telefono no puede ser mayor o igual a 0']
    },
    

    photo: {
    type: String,
    // valor por defecto
    default: 'card/Virraf',
    },


    isActive: {
    type: Boolean,
    default: true,
    }
},
    {
    timestamps: true,
  }
);

 cardSchema.index({ isActive: 1  });
cardSchema.index({ ownerCard: 1  });
 cardSchema.index({ ownerCard: 1, isActive: 1  });



// exportamos el modelo con el nombre Tarjeta
export default mongoose.model('Card', cardSchema)
