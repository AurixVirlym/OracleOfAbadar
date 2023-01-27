const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	CollecterTimeout,
	ConfirmEmbedColor,
	CharacterData,
	PlayerData,
	EuroDateFunc,
    ConfirmRow,
} = require('../constants.js');




module.exports = {
	data: new SlashCommandBuilder().setName('purchase')
    .setDescription('Purchases or sells an item on a character you own. Give a negative value to sell an item.')
    .addStringOption(option => option.setName('character').setDescription('Character Name').setMinLength(1).setMaxLength(30).setRequired(true))
    .addStringOption(option => option.setName('item').setDescription('Name of item(s) purchased or sold.').setMinLength(1).setMaxLength(80).setRequired(true))
    .addNumberOption(option => option.setName('gp').setDescription('Gold spent/gained').setMinValue(-9999).setMaxValue(9999).setRequired(true)),

	async execute(interaction,client) {

        await interaction.deferReply();

        let PlayerDiscordID = interaction.user.id;
		let PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		let CharName = interaction.options.getString('character');
		let PurchasedItem = interaction.options.getString('item');
		let PurchasedValue = interaction.options.getNumber('gp');


		if (CharName == null || PurchasedItem == null || PurchasedValue == null) {
			interaction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		else if (PurchasedItem.length >= 80) {
			interaction.editReply({ content: 'Name is too long.' });
			return;
		}


		EmbedString = 'Do you wish to buy/sell "**' + PurchasedItem + '**"' + ' for **' + PurchasedValue + ' gp** on "**' + CharName + '**"';

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


				let PlayerName = await client.users.fetch(PlayerDiscordID);


				if (typeof PlayerName == undefined) {
                    return new Error('PlayerName was not defined.')
				}

                let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
				let QueryCharInfo = await CharacterData.findOne({ Name: CharName });

				if (QueryPlayerInfo != null && QueryCharInfo != null) {

                    let PurchaseEntry;

					if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId) {

						let PurchaseDate = new Date();
						PurchaseDate = EuroDateFunc(PurchaseDate);

						if (PurchasedValue >= 0) {
							RemainingGold = (QueryCharInfo.MaxGold - QueryCharInfo.SpentGold).toFixed(2);
							if (PurchasedValue <= RemainingGold) {
								PurchaseEntry = [PurchaseDate, 'Bought: ', PurchasedItem, PurchasedValue]; // date,sold/bought,item,value.
								QueryCharInfo.PurchaseLog.push(PurchaseEntry);
								QueryCharInfo.SpentGold = (QueryCharInfo.SpentGold + PurchasedValue).toFixed(2);

								await QueryCharInfo.save();
								await interaction.update({ content: 'Added Entry: ' + '"' + PurchaseEntry[0] + ' - ' + PurchaseEntry[1] + PurchaseEntry[2] + ' for ' + PurchaseEntry[3] + ' gp."' + ' to ' + QueryCharInfo.Name + '.', embeds: [], components: [] });

							}
							else {await interaction.update({ content: QueryCharInfo.Name + ' can\'t afford this item.', embeds: [], components: [] });}

						}
						else if (PurchasedValue < 0) {

							if (QueryCharInfo.SpentGold >= PurchasedValue) {
								PurchaseEntry = [PurchaseDate, 'Sold: ', PurchasedItem, PurchasedValue]; // date,sold/bought,item,value.
								QueryCharInfo.PurchaseLog.push(PurchaseEntry);
								QueryCharInfo.SpentGold = (QueryCharInfo.SpentGold + PurchasedValue).toFixed(2);

								await QueryCharInfo.save();
								await interaction.update({ content: 'Added Entry: ' + '"' + PurchaseEntry[0] + ' - ' + PurchaseEntry[1] + PurchaseEntry[2] + ' for ' + PurchaseEntry[3] + ' gp"' + ' to ' + QueryCharInfo.Name + '.', embeds: [], components: [] });

							}
							else {await interaction.update({ content: QueryCharInfo.Name + ' never spent this much gp.', embeds: [], components: [] });}

						}
						else {
							await interaction.update({ content: 'ERR', embeds: [], components: [] });
						}


					}
					else {
						await interaction.update({ content: 'Character does not belong to you, get your own, stinky.', embeds: [], components: [] });
						break;
					}

				}
				else {
					await interaction.update({ content: 'Did not find all the database entries. Check for typos.', embeds: [], components: [] });
					break;
				}
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
}