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
		let PlayerName = await client.users.fetch(PlayerDiscordID);
		let CurrentDate = EuroDateFunc(new Date());
		let LastPullDate;
		let CanPull = false;


		if (typeof PlayerName === undefined) {
			return
		}
        let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });


		if (QueryPlayerInfo != null) {

			LastPullDate = EuroDateFunc(QueryPlayerInfo.LastPull);


			if (
				LastPullDate !== CurrentDate
			) {
				CanPull = true;
				QueryPlayerInfo.LastPull = new Date();

			}
			else if (QueryPlayerInfo.RecycledPoints >= 10) {
				CanPull = true;
				QueryPlayerInfo.RecycledPoints -= 10;
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


				let InfoSetQuery = await CardData.findOne({
					Active: true,
				});


				if (InfoSetQuery !== undefined && InfoSetQuery !== null) {
					let CardPulled;


					while (CardPulled === undefined) {


						if (PullTier === 6) {
							SizeOfPool = InfoSetQuery.Specials.length;
							if (SizeOfPool === 0) {
								Message = await interaction.editReply({ content: 'No Special cards to Pull found, scream at Danni.' });
								break;
							}

							CIDCardPulled = InfoSetQuery.Specials[RandomRange(0, SizeOfPool - 1)];

						}
						else {

							SizeOfPool = InfoSetQuery.CardPool[PullTier].length;

							if (SizeOfPool === 0) {
								PullTier -= 1;
								if (PullTier == 0) {
									Message = await interaction.editReply({ content: 'No cards to Pull found.' });
									break;
								}
							}
							CIDCardPulled = InfoSetQuery.CardPool[PullTier][RandomRange(0, SizeOfPool - 1)];
						}

						CardPulled = InfoSetQuery.CardPool[0][CIDCardPulled];


						let CardEmbed = GenCardEmbed(CardPulled, InfoSetQuery);
						let embedMessage = await interaction.editReply({ content: 'You have **' + String(QueryPlayerInfo.RecycledPoints) + '** Recycle Points left and you pulled: ', embeds: [CardEmbed] });

						let PulledCardTag = String(InfoSetQuery.Tag) + CIDCardPulled;


						IsCardOnList = QueryPlayerInfo.CardCollection.findIndex(item => item.CardTag == PulledCardTag);


						if (IsCardOnList === -1) {

							QueryPlayerInfo.CardCollection.push({ CardName: CardPulled.Name, CardTag: PulledCardTag, quantity: 1 });


						}
						else {
							QueryPlayerInfo.CardCollection[IsCardOnList].quantity += 1;
							QueryPlayerInfo.markModified('CardCollection');
						}

						QueryPlayerInfo.CardNumber += 1;

						if (CardPulled.Special == true) {
							QueryPlayerInfo.CardRating += (CardPulled.Level * 2);
						}
						else {
							QueryPlayerInfo.CardRating += CardPulled.Level;
						}

                        SortCards(QueryPlayerInfo)
						await QueryPlayerInfo.save();

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