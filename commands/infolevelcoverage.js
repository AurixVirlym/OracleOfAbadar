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

	data: new SlashCommandBuilder().setName('infolevelcoverage')
		.setDescription('Gives information on the level coverage of player.')
		.addBooleanOption(option => option.setName('ranged').setDescription('Display the information in spell rank ranges.')),
		
	async execute(interaction) {

		await interaction.deferReply();

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {
			
			let LevelRanging = interaction.options.getBoolean('ranged')


			if (LevelRanging == true){

				CharacterLevelsUnclean = [0, 0, 0, 0, 0, 0];
			PlayerNamesByLevel= [[], [], [], [], [], []];
			PlayerNames= [];
			TotalPlayers = 0;
			TotalLevels = 0;
			StringToSend = '';

			await CharacterData.find({
				Status: 'Approved' }).then((CharacterDatas) => {
				CharacterDatas.forEach((CharacterData) => {

					LevelToUse = Math.max(Math.ceil(CharacterData.Level / 2),1)

					if (!PlayerNames.includes(CharacterData.BelongsTo)){
					TotalPlayers++
					PlayerNames.push(CharacterData.BelongsTo)
					};

					if (!PlayerNamesByLevel[LevelToUse].includes(CharacterData.BelongsTo)){

					CharacterLevelsUnclean[LevelToUse] += 1;
					PlayerNamesByLevel[LevelToUse].push(CharacterData.BelongsTo)

					};
				});
				
			});

			StringToSend = 'Total players with approved characters: **' + String((TotalPlayers).toFixed(2)) + '**\n';

			for (let index = 1; index < CharacterLevelsUnclean.length; index++) {
				const element = CharacterLevelsUnclean[index];
				StringToSend += 'Level **' + ((index*2)-1) + "-" + (index*2) +'** Coverage: **' + String(((element/TotalPlayers)*100).toFixed(2)) + '%** Players:'+String(element)+ '\n';
			}

			} else {

			CharacterLevelsUnclean = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
			PlayerNamesByLevel= [[], [], [], [], [], [], [], [], [], [], []];
			PlayerNames= [];
			TotalPlayers = 0;
			TotalLevels = 0;
			StringToSend = '';


			await CharacterData.find({
				Status: 'Approved' }).then((CharacterDatas) => {
				CharacterDatas.forEach((CharacterData) => {

					if (!PlayerNames.includes(CharacterData.BelongsTo)){
					TotalPlayers++
					PlayerNames.push(CharacterData.BelongsTo)
					};

					if (!PlayerNamesByLevel[CharacterData.Level].includes(CharacterData.BelongsTo)){

					CharacterLevelsUnclean[CharacterData.Level] += 1;
					PlayerNamesByLevel[CharacterData.Level].push(CharacterData.BelongsTo)

					};
				});
				
			});

			StringToSend = 'Total players with approved characters: **' + String((TotalPlayers).toFixed(2)) + '**\n';

			for (let index = 1; index < CharacterLevelsUnclean.length; index++) {
				const element = CharacterLevelsUnclean[index];
				StringToSend += 'Level **' + index + '** Coverage: **' + String(((element/TotalPlayers)*100).toFixed(2))  + '%** Players:'+String(element)+ '\n';
			}

		}

			const levelembed = new EmbedBuilder()
				.setColor(ReportEmbedColor)
				.setTitle('Info on Level Coverage')
				.setDescription(StringToSend)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });

			await interaction.editReply({ embeds: [levelembed] });

		}

		else {

			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
		}


	},
};

