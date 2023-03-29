const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const {
	CollecterTimeout,
	PlayerEmbedColor,
	ConfirmEmbedColor,
	PlayerData,
	RandomRange,
	WeekNumber,
	NumberTierToString,
	StringTierToNumber,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('expedition')
    .setDescription('Go a weekly expedition! See Pins in Card Gacha for an explanation.')
	.addStringOption(option => option.setName('card1').setDescription('Card Tag').setMinLength(5).setRequired(true))
	.addStringOption(option => option.setName('card2').setDescription('Card Tag').setMinLength(5).setRequired(true))
	.addStringOption(option => option.setName('card3').setDescription('Card Tag').setMinLength(5).setRequired(true))
	.addStringOption(option => option.setName('card4').setDescription('Card Tag').setMinLength(5).setRequired(true))
	.addNumberOption(option => option.setName('tier').setDescription('Tier of the Expedition.').addChoices(
        { name: 'Untrained', value: 1 },
        { name: 'Trained', value: 2 },
        { name: 'Expert', value: 3 },
        { name: 'Master', value: 4 },
        { name: 'Legendary', value: 5 }).setRequired(true)),


	async execute(interaction,client) {

        await interaction.deferReply();

		let PlayerDiscordID, PlayerDiscordMention, PlayerName
		let EmbedString =""
			 PlayerDiscordID = interaction.user.id;
			 PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
			 PlayerName = interaction.user
        
        let currentDate = new Date();

		let CardsUnformatted = [
			interaction.options.getString('card1'),
			interaction.options.getString('card2'),
			interaction.options.getString('card3'),
			interaction.options.getString('card4'),
		]

		
		let PickedTier = interaction.options.getNumber('tier')
		let ExpeditionStringTier = NumberTierToString(PickedTier)
		let LuckyExpeditionCheck = false
		
		if (typeof PlayerName === undefined) {
			return
		}

		const Expeditions = require('../Expeditions.json')

		const TieredExpeditions = Expeditions.filter(item => item.AcceptableTiers.includes(PickedTier));
		let PickedExpeditions = []
		
		for (let index = 0; index < 4; index++) {
			let ExpeditionIndex = Math.floor(RandomRange(0,(TieredExpeditions.length-1)))
			let PickedExpedition = TieredExpeditions[ExpeditionIndex]

			switch (index) {
				case 0:
					PickedExpedition.Difficulty = "Easy  "
					break;
				case 1:	
				case 2:
					PickedExpedition.Difficulty = "Normal"
					break;
				case 3:
					PickedExpedition.Difficulty = "Hard  "
					break;
			}

			EmbedString +=  '`'+ (index +1) + ". " + PickedExpedition.Difficulty + " - " + PickedExpedition.Name + '`\n'
			PickedExpeditions.push(TieredExpeditions[ExpeditionIndex])
		}


		let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
		
		if (QueryPlayerInfo != null) {

			let ExpeditionEntryType;

			if (QueryPlayerInfo.WeeklyExpedition.getUTCFullYear() === currentDate.getUTCFullYear())
			{
			
			if 	(WeekNumber(QueryPlayerInfo.WeeklyExpedition) === WeekNumber(currentDate)){
				
				if (QueryPlayerInfo.ExpeditionPasses <= 0){
					await interaction.editReply({ content: 'You already went on a expedition this week and have no Expedition Passes.'});
					return	
				} else {
					ExpeditionEntryType = "Expedition Pass"
				}
			} else {
				ExpeditionEntryType = "Weekly Expedition"
			}
			
			} else {
				ExpeditionEntryType = "Weekly Expedition"
			}



			if (PickedTier !== 1){
				let TierCheck = StringTierToNumber(QueryPlayerInfo.ExpeditionTier)
				if (TierCheck != PickedTier && TierCheck != 1){
					await interaction.editReply({ content: 'You can only go on **Untrained** or **' + QueryPlayerInfo.ExpeditionTier + "** Expeditions."});
					return
				} else if (TierCheck != PickedTier && TierCheck === 1){
					await interaction.editReply({ content: 'You can only go on **Untrained** Expeditions.'})
					return
			}
		}

			let hasDuplicate = CardsUnformatted.some((val, i) => CardsUnformatted.indexOf(val) !== i);

			if (hasDuplicate == true){
				await interaction.editReply({ content: 'Multiple of the same cards given.'});
				return;
			}

			let InfoCards = []


			EmbedString += "\n**Characters:**\n"

			for (let FullCardTag of CardsUnformatted) {
				let CardTag = FullCardTag.slice(0, 4);
				
				let CardOnList = QueryPlayerInfo.CardCollection.findIndex(item => item.CardTag == FullCardTag);

				if (CardOnList === -1) {
				await interaction.editReply({ content:  'You do not have the card:' + FullCardTag });
				return;
				}

			

				let InfoCard = QueryPlayerInfo.CardCollection[CardOnList]

				if (InfoCard.CardLevel > (PickedTier * 2)) {
				await interaction.editReply({ content: FullCardTag +" "+ InfoCard.CardName +  ' is above the Expedition Tier.' });
				return;
				}


				let SpacedCardTag = InfoCard.CardTag
				let SpacedCardName = InfoCard.CardName
				let SpacedCardLevel = InfoCard.CardLevel



					while (SpacedCardTag.length < 8) {
						SpacedCardTag += '\xa0'
					}

					while (SpacedCardName.length < 30) {
						SpacedCardName += '\xa0'
					}

					while (SpacedCardLevel.length < 2) {
						SpacedCardLevel += '\xa0'
					}

					EmbedString += '\n`' + SpacedCardTag + 
						' -  ' + SpacedCardName + 
					' - Lv: '+ SpacedCardLevel + " " + InfoCard.CardType + '`';
				



		}
	}

	if (QueryPlayerInfo.ExpeditionLucky <= 0){
		LuckyExpeditionCheck = true
		EmbedString += "\n\n:star: This expedition is **Lucky!** Your characters have a **+2** modifier to their roll. :star:"
	}

	
	
	let ConfirmEmbed = new EmbedBuilder()
		.setColor(ConfirmEmbedColor)
		.setTitle("Pick Your "+NumberTierToString(PickedTier) + " Expedition!")
		.setDescription(EmbedString)
		.setTimestamp()
		.setFooter({ text: 'Absalom Living Campaign' });

	const rowexpedition = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('0')
					.setLabel('Option 1')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('1')
					.setLabel('Option 2')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('2')
					.setLabel('Option 3')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('3')
					.setLabel('Option 4')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('no')
					.setLabel('Cancel')
					.setStyle(ButtonStyle.Primary),
				);

	let	embedMessage = await interaction.editReply({ embeds: [ConfirmEmbed], components: [rowexpedition] });


	let collector = embedMessage.createMessageComponentCollector({
		filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
	});


		collector.on('collect', async interaction => {

			switch (interaction.customId) {
			case "0"  :
			case "1"  :
			case "2"  :
			case '3'  :
			await interaction.deferUpdate();

			let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
		
		if (QueryPlayerInfo != null) {

			
			let ExpeditionEntryType;
			let DifficultyDCModifer = 0
			let DifficutlyRewardMultipier = 1
			PickedExpedition = PickedExpeditions[parseInt(interaction.customId)]
			
			switch (PickedExpedition.Difficulty) {
				case "Easy  ":
					DifficultyDCModifer = -1
					DifficutlyRewardMultipier = 0.75
					break;
				case "Normal":
					PDifficultyDCModifer = 0
					DifficutlyRewardMultipier = 1
					break;
				case "Hard  ":
					DifficultyDCModifer = 1
					DifficutlyRewardMultipier = 1.25
					break;
			}
			

			if (QueryPlayerInfo.WeeklyExpedition.getUTCFullYear() === currentDate.getUTCFullYear())
			{
				
			if 	(WeekNumber(QueryPlayerInfo.WeeklyExpedition) === WeekNumber(currentDate)){

				if (QueryPlayerInfo.ExpeditionPasses <= 0){
					await interaction.editReply({ content: 'You already went on a expedition this week and have no Expedition Passes.', components: []});
					return	
				} else {
					ExpeditionEntryType = "Expedition Pass"
				}
			} else {
				ExpeditionEntryType = "Weekly Expedition"
			}
			
			} else {
				ExpeditionEntryType = "Weekly Expedition"
			}



			if (PickedTier !== 1){
				let TierCheck = StringTierToNumber(QueryPlayerInfo.ExpeditionTier)
				if (TierCheck != PickedTier && TierCheck != 1){
					await interaction.editReply({ content: 'You can only go on **Untrained** or **' + QueryPlayerInfo.ExpeditionTier + "** Expeditions.", components: []});
					return
				} else if (TierCheck != PickedTier && TierCheck === 1){
					await interaction.editReply({ content: 'You can only go on **Untrained** Expeditions.', components: []})
					return
			}
		}


			let hasDuplicate = CardsUnformatted.some((val, i) => CardsUnformatted.indexOf(val) !== i);

			if (hasDuplicate == true){
				await interaction.editReply({ content: 'Multiple of the same cards given.', components: []});
				return;
			}

			let InfoCards = []


			for (let FullCardTag of CardsUnformatted) {
				let CardTag = FullCardTag.slice(0, 4);
				
				let CardOnList = QueryPlayerInfo.CardCollection.findIndex(item => item.CardTag == FullCardTag);

				if (CardOnList === -1) {
				await interaction.editReply({ content:  'You do not have the card:' + FullCardTag , components: []});
				return;
				}

			

				let InfoCard = QueryPlayerInfo.CardCollection[CardOnList]

				if (InfoCard.CardLevel > (PickedTier * 2)) {
				await interaction.editReply({ content: FullCardTag +" "+ InfoCard.CardName +  ' is above the Expedition Tier.' , components: []});
				return;
				}
				InfoCard.Set = CardTag
				InfoCards.push(InfoCard)
			


		}

		

		let SuccessPool = 0
		let RPtoAward = 0
		let LuckyModifer = 0
		let TypeDuplicateArray = []
		let ExpeditionDC = (2 + (PickedTier*2)) + DifficultyDCModifer
		let FullResultMessage = PickedExpedition.Description + "\n\n" + "DC of Expedition: **" + ExpeditionDC +"**\n" 

		if (PickedTier == 1){
			ExpeditionDC += -1
		}

		if (PickedTier == 5) {
			ExpeditionDC += 1
		}

		if (LuckyExpeditionCheck == true)
		{
			LuckyModifer = 2
			QueryPlayerInfo.ExpeditionLucky = 19
		}

		for (const Card of InfoCards) {
			let CardRoll = RandomRange(1,6)
			let RollAfterDC = CardRoll - ExpeditionDC + Card.CardLevel + LuckyModifer
			TypeDuplicateArray.push(Card.CardType)
			let ResultMessage;
		if (RollAfterDC >= 3){
			ResultMessage = "**+2 VPs** - " + Card.CardTag + " " + Card.CardName  + " has **Critically Succeeded** - "+ (CardRoll+Card.CardLevel+LuckyModifer) + "("+CardRoll+")" + "\n"
			SuccessPool += 2
		} else if (RollAfterDC >= 0){
			ResultMessage ="**+1 VP** - " + Card.CardTag+ " " + Card.CardName + " has **Succeeded** - "+ (CardRoll+Card.CardLevel+LuckyModifer) + "("+CardRoll+")" + "\n"
			SuccessPool += 1
		} else if (RollAfterDC <= -3){
			ResultMessage = "**-1 VP** - " +Card.CardTag+ " " + Card.CardName + " has **Critically Failed** - "+ (CardRoll+Card.CardLevel+LuckyModifer) + "("+CardRoll+")" + "\n"
			SuccessPool -= 1
		} else if (RollAfterDC < 0){
			ResultMessage = "**+0 VP** - " +Card.CardTag+ " " + Card.CardName + " has **Failed** - "+ (CardRoll+Card.CardLevel+LuckyModifer) + "("+CardRoll+")" + "\n"
		}

		FullResultMessage += ResultMessage
		}

		FullResultMessage += "\n"

		let TypeDuplicateCheck = TypeDuplicateArray.some((val, i) => TypeDuplicateArray.indexOf(val) !== i);

			if (TypeDuplicateCheck == false){
			SuccessPool += 1
			FullResultMessage += "*Balanced Party bonus!* **+1 VP**\n\n"
			}

			FullResultMessage += "You have scored **" + SuccessPool + "** Victory Points!\n\n"
		
		if (SuccessPool >= 4) {
			FullResultMessage += PickedExpedition.SuccessMessage + "\n\n"
			let NextTier = PickedTier+1
			if (NextTier == 6) {
				FullResultMessage += "Expedition **Successfull!** You have cleared a Legendary Expedition, you are now reset back to **Untrained** Expeditions.\n"
				QueryPlayerInfo.ExpeditionTier = "Untrained"
			} else
		{
			FullResultMessage += "Expedition **Successfull!** You may next attempt a **" +  NumberTierToString(NextTier) + "** Expedition or reset back to **Untrained**.\n"
			QueryPlayerInfo.ExpeditionTier = NumberTierToString(NextTier)
		}
			RPtoAward = Math.ceil((4 + ((SuccessPool-2)*0.5))* 1.5 * (PickedTier*1.32) *DifficutlyRewardMultipier)
			FullResultMessage += "You gained **" + RPtoAward +"** Recycle Points!\n"
			
		} else {
			FullResultMessage += PickedExpedition.FailMessage + "\n\n"
			FullResultMessage += "Expedition **Failed!** You have reset back down to **Untrained** Expeditions\n"
			RPtoAward = Math.ceil((SuccessPool) * (PickedTier))

			if(RPtoAward < 0){ RPtoAward = 0}

			QueryPlayerInfo.ExpeditionTier = "Untrained"
			FullResultMessage += "You gained **" + RPtoAward +"** Recycle Points!\n"
		}

		if (LuckyExpeditionCheck == false) {
			let LuckyRoll =	RandomRange(0,19)
			if (QueryPlayerInfo.ExpeditionLucky <= 0){
				FullResultMessage += "\n:star: Your Expedition is Lucky, granting every card a +2 to their roll! :star:"
			} else
			
			if (LuckyRoll >= QueryPlayerInfo.ExpeditionLucky){
				QueryPlayerInfo.ExpeditionLucky = 0
				FullResultMessage += "\n:star: Your next Expedition is **Lucky**, granting every character a **+2** modifier to their roll! :star:"
			} else if (SuccessPool >= 4){
				QueryPlayerInfo.ExpeditionLucky -= 1
			} else {
				QueryPlayerInfo.ExpeditionLucky -= 3
			}
		}
		
		QueryPlayerInfo.RecycledPoints += RPtoAward

		if (ExpeditionEntryType == "Weekly Expedition"){
			QueryPlayerInfo.WeeklyExpedition = new Date()
		} else if (ExpeditionEntryType == "Expedition Pass") {
			QueryPlayerInfo.ExpeditionPasses -= 1
		} 
		

		QueryPlayerInfo.save()
		

		let ExpeditionEmbed = new EmbedBuilder()
				.setColor(PlayerEmbedColor)
				.setTitle(PickedExpedition.Name+ " - " + ExpeditionStringTier + " " + ExpeditionEntryType)
				.setDescription(FullResultMessage)
				.setTimestamp()
				.setFooter({ text: QueryPlayerInfo.ExpeditionPasses + ' Expedition Passes Left - ALC Trading Card Game' });

		let embedMessage = await interaction.editReply({ embeds: [ExpeditionEmbed], components: [] });

		return
}

			

				
				
				collector.stop();

				return;

			case 'no':
				await interaction.update({
					content: 'Cancelled.', embeds: [], components: [],
				});
				collector.stop();
				return;

			}

		});
		
	
	
		

}}