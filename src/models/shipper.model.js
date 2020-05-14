//подключаем mongoose
const mongoose = require('mongoose')
//создаём схему
const Schema = mongoose.Schema

//создаём схему для поставщика
const ShipperSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    uuid: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true
    },
    products: {
        type: [String],
        default: []
    }
})

//создаём модель
mongoose.model('shippers', ShipperSchema)