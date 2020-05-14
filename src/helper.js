module.exports = {
    /*
        debug(obj) {
            return JSON.stringify(obj, null, 4)
        },
        */
    logStart() {
        console.clear()
        console.log('Bot has been started...')
    },

    //возврат id чата
    getChatId(msg) {
        return msg.chat.id
    },

    //возврат новой строки, у которой мы вырежем первые 2 значения и отдадим оставшуюся часть
    // для "/ff123" - "f123"
    getItemUuid(source) {
        return source.substr(2, source.length)
    }
}

