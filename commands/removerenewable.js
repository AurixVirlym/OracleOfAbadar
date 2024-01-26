const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder ,SlashCommandBuilder, Routes} = require('discord.js');
const {
	ConsumableBudgetAtLevel,
	PlayerEmbedColor,
	CollecterTimeout,
	ConfirmEmbedColor,
	CharacterData,
	PlayerData,
	EuroDateFunc,
    ConfirmRow,
} = require('../constants.js');




module.exports = {
	data: new SlashCommandBuilder().setName('removerenewable')
    .setDescription('Removes a renewable item to your character.')
    .addStringOption(option => option.setName('character').setDescription('Character Name').setMinLength(1).setMaxLength(30).setRequired(true)),

	async execute(interaction,client) {

        await interaction.deferReply();

        let PlayerDiscordID = interaction.user.id;
		let PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		let CharName = interaction.options.getString('character');
		

	

	/*	const MergedItem = [] 
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

		


		EmbedString = 'Do you wish to add these renewable items to "**' + CharName + '**"\n\n**Renewable List:**' + ConfirmItemList;

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

			*/

				let PlayerName = interaction.user


				if (typeof PlayerName == undefined) {
                    return new Error('PlayerName was not defined.')
				}

                let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
				let QueryCharInfo = await CharacterData.findOne({ Name: CharName, BelongsTo: PlayerDiscordMention });

				if (QueryPlayerInfo != null && QueryCharInfo != null) {
					if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId) {

						const ConsumableLogInfo = [];
						let NumberOfConsumableLogs = QueryCharInfo.ConsumableLog.length;

						if (NumberOfConsumableLogs == 0){
							await interaction.editReply({ content: QueryCharInfo.Name + ' has no renewables to remove from their budget.', embeds: [], components: [] });
						return;
						}


						for (let index = 0; index < NumberOfConsumableLogs; index++) {
		

							const Item = QueryCharInfo.ConsumableLog[index];
			
							let SpacedIndex = String(index + ".")
							let SpacedValue = String(Item.Value) + " gp"
							let SpacedName = String(Item.Name)
			
							let ConsuambleString= `${SpacedIndex} ${SpacedValue} - ${SpacedName}`
							ConsuambleString = "\n`" + ConsuambleString + "`"
							
							ConsumableLogInfo.push(ConsuambleString);
			
			
						}


						



					let currentIndex = 0
					let rowsconsumableselect;
					let rowsconsumableselect3 = new ActionRowBuilder()
					let StringConsumableLog;
					let SelectedItems = []

					rowsconsumableselect3.addComponents(
						new ButtonBuilder()
							.setCustomId('backId')
							.setLabel('Previous')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId('forwardId')
							.setLabel('Next')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId("yes")
							.setLabel("Confirm")
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId("no")
							.setLabel("Cancel")
							.setStyle(ButtonStyle.Primary))


					function GenConsumablePage(ConsumableLogInfo,currentIndex) {
						
						let rowsconsumableselect1 = new ActionRowBuilder()
						let rowsconsumableselect2 = new ActionRowBuilder()
						let RowSize = 0
						for (let index = currentIndex; index < ConsumableLogInfo.length; index++) {
		
							if (index < currentIndex+5){
								rowsconsumableselect1.addComponents(
									new ButtonBuilder()
										.setCustomId(String(index))
										.setLabel(String(index))
										.setStyle(ButtonStyle.Primary))
							} else {
	
								rowsconsumableselect2.addComponents(
								new ButtonBuilder()
									.setCustomId(String(index))
									.setLabel(String(index))
									.setStyle(ButtonStyle.Primary))
								}
								RowSize += 1

							if (index >= currentIndex+9){
								break
							}
							
						}

						if (RowSize >= 6 ){
							rowsconsumableselect = [rowsconsumableselect1,rowsconsumableselect2,rowsconsumableselect3]
						} else {
							rowsconsumableselect = [rowsconsumableselect1,rowsconsumableselect3]
						}

						StringConsumableLog =  ConsumableLogInfo.slice(currentIndex, currentIndex + RowSize).toString();
					}

					GenConsumablePage(ConsumableLogInfo,currentIndex)


					let InfoCharEmbed = new EmbedBuilder()
						.setColor(PlayerEmbedColor)
						.setTitle(PlayerName.username + ` - ` + QueryCharInfo.Name)
						.setDescription(StringConsumableLog + "\nItems selected to sell: " + String(SelectedItems))
						.setTimestamp()
						.setFooter({ text: ' Absalom Living Campaign' });
				
					embedMessage = await interaction.editReply({ embeds: [InfoCharEmbed], components: rowsconsumableselect });


					let MaxIndexDisplay = 10
					let MaxIndexLength = ConsumableLogInfo.length;

					let collector = embedMessage.createMessageComponentCollector({
						filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
					});

					collector.on('collect', async interaction => {

						if (interaction.customId === 'no'){
						await interaction.update({
							content: 'Cancelled.', embeds: [], components: [],
						});
						collector.stop();
						return
						}
				
						if (interaction.customId === 'yes'){


						if (SelectedItems.length === 0){
							await interaction.update({
								content: 'You did not select any items to remove from the budget.', embeds: [], components: [],
							});
							collector.stop();
							return
						}
						let MergedItem = []
						ConfirmItemList = []

						for (const iterator of SelectedItems) {
							let item = QueryCharInfo.ConsumableLog[iterator]
							ConfirmItemList.push(String('\n`'+`${iterator}. ${item.Name} worth ${item.Value} gp`+'`'))
							item.Value = item.Value*-1
							MergedItem.push(item)
						}

						QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
						QueryCharInfo = await CharacterData.findOne({ Name: CharName, BelongsTo: PlayerDiscordMention });
		
						if (QueryPlayerInfo != null && QueryCharInfo != null) {
							if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId) {
		
								let PurchaseDate = new Date();
								PurchaseDate = EuroDateFunc(PurchaseDate);
		
								let PurchaseEntry = {
									Date: PurchaseDate,
									Sold: 0,
									Brought: 0,
									Total: 0,
									Items: MergedItem,
									Renewable: true
								}
								
								for (const Entry of MergedItem) {
										PurchaseEntry.Sold -= Number(Entry.Value)
										PurchaseEntry.Total += Number(Entry.Value)
								}
		
								PurchaseEntry.Sold = PurchaseEntry.Sold.toFixed(2)
								PurchaseEntry.Sold = Number.parseFloat(PurchaseEntry.Sold)
		
								PurchaseEntry.Total = PurchaseEntry.Total.toFixed(2)
								PurchaseEntry.Total = Number.parseFloat(PurchaseEntry.Total)
								
								
								QueryCharInfo.PurchaseLog.push(PurchaseEntry)

								SelectedItems.sort((b, a) => a - b);
		
								for (const Entry of SelectedItems) {
								QueryCharInfo.ConsumableLog.splice(Entry,1)
								}

								QueryCharInfo.markModified('ConsumableLog');
		
								QueryCharInfo.SpentBudget += PurchaseEntry.Total
								QueryCharInfo.SpentBudget = QueryCharInfo.SpentBudget.toFixed(2)
								QueryCharInfo.SpentBudget = Number.parseFloat(QueryCharInfo.SpentBudget)
								
		
								EmbedString = 'Removed Renewables on "**' + CharName + '**"\n\n**Renewable List:**' + ConfirmItemList;
		
								await QueryCharInfo.save()
		
								ConfirmEmbed = new EmbedBuilder()
									.setColor(ConfirmEmbedColor)
									.setDescription(EmbedString)
									.setTimestamp()
									.setFooter({ text: 'Absalom Living Campaign' });
		
							await interaction.update({ embeds: [ConfirmEmbed], components: [] });
							collector.stop();
							return



							
						}
					}

				}
					

					if (interaction.customId === 'forwardId' && currentIndex + MaxIndexDisplay - MaxIndexLength < 0) 
					{
						currentIndex += MaxIndexDisplay;
						GenConsumablePage(ConsumableLogInfo,currentIndex)
					}
					else if (interaction.customId === 'backId') 
					{
						currentIndex -= MaxIndexDisplay;
						if (currentIndex < 0)
						{
							currentIndex = 0
						}
						GenConsumablePage(ConsumableLogInfo,currentIndex)
					} else if (interaction.customId !== 'forwardId' && interaction.customId !== 'backId')  {
						
						let isonlist = (element) => element == parseInt(interaction.customId);

						let SelectedItemOnList = SelectedItems.findIndex(isonlist);

						if (SelectedItemOnList == -1){
						SelectedItems.push(parseInt(interaction.customId))
					} else {
						SelectedItems.splice(SelectedItemOnList, 1);
					}
					}

					let InfoCharEmbed = new EmbedBuilder()
						.setColor(PlayerEmbedColor)
						.setTitle(PlayerName.username + ` - ` + QueryCharInfo.Name)
						.setDescription(StringConsumableLog + "\nItems selected to sell: \n" + String(SelectedItems))
						.setTimestamp()
						.setFooter({ text: ' Absalom Living Campaign' });
				
					await interaction.update({ embeds: [InfoCharEmbed], components: rowsconsumableselect });


					}

						
						
						
					)
				
				} else
						{
						await interaction.editReply({ content: 'Character does not belong to you, get your own, stinky.', embeds: [], components: [] });
						return;
					}

				}
				else {
					await interaction.editReply({ content: 'Did not find all the database entries. Check for typos.', embeds: [], components: [] });
					return;
				}
				

				

			
		
		}
        



    }
