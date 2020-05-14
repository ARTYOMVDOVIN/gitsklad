const TelegramBot = require('node-telegram-bot-api')
const config = require('./config')
const helper= require('./helper')
const keyboard = require('./keyboard')
const kb = require('./keyboard-buttons')

const mongoose = require('mongoose')
const database = require('../database.json')

helper.logStart()



mongoose.Promise = global.Promise
// Инициализация БД
mongoose.connect(config.DB_URL, {
    useMongoClient: true
})
    .then( () => console.log('MongoDB connected'))
    .catch( (err) => console.log(err))

// Подключение моделей
require('./models/product.model')
require('./models/shipper.model')
require('./models/user.model')

// Создание моделей, как глобальных переменных для нашего скрипта
const Product = mongoose.model('products')
const Shipper = mongoose.model('shippers')
const User = mongoose.model('users')

// Строчки для сохранения товаров из database.json в БД mongodb
//database.products.forEach(f => new Product(f).save().catch(e => console.log(e)))
//database.shippers.forEach(c => new Shipper(c).save().catch(e => console.log(e)))

//'tff','sc','scp','sf'

const ACTION_TYPE = {

    //EDIT_QUANTITY: 'eq',

    TOGGLE_SKLAD_PRODUCTS: 'tsp',
    SHOW_SHIPPERS: 'ss',
    SHOW_SHIPPERS_MAP: 'ssm',
    SHOW_PRODUCTS: 'sp'
}


// =========================================================================


//Создание бота по токену - общение с клиентом (ожидания обновления/сообщения)
const bot = new TelegramBot(config.TOKEN, {polling: true})

//Обращение к экземпляру класса TelegramBot
//on - прослушка событий на входящее сообщение
// Обработчик команд (сообщений)
bot.on('message', msg => {
    //имя пользователя и его текст (дейстиве)
    console.log(msg.from.first_name, msg.text)

    const chatId = helper.getChatId(msg)

    switch (msg.text) {
        // Кнопка "СКЛАД"
        case kb.home.sklad:
            showSkladProducts(chatId, msg.from.id)
            break

        // Кнопка "ТОВАРЫ"
        case kb.home.products:
            bot.sendMessage(chatId, 'Выберете категорию:', {
                reply_markup: {keyboard: keyboard.products}
            })
            break

        // Кнопка на экране товаров "ВСЕ ТОВАРЫ"
        case kb.product.all:
            sendProductsByQuery(chatId, {})
            break
        // Кнопка на экране товаров "КАТЕГОРИЯ 1"
        case kb.product.category1:
            sendProductsByQuery(chatId, {type: 'category1'})
            break
        // Кнопка на экране товаров "КАТЕГОРИЯ 2"
        case kb.product.category2:
            sendProductsByQuery(chatId, {type: 'category2'})
            break

        // Кнопка "ПОСТАВЩИКИ"
        case kb.home.shippers:
            getShippersInCords(chatId, msg.location)
            /*bot.sendMessage(chatId, `Отправьте свое местоположение:`, {
                reply_markup: {
                    keyboard: keyboard.shippers
                }
            })*/
            break

        // Кнопка "НАЗАД"
        case kb.back:
            bot.sendMessage(chatId, 'Что хотите посмотреть?', {
                reply_markup: {keyboard: keyboard.home}
            })
            break
    }

    /*
    //если отправлено местоположение, то получаем кооринаты
    if (msg.location) {
        //console.log(location)
        //sendShipperInCords(chatId, msg.location)
        getShippersInCords(chatId, msg.location)
    }*/
})

// Старт бота
bot.onText(/\/start/, msg => {
    const text = `Привет, ${msg.from.first_name}!\nВыбери команду для начала работы:`

    bot.sendMessage(helper.getChatId(msg), text, {
        reply_markup: {
            keyboard: keyboard.home
        }
    })
})

//прослушка с регулярным выражением
// Поиск товара по id
bot.onText(/\/f(.+)/, (msg, [source, match]) => {
    const productUuid = helper.getItemUuid(source)
    //вывод id товара
    //console.log(productUuid)

    const chatId = helper.getChatId(msg)

    Promise.all([
        //получить товар, с которым мы работаем
        Product.findOne({uuid: productUuid}),
        //Здесь указываем условие, которое вернёт нужного нам пользователя
        //User'а получаем, для того, чтобы узнать, находится на складе товар или нет
        User.findOne({telegramId: msg.from.id})
    ]).then(([product, user]) => {
        //тут мы определяем, находится ли этот товар в коллекции склада определённого пользователя
        let isSklad = false

        //если в БД уже есть такой пользователь, то проверяем есть ли этот товар на его складе
        if (user) {
            //если в объекте user в его массиве products есть id товара
            //переопределяем переменную на true
            isSklad = user.products.indexOf(product.uuid) !== -1
        }

        //если флаг true - то удалить
        const skladText = isSklad ? 'Удалить из склада' : 'Добавить на склад'


        //console.log(product)

        const caption = `Название: ${product.name}\nПараметр l: ${product.length}\nПараметр r: ${product.rate}`

        bot.sendPhoto(chatId, product.picture, {
            caption: caption,

            //создаём внутреннюю инлайн-клавиатура
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: skladText,
                            //в коллбэк-дату можно передавать только строки, а не объекты
                            //JSON.stringify - метод приведения объекта к строке
                            //type - обяз. поле отвечающее за действие, кот необх выполнить
                            callback_data: JSON.stringify({
                                type: ACTION_TYPE.TOGGLE_SKLAD_PRODUCTS,
                                productUuid: product.uuid,
                                //флаг - добавлен ли товар уже на склад?
                                isSklad: isSklad
                            })
                        },
                        {
                            text: 'Показать поставщика',
                            callback_data: JSON.stringify({
                                type: ACTION_TYPE.SHOW_SHIPPERS,
                                shipperUuids: product.shippers
                            })
                        }
                    ],
                    /*[
                        {
                            text: `Добавить ещё`,
                            callback_data: JSON.stringify({
                                type: ACTION_TYPE.EDIT_QUANTITY,
                                productQuantity: product.quantity
                            })
                        }
                    ],*/
                    [
                        {
                            text: `Ссылка на товар: ${product.name}`,
                            url: product.link
                        }
                    ]
                ]
            }
        })
    })

})

// Поиск поставщика по id
bot.onText(/\/c(.+)/, (msg, [source, match]) => {
    const shipperUuid = helper.getItemUuid(source)

    const chatId = helper.getChatId(msg)

    Shipper.findOne({uuid: shipperUuid}).then(shipper => {
        //console.log(shipper)
        bot.sendMessage(chatId, `Перейти на сайт поставщика ${shipper.name}`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: shipper.name,
                            url: shipper.url
                        }
                    ],
                    [
                        {
                            text: `Показать товары поставщика`,
                            //callback_data: JSON.stringify(shipper.products)
                            callback_data: JSON.stringify({
                                type: ACTION_TYPE.SHOW_PRODUCTS,
                                productUuids: shipper.products
                            })
                        }
                    ]
                ]
            }
        }) //.catch(err => console.log(err))
    })
})

// Обработка callback query
// handler inline keyboard
bot.on('callback_query', query => {
    //console.log(query.data)

    const userId = query.from.id

    //создадим переменную
    let data

    try {
        //если всё успешно, то переопределяем объект data и парсим
        data = JSON.parse(query.data)
    } catch (e) {
        //если ничего не получилось, то выкидываем новую ошибку
        throw new Error('Data is not a object')
    }

    //переменная type из объекта data
    const { type } = data

    if (type === ACTION_TYPE.SHOW_SHIPPERS_MAP) {
        //убрать
        //const { lat, lon } = data
        bot.sendLocation(query.message.chat.id, lat, lon)
    }
    // добавить или удалить товар со склада
    else if (type === ACTION_TYPE.TOGGLE_SKLAD_PRODUCTS) {
        toggleSkladProducts(userId, query.id, data)
    }
    // показать все товары по категории
    else if (type === ACTION_TYPE.SHOW_PRODUCTS) {
        sendProductsByQuery(userId, {uuid: {'$in': data.productUuids}})
    }
    // вывод товаров по поставщику
    else if (type === ACTION_TYPE.SHOW_SHIPPERS) {
        sendShippersByQuery(userId, {uuid: {'$in': data.shipperUuids}})
    }
    /*
        // изменение кол-ва товара
        else if (type === ACTION_TYPE.EDIT_QUANTITY) {
            sendShippersByQuery(userId, {uuid: {'$in': data.shipperUuids}})
        }*/
})


// =========================================================================


// Суб-Кнопка "ВСЕ ТОВАРЫ / КАТЕГОРИЯ i" - поиск всех товаров по категории
function sendProductsByQuery(chatId, query) {
    Product.find(query).then(products => {
        //console.log(products)

        const html = products.map((f, i) => {
            return `<b>${i + 1}.</b> ${f.name} - /f${f.uuid}`
        }).join('\n')

        /*bot.sendMessage(chatId, html, {
            parse_mode: 'HTML'
            reply_markup: {
                keyboard: keyboard.products
            }
        })*/
        sendHTML(chatId, html, 'products')
    })
}

function sendHTML(chatId, html, kbName = null) {
    const options = {
        parse_mode: 'HTML'
    }

    //если передана клавиатура
    if (kbName) {
        options['reply_markup'] = {
            keyboard: keyboard[kbName]
        }
    }

    bot.sendMessage(chatId, html, options)
}

// Кнопка "ПОСТАВЩИКИ" - показать список поставщиков
function getShippersInCords(chatId, location) {

    //получаем список всех кинотетатров из бд
    Shipper.find({}).then(shippers => {

        const html = shippers.map((c, i) => {
            return `<b>${i + 1}.</b> ${c.name} - /c${c.uuid}`
        }).join('\n')

        sendHTML(chatId, html, 'home')
    })
}

// ТОВАР - добавить или удалить товар со склада
function toggleSkladProducts(userId, queryId, {productUuid, isSklad}) {

    /*let html
    html = product.rate
    html = `<b>Категория r:</b>\n${html}`

    sendHTML(chatId, html, 'home')*/

    //создадим переменную для сохранения юзера
    let userPromise

    //находим нужного нам юзера
    User.findOne({telegramId: userId})
        // обрабатываем промис, получаем объект юзера
        .then(user => {
            //если в бд уже есть такой объект юзера
            if (user) {
                //если товар добавлен на склад, то удаляем (переопределяем)
                //методом filter пробегаемся по всему массиву products
                if (isSklad) {
                    //если fUuid не равен нашему productUuid
                    user.products = user.products.filter(fUuid => fUuid !== productUuid)
                }
                //если товар не добавлен на склад, то добавляем (пушим)
                else {
                    user.products.push(productUuid)

                    //user.numb.push(productRate)
                }
                userPromise = user
            }
            //иначе создаем юзера
            else {
                userPromise = new User({
                    telegramId: userId,
                    products: [productUuid]
                })
            }

            const answerText = isSklad ? `Удалено из склада` : `Товар добавлен на склад`

            //сохранение нашего промиса в бд
            //_ - нам ненужны никакие параметры
            userPromise.save()
                .then(_ => {
                    bot.answerCallbackQuery({
                        callback_query_id: queryId,
                        text: answerText
                    })
                })
                .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
}

// Кнопка "СКЛАД" - показать товары со склада
function showSkladProducts(chatId, telegramId) {
    //находим пользователя
    User.findOne({telegramId})
        //обрабатываем промис
        .then(user => {
            console.log(user)
            //проверка - если есть юзер
            if (user) {
                //получить список всех товаров пользователя
                Product.find({uuid: {'$in': user.products}}).then(products => {
                    let html
                    console.log(products)
                    //если есть товары
                    if (products.length) {
                        html = products.map(f => {
                            return `${f.name} - <b>${f.rate}</b> (/f${f.uuid})`
                        }).join('\n')
                        //сверху преображаем масив в строку
                        html = `<b>Товары на складе:</b>\n${html}`
                    }
                    else {
                        html = 'Вы пока ничего не добавили'
                    }

                    sendHTML(chatId, html, 'home')
                })
            }
            //если нет юзера
            else {
                sendHTML(chatId, 'Вы пока ничего не добавили!', 'home')
            }
        }).catch(e => console.log(e))
}

// ПОСТАВЩИК - вывод товаров по поставщику
function sendShippersByQuery(userId, query) {
    Shipper.find(query).then(shippers => {
        const html = shippers.map((c, i) => {
            return `<b>${i + 1}</b>. ${c.name} - /c${c.uuid}`
        }).join('\n')

        sendHTML(userId, html, 'home')
    })
}
