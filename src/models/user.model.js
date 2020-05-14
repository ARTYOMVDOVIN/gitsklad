//подключаем mongoose
const mongoose = require('mongoose')
//создаём схему
const Schema = mongoose.Schema

const UserSchema = new Schema({
    telegramId: {
        type: Number,
        required: true
    },
    //массив строк (тут хранятся id товаров, которые пользователь добавил на склад)
    products: {
        type: [String],
        default: []
    }
})

mongoose.model('users', UserSchema)