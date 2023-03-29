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
	.addStringOption(option => option.setName('1-cardtag').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('1-qty').setDescription('Gold spent/gained').setMinValue(1).setMaxValue(99))
	.addStringOption(option => option.setName('2-cardtag').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('2-qty').setDescription('Gold spent/gained').setMinValue(1).setMaxValue(99))
	.addStringOption(option => option.setName('3-cardtag').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('3-qty').setDescription('Gold spent/gained').setMinValue(1).setMaxValue(99))
	.addStringOption(option => option.setName('4-cardtag').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('4-qty').setDescription('Gold spent/gained').setMinValue(1).setMaxValue(99))
	.addStringOption(option => option.setName('5-cardtag').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('5-qty').setDescription('Gold spent/gained').setMinValue(1).setMaxValue(99))
	.addStringOption(option => option.setName('6-cardtag').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('6-qty').setDescription('Gold spent/gained').setMinValue(1).setMaxValue(99))
	.addStringOption(option => option.setName('7-cardtag').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('7-qty').setDescription('Gold spent/gained').setMinValue(1).setMaxValue(99))
	.addStringOption(option => option.setName('8-cardtag').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('8-qty').setDescription('Gold spent/gained').setMinValue(1).setMaxValue(99)),

	async execute(interaction,client) {

        await interaction.deferReply();

        const PlayerDiscordID = interaction.user.id;
		let PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		let PlayerName = interaction.user


		const RecycleCard = [
			interaction.options.getString('1-cardtag'),
			interaction.options.getString('2-cardtag'),
			interaction.options.getString('3-cardtag'),
			interaction.options.getString('4-cardtag'),
			interaction.options.getString('5-cardtag'),
			interaction.options.getString('6-cardtag'),
			interaction.options.getString('7-cardtag'),
			interaction.options.getString('8-cardtag'),
		];

		const RecycleQty = [
			interaction.options.getNumber('1-qty'),
			interaction.options.getNumber('2-qty'),
			interaction.options.getNumber('3-qty'),
			interaction.options.getNumber('4-qty'),
			interaction.options.getNumber('5-qty'),
			interaction.options.getNumber('6-qty'),
			interaction.options.getNumber('7-qty'),
			interaction.options.getNumber('8-qty'),
		];

		



		if (PlayerName == undefined) {
            await interaction.editReply({ content: 'No such player(s) in database or other error.' });
			return;
		}

        let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
	

		if (QueryPlayerInfo !== null) {

			let CardOnList = QueryPlayerInfo.CardCollection.findIndex(item => item.CardTag == RecycleCard);


			const MergedItem = [] 
			let ConfirmItemList = ""

			for (let index = 0; index < 8; index++) {
			if (RecycleCard[index] != null && RecycleQty[index] != null){

				let CardOnList = QueryPlayerInfo.CardCollection.findIndex(item => item.CardTag == RecycleCard[index]);
				let CARDNAME
				try {
					 CARDNAME = QueryPlayerInfo.CardCollection[CardOnList].CardName
				} catch (error) {
					 CARDNAME = "NAME NOT FOUND"
				}
				
				let Card = {
					Tag: RecycleCard[index],
					Qty: RecycleQty[index],
					Name: CARDNAME,
					Index: CardOnList
				}

				if (CardOnList === -1) {
					ConfirmItemList += `\n${index}. You do not have '${Card.Tag}'`;
					continue;
				}

				if (QueryPlayerInfo.CardCollection[CardOnList].quantity < RecycleQty) {
					ConfirmItemList += `\n${index}. You do not have enough cards of ${Card.Tag} - ${Card.Name}`;
					continue;
				}

				MergedItem.push(Card)
				ConfirmItemList += '\n'+`${index}. ${Card.Qty} copies of ${Card.Tag} - ${Card.Name}`
			}
			
			}


			if (MergedItem.length == 0){
				await interaction.editReply({ content: 'No cards around to recycle...' });
				return
			}
			
			let EmbedString = 'Do you wish to recycle the following:' + '\n\n' + ConfirmItemList;

			let ConfirmEmbed = new EmbedBuilder()
				.setColor(ConfirmEmbedColor)
				.setDescription(EmbedString)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });

			let embedMessage = await interaction.editReply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


			let collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			collector.on('collect', async interaction => {

				switch (interaction.customId) {

				case 'yes':

					QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
					let UpdateEmbedString = ""
					

					for (const ProcessedCard of MergedItem) {

							let CardTag = ProcessedCard.Tag.slice(0, 4);
					let CardCID = ProcessedCard.Tag.slice(4);
					let ForMessageCardName = ProcessedCard.Tag + " " + ProcessedCard.Name
					let CardOnList = QueryPlayerInfo.CardCollection.findIndex(item => item.CardTag == ProcessedCard.Tag);
					let ProcessedQty = ProcessedCard.Qty

					if (CardOnList === -1) {
						UpdateEmbedString += `\nYou do not have '${ProcessedCard.Tag}'.`;
						continue;
					}
		
		
					if (QueryPlayerInfo.CardCollection[CardOnList].quantity < ProcessedQty) {
						UpdateEmbedString +=  `\nYou do not have enough cards of ${ForMessageCardName}.`
						continue;
					}

					let InfoSetQuery = await CardData.findOne({
						Tag: CardTag,
					});


					if (InfoSetQuery !== undefined && InfoSetQuery !== null) {

						let SpecialMultipler = 1;

						if (InfoSetQuery.CardPool[0][CardCID].Special === true) {
							 SpecialMultipler = 2;
						}

						if (InfoSetQuery.CardPool[0][CardCID].Tier === 6) {
							SpecialMultipler = 5;
					   }

						const RPtoGIVE = InfoSetQuery.CardPool[0][CardCID].Level * SpecialMultipler * ProcessedQty;

						QueryPlayerInfo.RecycledPoints += RPtoGIVE;
						QueryPlayerInfo.CardNumber -= ProcessedQty;


						QueryPlayerInfo.CardCollection[CardOnList].quantity -= ProcessedQty;

						if (QueryPlayerInfo.CardCollection[CardOnList].quantity <= 0) {
							QueryPlayerInfo.CardCollection.splice(CardOnList, 1);
						}

						
						UpdateEmbedString += '\nYou have recycled **' + String(ProcessedQty) + '** copies of **' + ForMessageCardName + '** for **' + String(RPtoGIVE) + '** Recycle points.'
						

					}
					else {continue;}
						}

						QueryPlayerInfo.markModified('CardCollection');
						await QueryPlayerInfo.save();

						let UpdateEmbed = new EmbedBuilder()
						.setColor(ConfirmEmbedColor)
						.setDescription(UpdateEmbedString)
						.setTimestamp()
						.setFooter({ text: 'Absalom Living Campaign' });

					let UpdateEmbedMessage = await interaction.update({ embeds: [UpdateEmbed], components: [] });

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