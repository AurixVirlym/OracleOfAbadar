const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	CollecterTimeout,
	ConfirmEmbedColor,
	PlayerData,
    ConfirmRow,
	SortCards,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('tradecards')
	.setDescription('Trade one card for another with another player.')
	.addUserOption(option => option.setName('mention').setDescription('Mention of the player you wish to trade with.').setRequired(true))
	.addStringOption(option => option.setName('offer').setDescription('The Card Tag of the card you wish to give').setMinLength(5).setRequired(true))
	.addStringOption(option => option.setName('want').setDescription('The Card Tag of the card you wish to recieve').setMinLength(5).setRequired(true)),

	async execute(interaction,client) {

        await interaction.deferReply();
        
		// trader = person starting the trade
		// buyee = person being asked to trade
		let TraderDiscordID = interaction.user.id;
		let TraderDiscordMention = '<@' + TraderDiscordID + '>';
		let TraderName = await client.users.fetch(TraderDiscordID);

		let TraderCard = interaction.options.getString('offer');
		let BuyeeCard = interaction.options.getString('want');

		let BuyeeDiscordMention = interaction.options.getUser('mention');
		let BuyeeDiscordID = BuyeeDiscordMention.id
		BuyeeDiscordMention = '<@'+BuyeeDiscordID+">"
		let BuyeeName = BuyeeDiscordMention


		if (BuyeeDiscordID == TraderDiscordID) {
			await interaction.editReply({ content: 'No insider trading, stinky. https://cdn.discordapp.com/attachments/1055467462012964875/1055888466640126094/b38.jpg' });
			return;
		}


		if (TraderName !== undefined && BuyeeName === undefined) {
			
			return
		}

		let QueryBuyeeInfo = await PlayerData.findOne({ DiscordId: BuyeeDiscordMention });
		let QueryTraderInfo = await PlayerData.findOne({ DiscordId: TraderDiscordMention });
		

		if (QueryTraderInfo !== null && QueryBuyeeInfo !== null) {


			BuyeeCardOnList = QueryBuyeeInfo.CardCollection.findIndex(item => item.CardTag == BuyeeCard);
			TraderCardOnList = QueryTraderInfo.CardCollection.findIndex(item => item.CardTag == TraderCard);

			if (BuyeeCardOnList === -1) {
				await interaction.editReply({ content:  BuyeeDiscordMention + ' does not have the card.' });
				return;
			}

			if (TraderCardOnList === -1) {
				await interaction.editReply({ content:  'You do not have the card.' });
				return;
			}

			EmbedString = 'Do you wish trade "**'
            + QueryTraderInfo.CardCollection[TraderCardOnList].CardTag + ' - ' + QueryTraderInfo.CardCollection[TraderCardOnList].CardName
            + '**" to ' + BuyeeDiscordMention + ' for their **'
            + QueryBuyeeInfo.CardCollection[BuyeeCardOnList].CardTag + ' - ' + QueryBuyeeInfo.CardCollection[BuyeeCardOnList].CardName + '**';


			var ConfirmEmbed = new EmbedBuilder()
				.setColor(ConfirmEmbedColor)
				.setDescription(EmbedString)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });

			embedMessage = await interaction.editReply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


			var collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			collector.on('collect', async interaction => {
				let TradeAccepted = false;

				switch (interaction.customId) {
				case 'yes':

					EmbedString = TraderDiscordMention + ' has asked to trade their "**'
                + QueryTraderInfo.CardCollection[TraderCardOnList].CardTag + ' - ' + QueryTraderInfo.CardCollection[TraderCardOnList].CardName
                 + '**" to ' + BuyeeDiscordMention + ' for your **'
                 + QueryBuyeeInfo.CardCollection[BuyeeCardOnList].CardTag + ' - ' + QueryBuyeeInfo.CardCollection[BuyeeCardOnList].CardName +
                 '**\nDo you accept?';


					await interaction.update({
						embeds: [new EmbedBuilder()
							.setColor(ConfirmEmbedColor)
							.setDescription(EmbedString)
							.setTimestamp()
							.setFooter({ text: 'Absalom Living Campaign' }),
						], components: [ConfirmRow] });


					TradeAccepted = true;
					collector.stop();
					break;


				case 'no':
					await interaction.update({
						content: 'Cancelled.', embeds: [], components: [],
					});
					collector.stop();

					break;
				}

				collector = embedMessage.createMessageComponentCollector({
					filter: ({ user }) => user.id === BuyeeDiscordID, time: CollecterTimeout,
				});


				if (TradeAccepted === true) {
					collector.on('collect', async interaction => {

						switch (interaction.customId) {
						case 'yes':

						QueryBuyeeInfo = await PlayerData.findOne({ DiscordId: BuyeeDiscordMention });
						QueryTraderInfo = await PlayerData.findOne({ DiscordId: TraderDiscordMention });

						BuyeeCardOnList = QueryBuyeeInfo.CardCollection.findIndex(item => item.CardTag == BuyeeCard);
						TraderCardOnList = QueryTraderInfo.CardCollection.findIndex(item => item.CardTag == TraderCard);

						if (BuyeeCardOnList === -1) {
							await interaction.editReply({ content:  BuyeeDiscordMention + ' does not have the card.' });
							return;
						}
			
						if (TraderCardOnList === -1) {
							await interaction.editReply({ content:  'You do not have the card.' });
							return;
						}

							let TraderCardOnBuyeeList = QueryBuyeeInfo.CardCollection.findIndex(item => item.CardTag == TraderCard);
							let BuyeeCardOnTraderList = QueryTraderInfo.CardCollection.findIndex(item => item.CardTag == BuyeeCard);

							QueryBuyeeInfo.markModified('CardCollection');
							QueryTraderInfo.markModified('CardCollection');


							if (TraderCardOnBuyeeList == -1) {

								QueryBuyeeInfo.CardCollection.push({ CardName: QueryTraderInfo.CardCollection[TraderCardOnList].CardName, CardTag: TraderCard, quantity: 1 });

								QueryTraderInfo.CardCollection[TraderCardOnList].quantity -= 1;


							}
							else {
								QueryBuyeeInfo.CardCollection[TraderCardOnBuyeeList].quantity += 1;
								QueryTraderInfo.CardCollection[TraderCardOnList].quantity -= 1;


							}

							if (BuyeeCardOnTraderList == -1) {

								QueryTraderInfo.CardCollection.push({ CardName: QueryBuyeeInfo.CardCollection[BuyeeCardOnList].CardName, CardTag: BuyeeCard, quantity: 1 });

								QueryBuyeeInfo.CardCollection[BuyeeCardOnList].quantity -= 1;
								


							}
							else {
								

								QueryTraderInfo.CardCollection[BuyeeCardOnTraderList].quantity += 1;

								QueryBuyeeInfo.CardCollection[BuyeeCardOnList].quantity -= 1;

								

							}


							if (QueryBuyeeInfo.CardCollection[BuyeeCardOnList].quantity <= 0) {
								QueryBuyeeInfo.CardCollection.splice(BuyeeCardOnList, 1);
							}

							if (QueryTraderInfo.CardCollection[TraderCardOnList].quantity <= 0) {
								QueryTraderInfo.CardCollection.splice(TraderCardOnList, 1);
							}

							
							QueryBuyeeInfo = SortCards(QueryBuyeeInfo)
							QueryBuyeeInfo.markModified('CardCollection.[BuyeeCardOnList]');
							await QueryBuyeeInfo.save();

							QueryTraderInfo = SortCards(QueryTraderInfo)
							QueryTraderInfo.markModified('CardCollection.[TraderCardOnList]');
							await QueryTraderInfo.save();

							await interaction.update({
								content: 'Trade successful!', embeds: [], components: [] });

							break;


						case 'no':
							await interaction.update({
								content: 'Trade offer refused.', embeds: [], components: [],
							});
							collector.stop();
							break;
						}
					});
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