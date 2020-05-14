const kb = require('./keyboard-buttons')

module.exports = {
    home: [
        [kb.home.products, kb.home.shippers],
        [kb.home.sklad]
    ],
    products: [
        [kb.product.all],
        [kb.product.category1],
        [kb.product.category2],
        [kb.back]
    ],

    shippers: [
        /*[
            {
                text: 'Отправить своё местоположение',
                request_location: true
            }
        ],
        [kb.back]*/
    ]
}