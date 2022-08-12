// AÑADIR ELIMINACIÓN AUTOMÁTICA CUANDO EL ESTADO SE ACTUALICE EN LÍNEA

const Discord = require('discord.js');
const ms = require('ms');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fetch = require('node-fetch');
const config = require('./config.json');
const client = new Discord.Client({
    intents: [
        //https://ziad87.net/intents/
        "GUILDS",
        "GUILD_MESSAGES",
        "GUILD_PRESENCES"
    ],
    partials: [
        "MESSAGE",
        "CHANNEL",
        //"REACTION",
        "GUILD_MEMBER",
        //"USER"
    ]
});
require('dotenv').config();

const ip = process.env.IP;
const port = process.env.PORT || 25565;

resetStatus()

let currentlyOnline = false;
let currentPlayers = null;
let maintenanceMode = false;
let customMessage = undefined;
//let oldStatus = 0;
//let currentStatus = 0;

// maintenance 2
// offline 0
// online 1


function resetStatus() {
    getServerInfo().then(res => {
        if (res.online === false || res.offline === true) {
            getServerInfoV1().then(function(resSecond) {
                if(resSecond.online === false || resSecond.offline === true) {
                    currentlyOnline = false;
                    currentPlayers = null;
                    console.log('¡El servidor está desconectado!');
                } else {
                    if (resSecond.version === "Maintenance") {
                        maintenanceMode = true
                    } else {
                        maintenanceMode =   false
                    }
                    currentlyOnline = true;
                    currentPlayers = `${resSecond.players.online}/${resSecond.players.max}`;
                    console.log(`¡El servidor está en línea!\n¡Los jugadores actuales: ${currentPlayers}!`);
                }
            })
        } else {
            if (res.version === "Maintenance") {
                maintenanceMode = true
            } else {
                maintenanceMode = false
            }
            currentlyOnline = true;
            currentPlayers = `${res.players.online}/${res.players.max}`;
            console.log(`¡El servidor está en línea!\n¡Los jugadores actuales: ${currentPlayers}!`);
        }
    }).catch(e => {
        console.log(e);
    })
}

async function getServerInfo() {
    const response = await fetch(`https://api.mcsrvstat.us/2/${ip}:${port}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
    });
    const data = await response.json();
    return data;
}

async function getServerInfoV1() {
    const response = await fetch(`https://api.mcsrvstat.us/1/${ip}:${port}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
    });
    const data = await response.json();
    return data;
}

function updateStatus() {
    const channel = client.channels.cache.get(process.env.CHANNELID);
    if (!channel) return new Error('¡ID de canal no está definido!');

    if (!process.env.MESSAGEID) {
        const setupEmbed = new Discord.MessageEmbed()
        .setTitle('¡Configuración!')
        .setDescription('¡El bot se está configurando actualmente! ¡Este es un mensaje para obtener el ID de mensjae para actualizar cada vez!')
        .setTimestamp()
        
        channel.send({ embeds: [setupEmbed] }).then(() => {
            console.log('PON LA CONFIGURACIÓN EN EL .ENV')
            process.exit();
        });
    }

//    if (maintenanceMode === true) {
//        currentStatus = 2;
//    } else if (currentlyOnline === true) {
//        currentStatus = 1;
//    } else {
//        currentStatus = 0;
//    }

    // maintenance 2
    // offline 0
    // online 1

//    console.log(currentStatus);
//    console.log(oldStatus);

//    if (currentStatus === 1 && !oldStatus === 1) {
//        console.log('Cambiar a en línea');
//        customMessage = undefined;
//        oldStatus = 1;
//    }

    if (maintenanceMode === true) {
        client.user.setPresence({ activities: [{ name: config.customStatus.maintenance, type: config.customStatus.maintenanceType }], status: config.customStatus.maintenanceStatus });
    } else if (currentlyOnline === true) {
        client.user.setPresence({ activities: [{ name: config.customStatus.online.replace('{online/max}', currentPlayers).replace('{online}/{max}', currentPlayers), type: config.customStatus.onlineType }], status: config.customStatus.onlineStatus });
    } else {
        client.user.setPresence({ activities: [{ name: config.customStatus.offline, type: config.customStatus.offlineType }], status: config.customStatus.offlineStatus });
    }

    channel.messages.fetch(process.env.MESSAGEID).then(msg => {
        if (maintenanceMode === true) {
            const Embed = new Discord.MessageEmbed()
            .setColor(config.maintenancemode.colour)
            .setTitle('Estado de ' + config.servername)
            .setURL(config.website)
            .setAuthor(config.servername, config.youricon, config.website)
            .setDescription(config.maintenancemode.description)
            .setThumbnail(config.youricon)
            .addFields(
                { name: config.maintenancemode.fieldName, value: config.maintenancemode.fieldValue },
                { name: '**Jugadores:** ', value: currentPlayers },
                { name: '**IP:**', value: config.displayip },
            )
            .setTimestamp()
            .setFooter(config.maintenancemode.footer, config.youricon);
            msg.edit({ embeds: [Embed] })
        } else if (currentlyOnline === true) {
            const Embed = new Discord.MessageEmbed()
            .setColor(config.online.colour)
            .setTitle('Estado de ' + config.servername)
            .setURL(config.website)
            .setAuthor(config.servername, config.youricon, config.website)
            .setDescription(config.online.description)
            .setThumbnail(config.youricon)
            .addFields(
                { name: '**Jugadores:**', value: currentPlayers },
                { name: 'IP:', value: config.displayip },
            )
            .setTimestamp()
            .setFooter(config.online.footer, config.youricon);
            msg.edit({ embeds: [Embed] })
        } else {
            const Embed = new Discord.MessageEmbed()
            .setColor(config.offline.colour)
            .setTitle('Estado de ' + config.servername)
            .setURL(config.website)
            .setAuthor(config.servername, config.youricon, config.website)
            .setDescription(config.offline.description)
            .setThumbnail(config.youricon)
            .addFields(
                { name: 'IP:', value: config.displayip },
            )
            .setTimestamp()
            .setFooter(config.offline.footer, config.youricon);
            msg.edit({ embeds: [Embed] })
        }
    });
    console.log('¡Estado ha sido actualizado!')
}

client.on('ready', c => {
    console.log(`Conectado como: ${c.user.tag}`);
    updateStatus();
    setInterval(() => {
        updateStatus();
    }, ms(config.UpdateIntervalEmbed));

    if (config.commands.enableSlashCommands === true) {
        const commands = [
            new SlashCommandBuilder().setName('setmessage').setDescription('¡Establece el mensaje personalizado!')
            .addStringOption((option) => option.setName('message').setDescription('¡El mensaje que desea configurar el mensaje personalizado para!')),
        ].map(command => command.toJSON());

        const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

        rest.put(Routes.applicationGuildCommands(client.user.id, config.guildid), { body: commands })
            .then(() => console.log('Comandos de aplicación registrados con éxito.'))
            .catch(console.error);
    }
});

setInterval(() => {
    resetStatus();
}, ms(config.UpdateIntervalAPIChecking));

if (config.commands.enableMessageCommands === true) {
    client.on('messageCreate', message => {
        if (message.author.bot) return;
        
        let prefix = config.commands.prefix;

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).split(/ +/);
        const cmd = args.shift().toLowerCase();

        if (cmd === 'setmessage') {
            if (!message.member.permissions.has(config.commands.requiredPermission)) return message.reply(`¡Te estás perdiendo el permiso \`${config.commands.requiredPermission}\`!`)
            if (!args.length >= 1) {
                customMessage = undefined;
                message.reply('¡El estado ha sido borrado!');
            } else {
                customMessage = args.join(' ');
                message.reply('¡El estado ha sido cambiado!');
            }
            updateStatus();
        }
    });
}

if (config.commands.enableSlashCommands === true) {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        const { commandName } = interaction;

        if (commandName === 'setmessage') {
            if (!interaction.memberPermissions.has(config.commands.requiredPermission)) return interaction.reply({ content: `¡Te estás perdiendo el permiso \`${config.commands.requiredPermission}\`!`, ephemeral: true })
            let args = interaction.options.getString('message');
            if (args === null) {
                customMessage = undefined;
                interaction.reply({ content: '¡El estado ha sido borrado!', ephemeral: true });
            } else {
                customMessage = args;
                interaction.reply({ content: '¡El estado ha sido cambiado!', ephemeral: true });
            }
            updateStatus();
        } 
    });
}

client.login(process.env.TOKEN).catch((error) => console.log(error));
