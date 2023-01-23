/* eslint-disable no-undef */
const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	RolePlayerGM,
	ReportEmbedColor,
	CharacterData,
} = require('../constants.js');


module.exports = {

	data: new SlashCommandBuilder().setName('infolevels')
		.setDescription('Gives information on the level speard of characters.'),
	async execute(interaction) {

		await interaction.deferReply();

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {

		

			CharacterLevelsUnclean = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
			TotalCharacters = 0;
			TotalLevels = 0;
			StringToSend = '';


			await CharacterData.find({
				Status: 'Approved' }).then((CharacterDatas) => {
				CharacterDatas.forEach((CharacterData) => {
					CharacterLevelsUnclean[CharacterData.Level] += 1;
					TotalCharacters += 1;
					TotalLevels += CharacterData.Level;
				});
			});

			StringToSend = 'Average Character Level: **' + String((TotalLevels / TotalCharacters).toFixed(2)) + '**\n';

			for (let index = 1; index < CharacterLevelsUnclean.length; index++) {
				const element = CharacterLevelsUnclean[index];
				StringToSend += 'Level **' + index + '**s: **' + element + '**\n';
			}


			const levelembed = new EmbedBuilder()
				.setColor(ReportEmbedColor)
				.setTitle('Info on Character Levels')
				.setDescription(StringToSend)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });

			let embedMessage = await interaction.update({ embeds: [levelembed] });

		}

		else {

			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
		}


	},
};

