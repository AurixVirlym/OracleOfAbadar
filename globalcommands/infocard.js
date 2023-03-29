const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const {
	CardData,
	GenCardEmbed,
	CollecterTimeout,
} = require('../constants.js');

module.exports = {
	data: new SlashCommandBuilder().setName('infocard')
    .setDescription('Gives info on a card.')
    .addStringOption(option => option.setName('card').setDescription('Card Tag').setMinLength(4).setRequired(true)),

	async execute(interaction,client) {

        await interaction.deferReply();
        
        let CardUnformatted = interaction.options.getString('card');
		let CardTag = CardUnformatted.slice(0, 4);
		let CardCID = CardUnformatted.slice(4);


		let InfoSetQuery = await CardData.findOne({
			Tag: CardTag
		});


		if (InfoSetQuery !== undefined && InfoSetQuery !== null) {

			if (CardUnformatted.length > 4) {
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

		} else {

			let SetCardsFormatted = []

			for (let Card of InfoSetQuery.CardPool[0]) {
					let SpacedCardTag = InfoSetQuery.Tag + Card.CID
					let SpacedCardName = Card.Name
					let SpacedCardLevel = Card.Level
					let SpacedCardType = Card.Type
					
					while (SpacedCardTag.length < 8) {
						SpacedCardTag += '\xa0'
					}

					while (SpacedCardName.length < 30) {
						SpacedCardName += '\xa0'
					}

					while (SpacedCardLevel.length < 2) {
						SpacedCardLevel += '\xa0'
					}

					while (SpacedCardType.length < 10) {
						SpacedCardType += '\xa0'
					}

					SetCardsFormatted.push(
						'\n`' + SpacedCardTag + 
						' -  ' + SpacedCardName + 
					' - Lv: '+ SpacedCardLevel + " " + SpacedCardType +'`');
				} 


				let currentIndex = 0
				let ChangeInIndex = 20
	
				let DescReportDisplay = SetCardsFormatted.slice(currentIndex, currentIndex + ChangeInIndex).toString().replace(/,/g, '');

				let EmbedTitle = "Card Set: " + InfoSetQuery.Tag + " - Cards: " + InfoSetQuery.CardPoolSize

				const cardrowlist = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('backId')
						.setLabel('Previous')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('forwardId')
						.setLabel('Next')
						.setStyle(ButtonStyle.Primary),
				);


			const embed = new EmbedBuilder()
				//.setColor(ReportEmbedColor)
				.setTitle(EmbedTitle)
				.setDescription(DescReportDisplay)
				.setTimestamp()
				.setFooter({text: "Showing " + currentIndex + "-" + (ChangeInIndex + currentIndex) + " of " + SetCardsFormatted.length + ' - ALC Trading Card Game'});

			let embedMessage = await interaction.editReply({ embeds: [embed], components: [cardrowlist] });
	

			let collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			
			
			collector.on('collect', async interaction => {

            	


					// Increase/decrease index
					if (interaction.customId === 'forwardId' && currentIndex + ChangeInIndex - SetCardsFormatted.length < 0) {currentIndex += ChangeInIndex;}
					else if (currentIndex - ChangeInIndex >= 0 && interaction.customId === 'backId') {currentIndex -= ChangeInIndex;}


					DescReportDisplay = SetCardsFormatted.slice(currentIndex, currentIndex + ChangeInIndex).toString().replace(/,/g, '');
			

					// Respond to interaction by updating message with new embed
					await interaction.update({
						embeds: [new EmbedBuilder()
							.setTitle(EmbedTitle)
							.setDescription(DescReportDisplay)
							.setTimestamp()
							.setFooter({ text: "Showing " + currentIndex + "-" + (ChangeInIndex + currentIndex) + " of " + SetCardsFormatted.length + ' - ALC Trading Card Game' }),
						],

						components: [cardrowlist],
					});


				
			});










		}






		
		} else {
			await interaction.editReply({
				content: 'Did not find Card Set.', embeds: [], components: [],
			});

			return;
	
				
			}

			


		return;




    }
}