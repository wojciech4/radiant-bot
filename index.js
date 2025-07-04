require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Heroku/Render używa zmiennej PORT

const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// --- DODANE: Prosty serwer webowy do utrzymania aktywności bota ---
app.get('/', (req, res) => {
  res.send('Bot jest aktywny i działa!'); // Wiadomość, którą zobaczy UptimeRobot lub przeglądarka
});

app.listen(port, () => {
  console.log(`Serwer webowy bota nasłuchuje na porcie ${port}`); // Komunikat w konsoli Render
});
// --- KONIEC DODANEGO SERWERA WEBOWEGO ---

// Tworzenie klienta bota
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates, // Do funkcji muzycznych (np. odtwarzanie muzyki)
        // Tutaj możesz dodać inne intenty, jeśli będziesz ich potrzebował
    ],
});

// Kolekcje do przechowywania komend i cooldownów
client.commands = new Collection();
client.cooldowns = new Collection();

// --- Ładowanie Komend ---
// Wyszukuje folder 'commands' w katalogu głównym bota
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Sprawdza, czy komenda ma wymagane właściwości 'data' i 'execute'
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.warn(`[WARNING] Komenda pod ${filePath} brakuje właściwości "data" lub "execute".`);
        }
    }
}

// --- Ładowanie Zdarzeń ---
// Wyszukuje folder 'events' w katalogu głównym bota
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        // Jeśli zdarzenie ma flagę 'once', uruchamiane jest tylko raz
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        // W przeciwnym razie, uruchamiane jest za każdym razem, gdy zdarzenie wystąpi
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// --- Obsługa interakcji (Bardzo ważne dla komend slash) ---
client.on(Events.InteractionCreate, async interaction => {
    // Sprawdza, czy interakcja jest komendą czatu (slash command)
    if (!interaction.isChatInputCommand()) return;

    // Pobiera komendę z kolekcji klienta na podstawie nazwy interakcji
    const command = client.commands.get(interaction.commandName);

    // Jeśli komenda nie została znaleziona, loguje błąd i kończy
    if (!command) {
        console.error(`Nie znaleziono komendy ${interaction.commandName}.`);
        return;
    }

    try {
        // Wykonuje logikę komendy
        await command.execute(interaction);
    } catch (error) {
        console.error(error); // Loguje błąd do konsoli
        // Wysyła odpowiedź użytkownikowi, informując o błędzie
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Wystąpił błąd podczas wykonywania tej komendy!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Wystąpił błąd podczas wykonywania tej komendy!', ephemeral: true });
        }
    }
});

// Logowanie bota do Discorda za pomocą tokena ze zmiennej środowiskowej
client.login(process.env.TOKEN); // Upewnij się, że w zmiennych środowiskowych Render masz "TOKEN"