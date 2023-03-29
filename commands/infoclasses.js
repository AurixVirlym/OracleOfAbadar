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

	data: new SlashCommandBuilder().setName('infoclasses')
		.setDescription('Gives information on the classes of characters, pulls data from cards only and approved only'),
	async execute(interaction) {

		await interaction.deferReply();

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {

			let CharacterClasses = [{ name: 'Alchemist', value: 0 },
			{ name: 'Barbarian', value: 0 },
			{ name: 'Bard', value: 0 },
			{ name: 'Champion', value: 0 },
			{ name: 'Cleric', value: 0 },
			{ name: 'Druid', value: 0 },
			{ name: 'Fighter', value: 0 },
			{ name :'Gunslinger', value: 0 },
			{ name: 'Inventor', value: 0 },
			{ name: 'Investigator', value: 0 },
			{ name: 'Magus', value: 0 },
			{ name: 'Monk', value: 0 },
			{ name: 'Oracle', value: 0 },
			{ name: 'Psychic', value: 0 },
			{ name: 'Ranger', value: 0 },
			{ name: 'Rogue', value: 0 },
			{ name: 'Sorcerer', value: 0 },
			{ name: 'Summoner', value: 0 },
			{ name: 'Swashbuckler', value: 0 },
			{ name: 'Thaumaturge', value: 0 },
			{ name: 'Witch', value: 0 },
			{ name: 'Wizard', value: 0 },
			{ name: "Not Set.", value: 0},]
			TotalCharacters = 0;

			await CharacterData.find({
				Status: 'Approved' }).then((CharacterDatas) => {
				CharacterDatas.forEach((CharacterData) => {

					if (CharacterData.Status == "Approved"){
						IsCharList = CharacterClasses.findIndex(item => item.name === CharacterData.CardClass);
						TotalCharacters += 1
					}

					
				if (IsCharList !== -1) {

					CharacterClasses[IsCharList].value += 1;
				}

				
				});
			});
			let StringToSend = "";
			for (const classes of CharacterClasses) {
				StringToSend += classes.name + ": " + classes.value + "\n"
			}


			const levelembed = new EmbedBuilder()
				.setColor(ReportEmbedColor)
				.setTitle('Info on Character Classes, total: ' + TotalCharacters)
				.setDescription(StringToSend)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });

			let embedMessage = await interaction.editReply({ embeds: [levelembed] });

		}

		else {

			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
		}


	},
};

