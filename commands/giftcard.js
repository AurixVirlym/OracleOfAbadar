const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	CollecterTimeout,
	ConfirmEmbedColor,
	PlayerData,
	CardData,
	GenCardEmbed,
    ConfirmRow,
	SortCards,
} = require('../constants.js');


module.exports = {
	data: new SlashCommandBuilder().setName('giftcard')
    .setDescription('Gift one card to another player')
    .addUserOption(option => option.setName('mention').setDescription('Mention of the player you wish to trade with.').setRequired(true))
    .addStringOption(option => option.setName('giftcard').setDescription('The Card Tag of the card you wish to gift').setMinLength(5).setRequired(true)),
	async execute(interaction,client) {

        await interaction.deferReply();
        
        // giver = person starting the trade
		// giftee = person being asked to trade
		
		
		let GiverDiscordID = interaction.user.id;
		let GiverDiscordMention = '<@' + GiverDiscordID + '>';
		let GiverName = await client.users.fetch(GiverDiscordID);

		let GiverCard = interaction.options.getString('giftcard');

		let GifteeDiscordMention = interaction.options.getUser('mention');
		let GifteeDiscordID = GifteeDiscordMention.id
		GifteeDiscordMention = '<@' + GifteeDiscordID + '>'


		let GifteeName = await client.users.fetch(GifteeDiscordID);
		
		

		if (GifteeDiscordID == GiverDiscordID) {
			await interaction.editReply({ content: 'No self giving, stinky. https://cdn.discordapp.com/attachments/1055467462012964875/1055888466640126094/b38.jpg' });
			return;
		}


		if (GiverName !== undefined && GifteeName === undefined) {
			await interaction.editReply({ content: 'No such player(s) in database or other error.' });
			return;
        }
		

        let QueryGifteeInfo = await PlayerData.findOne({ DiscordId: GifteeDiscordMention });
		let QueryGiverInfo = await PlayerData.findOne({ DiscordId: GiverDiscordMention });

		if (QueryGiverInfo !== null && QueryGifteeInfo !== null) {


			let GiverCardOnList = QueryGiverInfo.CardCollection.findIndex(item => item.CardTag == GiverCard);

			if (GiverCardOnList === -1) {
				await interaction.editReply({ content:  'You do not have the card.' });
				return;
			}

			let EmbedString = 'Do you wish gift "**'
    + QueryGiverInfo.CardCollection[GiverCardOnList].CardTag + ' - ' + QueryGiverInfo.CardCollection[GiverCardOnList].CardName
    + '**" to ' + GifteeDiscordMention;


			let ConfirmEmbed = new EmbedBuilder()
				.setColor(ConfirmEmbedColor)
				.setDescription(EmbedString)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });

			embedMessage = await interaction.editReply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


			let collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			collector.on('collect', async interaction => {


				switch (interaction.customId) {

				case 'yes':

				QueryGifteeInfo = await PlayerData.findOne({ DiscordId: GifteeDiscordMention });
				QueryGiverInfo = await PlayerData.findOne({ DiscordId: GiverDiscordMention });

					let GiverCardOnGifteeList = QueryGifteeInfo.CardCollection.findIndex(item => item.CardTag == GiverCard);


					if (GiverCardOnGifteeList === -1) {

						QueryGifteeInfo.CardCollection.push({ CardName: QueryGiverInfo.CardCollection[GiverCardOnList].CardName, CardTag: GiverCard, quantity: 1, CardLevel: QueryGiverInfo.CardCollection[GiverCardOnList].CardLevel, CardType: QueryGiverInfo.CardCollection[GiverCardOnList].CardType });
						QueryGiverInfo.CardCollection[GiverCardOnList].quantity -= 1;


					}
					else {
						QueryGifteeInfo.CardCollection[GiverCardOnGifteeList].quantity += 1;
						QueryGiverInfo.CardCollection[GiverCardOnList].quantity -= 1;

					}

					if (QueryGiverInfo.CardCollection[GiverCardOnList].quantity <= 0) {
						QueryGiverInfo.CardCollection.splice(GiverCardOnList, 1);
					}

					QueryGiverInfo.CardNumber -= 1;
					QueryGifteeInfo.CardNumber += 1;

					
					QueryGifteeInfo = SortCards(QueryGifteeInfo)
					QueryGifteeInfo.markModified('CardCollection');
					await QueryGifteeInfo.save();

					QueryGiverInfo = SortCards(QueryGiverInfo)
					QueryGiverInfo.markModified('CardCollection');
					await QueryGiverInfo.save();


					let CardTag = GiverCard.slice(0, 4);
					let CardCID = GiverCard.slice(4);


					let InfoSetQuery = await CardData.findOne({
						Tag: CardTag,
					});


					if (InfoSetQuery !== undefined && InfoSetQuery !== null) {

						const InfoCard = InfoSetQuery.CardPool[0][CardCID];


						if (InfoCard !== undefined) {

							var CardEmbed = GenCardEmbed(InfoCard, InfoSetQuery);


						}
						else {

							await interaction.update({
								content: 'Did not find Card ID to display but gifting was complete.', embeds: [], components: [],
							});
							break;
						}

					}
					else {
						await interaction.update({
							content: 'Did not find Card Set to display card but gifting was complete.', embeds: [], components: [],
						});

						break;
					}


					await interaction.update({
						content:  GiverDiscordMention + ' gave **' + GiverCard + '** to ' + GifteeDiscordMention, embeds: [CardEmbed], components: [] });
					collector.stop();
					break;


				case 'no':
					await interaction.update({
						content: 'Cancelled.', embeds: [], components: [],
					});
					collector.stop();

					break;
				}


			});


		}
		else {
			await interaction.editReply({ content: 'No such player(s) in database or other error.' });
			return;
		}

		return;



    }
}