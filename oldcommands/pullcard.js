const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	PlayerData,
	CardData,
	RandomRange,
	EuroDateFunc,
	GenCardEmbed,
    SortCards,
} = require('../constants.js');

module.exports = {
	data: new SlashCommandBuilder().setName('pullcard')
    .setDescription('Gives one card. Usable once per day or if you have 10 Recycle Points. Daily is used before points.'),
	async execute(interaction,client) {

        await interaction.deferReply();

        let PlayerDiscordID = interaction.user.id;
		let PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		let PlayerName = interaction.user
		let CurrentDate = EuroDateFunc(new Date());
		let LastPullDate;
		let CanPull = false;


		if (typeof PlayerName === undefined) {
			return
		}
        let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });


		if (QueryPlayerInfo != null) {

			LastPullDate = EuroDateFunc(QueryPlayerInfo.LastPull);
			let PullType = false

			if (
				LastPullDate !== CurrentDate
			) {
				CanPull = true;
				PullType = "Daily"
				QueryPlayerInfo.LastPull = new Date();

			}
			else if (QueryPlayerInfo.RecycledPoints >= 10) {
				CanPull = true;
				PullType = "RP"
				
			}
			else {
				(
					Message = await interaction.editReply({ content: 'You have already pulled a card today and do not have enough recycle points.' })
				);
                return
			}


			if (CanPull === true) {

			

				const RngValue = RandomRange(0, 99);
				let PullTier = 1;
				
				if (RngValue >= 99) // eternal pull
				{PullTier = 7;}
				else

				if (RngValue >= 95) // special pull
				{PullTier = 6;}
				else

				if (RngValue >= 111) // disabled legendery pull
				{PullTier = 5;}
				else

				if (RngValue >= 111) // disabled master pull
				{PullTier = 4;}
				else

				if (RngValue >= 111) // disabled expert roll
				{PullTier = 3;}
				else

				if (RngValue >= 75) // trained roll
				{PullTier = 2;}
				else {PullTier = 1;} // untrained roll.

				let CardsPullable = [[],[],[],[],[],[],[],[]]
				let CardCIDAdjust = 0
				
				await CardData.find({
					Active: true,
				}).then((SetDatas) => {
					SetDatas.forEach((SetData) => {
						

						for (const card of SetData.CardPool[0]) {
							card.Tag = SetData.Tag
						}



						if (CardCIDAdjust != 0){
							
							
							for (let CardTier = 1; CardTier < 5; CardTier++) {

								

								for (let index = 0; index < SetData.CardPool[CardTier].length; index++) {
								
									SetData.CardPool[CardTier][index] += CardCIDAdjust
								}
								
							}

							for (let index = 0; index < SetData.Specials.length; index++) {
								
								SetData.Specials[index] += CardCIDAdjust
							}
						
							for (let index = 0; index < SetData.Eternals.length; index++) {
								
								SetData.Eternals[index] += CardCIDAdjust
							}
							

							
						}

						for (let CardTier = 0; CardTier < 5; CardTier++) {
							if (SetData.CardPool[CardTier].length !== 0)
						{
							CardsPullable[CardTier] = CardsPullable[CardTier].concat(SetData.CardPool[CardTier])
						}
						}
						CardsPullable[6] = CardsPullable[6].concat(SetData.Specials)
						CardsPullable[7] = CardsPullable[7].concat(SetData.Eternals)
					
						CardCIDAdjust += SetData.CardPool[0].length
						

					})
				})
				
				
				

				if (typeof CardsPullable !== undefined && CardsPullable !== null) {
					let CardPulled;


					while (CardPulled === undefined) {

						if (PullTier === 7) {
							SizeOfPool = CardsPullable[7].length;
							if (SizeOfPool === 0) {
								Message = await interaction.editReply({ content: 'No Eternals cards to Pull found, scream at Danni.' });
								break;
							}

							CIDCardPulled = CardsPullable[7][RandomRange(0, SizeOfPool - 1)];

						} else


						if (PullTier === 6) {
							SizeOfPool = CardsPullable[6].length;
							if (SizeOfPool === 0) {
								Message = await interaction.editReply({ content: 'No Special cards to Pull found, scream at Danni.' });
								break;
							}

							CIDCardPulled = CardsPullable[6][RandomRange(0, SizeOfPool - 1)];

						}
						else { 
							
						

							SizeOfPool = CardsPullable[PullTier].length;

							if (SizeOfPool === 0) {
								PullTier -= 1;
								if (PullTier == 0) {
									Message = await interaction.editReply({ content: 'No cards to Pull found.' });
									break;
								}
							}
							CIDCardPulled = CardsPullable[PullTier][RandomRange(0, SizeOfPool - 1)];
							
					
						}

						CardPulled = CardsPullable[0][CIDCardPulled];


						let InfoSetQuery = await CardData.findOne({ Tag: CardPulled.Tag })

						

						let PulledCardTag = String(CardPulled.Tag + CardPulled.CID)


						IsCardOnList = QueryPlayerInfo.CardCollection.findIndex(item => item.CardTag == PulledCardTag);


						if (IsCardOnList === -1) {
							let TypeShortened
							switch (CardPulled.Type) {
								case "Support":
									TypeShortened = "SUP"
									break;
								case "Controller":
									TypeShortened = "CON"
									break;
								case "Artillery ":
									TypeShortened = "ART"
									break;
								case "Artillery":
									TypeShortened = "ART"
									break;
								case "Striker":
									TypeShortened = "STR"
									break;
							}

							QueryPlayerInfo.CardCollection.push({ CardName: CardPulled.Name, CardTag: PulledCardTag, quantity: 1, CardLevel: CardPulled.Level, CardType: TypeShortened });


						}
						else {
							QueryPlayerInfo.CardCollection[IsCardOnList].quantity += 1;
							QueryPlayerInfo.markModified('CardCollection');
						}

						QueryPlayerInfo.CardNumber += 1;

						if (CardPulled.Special == true) {
							QueryPlayerInfo.CardRating += (CardPulled.Level * 2);
						}
						else if (CardPulled.Tier === 6){
							QueryPlayerInfo.CardRating += (CardPulled.Level * 5);
						} else {
							QueryPlayerInfo.CardRating += CardPulled.Level;
						}

						switch (PullType) {
							case "Daily":
								QueryPlayerInfo.LastPull = new Date();
								break;
						
							case "RP":
								QueryPlayerInfo.RecycledPoints -= 10;
								break;
						}

                        SortCards(QueryPlayerInfo)
						await QueryPlayerInfo.save();

						let CardEmbed = GenCardEmbed(CardPulled, InfoSetQuery);
						let embedMessage = await interaction.editReply({ content: 'You have **' + String(QueryPlayerInfo.RecycledPoints) + '** Recycle Points left and you pulled: ', embeds: [CardEmbed] });
						return
					}

				}
				else {

					Message = await interaction.editReply({ content: 'No set to Pull from found.' });
				}

			}

		}
		return;
        



    }
}