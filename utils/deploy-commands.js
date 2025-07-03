const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config(); // Musimy załadować .env tutaj też

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    // Grab all the command files from the commands folder you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.warn(`[WARNING] Komenda pod ${filePath} brakuje właściwości "data" lub "execute".`);
        }
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(DISCORD_TOKEN);

// and deploy your commands!
(async () => {
    // Logowanie zmiennych przed ich użyciem
    console.log('Sprawdzanie zmiennych środowiskowych dla deploy-commands:');
    console.log(`CLIENT_ID: ${CLIENT_ID ? 'Ustawione' : 'BRAK'}`);
    console.log(`GUILD_ID: ${GUILD_ID ? 'Ustawione' : 'BRAK'}`);
    console.log(`DISCORD_TOKEN: ${DISCORD_TOKEN ? 'Ustawione (częściowo widoczne)' : 'BRAK'}`);

    if (!CLIENT_ID || !GUILD_ID || !DISCORD_TOKEN) {
        console.error("Błąd: Jedna lub więcej zmiennych środowiskowych (CLIENT_ID, GUILD_ID, DISCORD_TOKEN) nie jest ustawiona w pliku .env. Sprawdź dokładnie!");
        return;
    }

    try {
        console.log(`Rozpoczęto odświeżanie ${commands.length} komend aplikacji (/).`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log(`Pomyślnie załadowano ${data.length} komend aplikacji (/).`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error("KRYTYCZNY BŁĄD podczas rejestracji komend:", error);
    }
})();