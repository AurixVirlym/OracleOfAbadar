const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	ReportEmbedColor,
	PlayerData,
} = require('../constants.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bold } = require('discord.js');



module.exports = {
	data: new SlashCommandBuilder().setName('infocardranking')
    .setDescription('Shows the ranking for top 24 card collections.')
    .addStringOption(option => option.setName('sort').setDescription('Sort Type').setRequired(true).addChoices(
        { name: 'Card Rating', value: "rating" },
        { name: 'Unique Cards', value: "unique" },
		{ name: 'Total Cards', value: "total" })),
	async execute(interaction,client) {

		await interaction.deferReply();

		let SortMethod = interaction.options.getString('sort');


		const EveryPlayer = []

        await PlayerData.find().then((PlayerDatas) => {
			PlayerDatas.forEach((PlayerData) => {
				EveryPlayer.push({
					PlayerID: PlayerData.DiscordId,
					NumberofCards: PlayerData.CardNumber,
					NumberofUniqueCards: PlayerData.CardCollection.length,
					CardRating: PlayerData.CardRating,
				})
			});
		});

       
        

		switch (SortMethod) {
			case 'total':
				EveryPlayer.sort((b, a) => a.NumberofCards - b.NumberofCards);
				break;
	
			case 'unique':
				EveryPlayer.sort((b, a) => a.NumberofUniqueCards - b.NumberofUniqueCards);
				break;
	
			case 'rating':
				EveryPlayer.sort((b, a) => (a.CardRating) - (b.CardRating));
				break;
	
	
			}
	
	
			
			let PlayersPlayedOnDisplay = EveryPlayer.slice(0, 23);
			
			let StringToReply = ""
			
			for (let index = 0; index < PlayersPlayedOnDisplay.length; index++) {
				const Element = PlayersPlayedOnDisplay[index];
	
				let SpacedTotal = String(Element.NumberofCards)
				let	SpacedUnique = String(Element.NumberofUniqueCards)
				let SpacedCR = String(Element.CardRating)
				let SpacedIndex = String(index) + ". "

				while (SpacedIndex.length < 4) {
					SpacedIndex += '\xa0'
				}
				SpacedIndex = "`"+SpacedIndex+"`"
				
				switch (SortMethod) {
					case 'total':
						StringToReply += '\n' + `${SpacedIndex}` + Element.PlayerID + " - **" + SpacedTotal + '** Total Cards.'
						break;
			
					case 'unique':
						StringToReply += '\n' + `${SpacedIndex}` + Element.PlayerID + " - **" + SpacedUnique + `** Unique Cards.`
						break;
			
					case 'rating':
						StringToReply += '\n' + `${SpacedIndex}` + Element.PlayerID + " - **" + SpacedCR + '** Card Rating.'
						break;
			
					}
				
			}

		
	
			const rowlist = new ActionRowBuilder()
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
				.setColor(ReportEmbedColor)
				.setTitle("Card Collection leaderboard. Sorted by " + SortMethod)
				.setDescription(StringToReply)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });
	
			let embedMessage = await interaction.editReply({ embeds: [embed] });


    }
}