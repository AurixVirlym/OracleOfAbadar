const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	CollecterTimeout,
	ConfirmEmbedColor,
	PlayerData,
	CardData,
    ConfirmRow,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('recyclecards')
    .setDescription('Gives info on a card.')
    .addStringOption(option => option.setName('recyclecard').setDescription('The Card Tag of the card you wish to recycle.').setMinLength(5).setRequired(true))
    .addNumberOption(option => option.setName('quantity').setDescription('The quantity of cards you wish to recycle.').setRequired(true)),

	async execute(interaction,client) {

        await interaction.deferReply();

        const PlayerDiscordID = interaction.user.id;
		let PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		let PlayerName = await client.users.fetch(PlayerDiscordID);

		const RecycleCard = interaction.options.getString('recyclecard');
		const RecycleQty = interaction.options.getNumber('quantity');

		if (PlayerName == undefined) {
            await interaction.editReply({ content: 'No such player(s) in database or other error.' });
			return;
		}

        let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
	

		if (QueryPlayerInfo !== null) {

			let CardOnList = QueryPlayerInfo.CardCollection.findIndex(item => item.CardTag == RecycleCard);


			if (CardOnList === -1) {
				await interaction.editReply({ content:  'You does not have the card.' });
				return;
			}


			if (QueryPlayerInfo.CardCollection[CardOnList].quantity < RecycleQty) {
				await interaction.editReply({ content:  'You does not have enough cards.' });
				return;
			}


			let EmbedString = 'Do you wish recycle **' + String(RecycleQty) + '** copies of **' + QueryPlayerInfo.CardCollection[CardOnList].CardName + '**?';


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
					let CardTag = RecycleCard.slice(0, 4);
					let CardCID = RecycleCard.slice(4);
					let ForMessageCardName = QueryPlayerInfo.CardCollection[CardOnList].CardName;

					let InfoSetQuery = await CardData.findOne({
						Tag: CardTag,
					});


					if (InfoSetQuery !== undefined && InfoSetQuery !== null) {

						let SpecialMultipler = 1;

						if (InfoSetQuery.CardPool[0][CardCID].Special === true) {
							 SpecialMultipler = 2;
						}

						const RPtoGIVE = InfoSetQuery.CardPool[0][CardCID].Level * SpecialMultipler * RecycleQty;

						QueryPlayerInfo.RecycledPoints += RPtoGIVE;
						QueryPlayerInfo.CardNumber -= RecycleQty;


						QueryPlayerInfo.CardCollection[CardOnList].quantity -= RecycleQty;

						if (QueryPlayerInfo.CardCollection[CardOnList].quantity <= 0) {
							QueryPlayerInfo.CardCollection.splice(CardOnList, 1);
						}

						QueryPlayerInfo.markModified('CardCollection');
						await QueryPlayerInfo.save();

						await interaction.update({
							content: 'You have recycled **' + String(RecycleQty) + '** copies of **' + ForMessageCardName + '** for **' + String(RPtoGIVE) + '** Recycle points.', embeds: [], components: [],
						});

					}
					else {break;}


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
		}


		return;
        



    }
}