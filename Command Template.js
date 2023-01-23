const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	GoldAtLevel,
	GoldPerXP,
	RoleBotAdmin,
	RoleStaff,
	RolePlayerGM,
	CollecterTimeout,
	DateOptions,
	PlayerEmbedColor,
	CharacterEmbedColor,
	ConfirmEmbedColor,
	ReportEmbedColor,
	CharacterData,
	PlayerData,
	ReportData,
	CardData,
	RandomRange,
	CalcGoldFromXP,
	EuroDateFunc,
	GenCardEmbed,
	RecalcCharacter,
	CharsAddToReport,
	GMsAddToReport,
	PublishSR,
    ConfirmRow,
} = require('../constants.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bold } = require('discord.js');



module.exports = {
	data: new SlashCommandBuilder().setName('newchar')
    .setDescription('Adds a new character to a player.')
    .addUserOption(option => option.setName('mention').setDescription('Player discord @mention').setRequired(true))
    .addStringOption(option => option.setName('character').setDescription('Name of the new character, captials matter').setMinLength(1).setMaxLength(30).setRequired(true))
    .addNumberOption(option => option.setName('startlevel').setDescription('Number of character slots').setRequired(true).addChoices(
        { name: '1', value: 1 },
        { name: '2', value: 2 })),
	async execute(interaction,client) {

        await interaction.deferReply();
        



    }
}