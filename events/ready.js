const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Bot gotowy! Zalogowano jako ${client.user.tag}`);
        console.log('Gotowy do obsługi komend slash (ale jeszcze ich nie zarejestrowano).');
    },
};