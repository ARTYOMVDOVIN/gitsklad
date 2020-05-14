//подключаем mongoose
const mongoose = require('mongoose')
//создаём схему
const Schema = mongoose.Schema

const ProductSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    uuid: {
        type: String,
        required: true,
    },
    rate: {
        type: Number
    },
    length: {
        type: String
    },
    link: {
        type: String
    },
    picture: {
        type: String
    },
    shippers: {
        type: [String],
        default: []
    }
})

mongoose.model('products', ProductSchema)