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
    .setDescription('Purchases or sells an items on a character you own. Give a negative value to sell an item.')
    .addStringOption(option => option.setName('character').setDescription('Character Name').setMinLength(1).setMaxLength(30).setRequired(true))
    .addStringOption(option => option.setName('1-item').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('1-gp').setDescription('Gold spent/gained').setMinValue(-9999).setMaxValue(9999))
	.addStringOption(option => option.setName('2-item').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('2-gp').setDescription('Gold spent/gained').setMinValue(-9999).setMaxValue(9999))
	.addStringOption(option => option.setName('3-item').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('3-gp').setDescription('Gold spent/gained').setMinValue(-9999).setMaxValue(9999))
	.addStringOption(option => option.setName('4-item').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('4-gp').setDescription('Gold spent/gained').setMinValue(-9999).setMaxValue(9999))
	.addStringOption(option => option.setName('5-item').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('5-gp').setDescription('Gold spent/gained').setMinValue(-9999).setMaxValue(9999))
	.addStringOption(option => option.setName('6-item').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('6-gp').setDescription('Gold spent/gained').setMinValue(-9999).setMaxValue(9999))
	.addStringOption(option => option.setName('7-item').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('7-gp').setDescription('Gold spent/gained').setMinValue(-9999).setMaxValue(9999))
	.addStringOption(option => option.setName('8-item').setDescription('Name of item purchased or sold.').setMinLength(1).setMaxLength(50))
    .addNumberOption(option => option.setName('8-gp').setDescription('Gold spent/gained').setMinValue(-9999).setMaxValue(9999)),

	async execute(interaction,client) {

        await interaction.deferReply();

        let PlayerDiscordID = interaction.user.id;
		let PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		let CharName = interaction.options.getString('character');
		

		const PurchasedItem = [
			interaction.options.getString('1-item'),
			interaction.options.getString('2-item'),
			interaction.options.getString('3-item'),
			interaction.options.getString('4-item'),
			interaction.options.getString('5-item'),
			interaction.options.getString('6-item'),
			interaction.options.getString('7-item'),
			interaction.options.getString('8-item'),
		];

		const PurchasedValue = [
			interaction.options.getNumber('1-gp'),
			interaction.options.getNumber('2-gp'),
			interaction.options.getNumber('3-gp'),
			interaction.options.getNumber('4-gp'),
			interaction.options.getNumber('5-gp'),
			interaction.options.getNumber('6-gp'),
			interaction.options.getNumber('7-gp'),
			interaction.options.getNumber('8-gp'),
		];

		const MergedItem = [] 
		let ConfirmItemList = []

		for (let index = 0; index < 8; index++) {
			if (PurchasedValue[index] != null && PurchasedItem[index] != null){


				let item = {
					Name: PurchasedItem[index],
					Value: PurchasedValue[index],
					Legacy: false
				}
				MergedItem.push(item)
				ConfirmItemList.push(String('\n`'+`${index}. ${item.Name} for ${item.Value} gp`+'`'))
			}
			
		}


		EmbedString = 'Do you wish to buy/sell on "**' + CharName + '**"\n\n**Item List:**' + ConfirmItemList;

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


				let PlayerName = interaction.user


				if (typeof PlayerName == undefined) {
                    return new Error('PlayerName was not defined.')
				}

                let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
				let QueryCharInfo = await CharacterData.findOne({ Name: CharName, BelongsTo: PlayerDiscordMention });

				if (QueryPlayerInfo != null && QueryCharInfo != null) {
					if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId) {

						let PurchaseDate = new Date();
						PurchaseDate = EuroDateFunc(PurchaseDate);

						let PurchaseEntry = {
							Date: PurchaseDate,
							Sold: 0,
							Brought: 0,
							Total: 0,
							Items: MergedItem
						}
						
						for (const Entry of MergedItem) {
							if (Entry.Value >= 0)
							{
								PurchaseEntry.Brought += Number(Entry.Value)
							} else {
								PurchaseEntry.Sold -= Number(Entry.Value)
							}
							PurchaseEntry.Total += Number(Entry.Value)
						}

						PurchaseEntry.Sold = PurchaseEntry.Sold.toFixed(2)
						PurchaseEntry.Sold = Number.parseFloat(PurchaseEntry.Sold)

						PurchaseEntry.Brought = PurchaseEntry.Brought.toFixed(2)
						PurchaseEntry.Brought = Number.parseFloat(PurchaseEntry.Brought)

						PurchaseEntry.Total = PurchaseEntry.Total.toFixed(2)
						PurchaseEntry.Total = Number.parseFloat(PurchaseEntry.Total)
						


						if (PurchaseEntry.Total > (QueryCharInfo.MaxGold - QueryCharInfo.SpentGold)){
							await interaction.update({ content: 'You can not afford the purchases by ' + (PurchaseEntry.Total - (QueryCharInfo.MaxGold - QueryCharInfo.SpentGold)) + "gp." , embeds: [], components: [] });
							return
						}

						if (PurchaseEntry.Total < 0 && PurchaseEntry.Total < -QueryCharInfo.SpentGold){
							await interaction.update({ content: 'Your sell values are greater than the items you have listed as having purchased.' , embeds: [], components: [] });
							return
						}

						
						
						
						
						
						
						QueryCharInfo.PurchaseLog.push(PurchaseEntry)
						
						QueryCharInfo.SpentGold += PurchaseEntry.Total
						QueryCharInfo.SpentGold = QueryCharInfo.SpentGold.toFixed(2)
						QueryCharInfo.SpentGold = Number.parseFloat(QueryCharInfo.SpentGold)
						

						EmbedString = 'Purchased/Sold on "**' + CharName + '**"\n\n**Item List:**' + ConfirmItemList;

						await QueryCharInfo.save()

						ConfirmEmbed = new EmbedBuilder()
							.setColor(ConfirmEmbedColor)
							.setDescription(EmbedString)
							.setTimestamp()
							.setFooter({ text: 'Absalom Living Campaign' });

					embedMessage = await interaction.update({ embeds: [ConfirmEmbed], components: [] });

						
						
					} else
						{
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