const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const PREFIX = require('path').parse(__filename).name;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const ts_icon_url = process.env.ts_icon_url;
const disclaimer = process.env.disclaimer;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('DESCRIPTION')
        .addUserOption(option => option.setName('target').setDescription('The user\'s avatar to show'))
        .addStringOption(option => option.setName('input').setDescription('The input to echo back')),
    async execute(interaction, logger) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        const string = interaction.options.getString('input');
        const user = interaction.options.getUser('target');
        logger.debug(`[${PREFIX}] string: ${string}`);
        logger.debug(`[${PREFIX}] user: ${user}`);

        const embed = new MessageEmbed()
            .setColor('DARK_BLUE')
            .setAuthor({ name: 'TripSit.Me', iconURL: ts_icon_url, url: 'http://www.tripsit.me' })
            .setThumbnail('https://i.imgur.com/AfFp7pu.png')
            .setTitle('About TripSit')
            .setURL('https://tripsit.me/about/')
            .setDescription('description')
            .addFields(
                { name: 'String', value: 'string' },
                // { name: 'User', value: user },
            )
            .setFooter({ text: disclaimer, iconURL: ts_icon_url });
        return interaction.reply({ embeds: [embed] });
    },
};