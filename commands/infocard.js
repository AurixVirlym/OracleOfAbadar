const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	CardData,
	GenCardEmbed,
} = require('../constants.js');

module.exports = {
	data: new SlashCommandBuilder().setName('infocard')
    .setDescription('Gives info on a card.')
    .addStringOption(option => option.setName('card').setDescription('Card Tag').setMinLength(5).setRequired(true)),

	async execute(interaction,client) {

        await interaction.deferReply();
        
        let CardUnformatted = interaction.options.getString('card');
		let CardTag = CardUnformatted.slice(0, 4);
		let CardCID = CardUnformatted.slice(4);


		let InfoSetQuery = await CardData.findOne({
			Tag: CardTag
		});


		if (InfoSetQuery !== undefined && InfoSetQuery !== null) {

			const InfoCard = InfoSetQuery.CardPool[0][CardCID];


			if (InfoCard !== undefined) {


				let CardEmbed = GenCardEmbed(InfoCard, InfoSetQuery);
				let embedMessage = await interaction.editReply({ embeds: [CardEmbed] });

			}
			else {
				await interaction.editReply({
					content: 'Did not find Card ID.', embeds: [], components: [],
				});
				return;
			}

		}
		else {
			await interaction.editReply({
				content: 'Did not find Card Set.', embeds: [], components: [],
			});

			return;
		}


		return;




    }
}