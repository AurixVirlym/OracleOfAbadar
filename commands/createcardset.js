const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	RoleBotAdmin,
	CharacterData,
	CardData,
	RandomRange,
} = require('../constants.js');
const isImageURL = require('image-url-validator').default;



module.exports = {
	data: new SlashCommandBuilder().setName('createcardset')
    .setDescription('Admin ONLY.'),

	async execute(interaction,client) {

        await interaction.deferReply();
        
        if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}

		let AllReadyCards = [
			[],
			[],
			[],
			[],
			[],
			[],
		];

		var NumberIndex = 0;
		await CharacterData.find({ CardAllowed: true,
			CardDescription:{ $exists: true, $ne: 'Not Set.' },
			CardClass:{ $exists: true, $ne: 'Not Set.' },
			CardImage:{ $exists: true, $ne: 'Not Set.' },
			CardType:{ $exists: true, $ne: 'Not Set.' },
			Status: 'Approved' }).then((CharacterDatas) => {
			CharacterDatas.forEach(async (CharacterData) => {
				const CardTier = Math.ceil(CharacterData.Level / 2);

				if (isImageURL(CharacterData.CardImage)) {

				const Card = {
					Name: CharacterData.Name,
					CID: NumberIndex,
					Level: CharacterData.Level,
					Tier: CardTier,
					Rarity: 'Untrained',
					Image: CharacterData.CardImage,
					Class: CharacterData.CardClass,
					Description: CharacterData.CardDescription,
					Type: CharacterData.CardType,
					Special: false,
					Tag: "TEST"
				};

				switch (CardTier) {

				case 1:
					Card.Rarity = 'Untrained';

					break;
				case 2:
					Card.Rarity = 'Trained';

					break;
				case 3:
					Card.Rarity = 'Expert';

					break;
				case 4:
					Card.Rarity = 'Master';

					break;
				case 5:
					Card.Rarity = 'Legandary';

					break;
				}


				AllReadyCards[0].push(Card);
				AllReadyCards[CardTier].push(NumberIndex);
				NumberIndex += 1;
			}
			});
		});

		let SpecialOne = RandomRange(0, AllReadyCards[0].length);
		let SpecialTwo = RandomRange(0, AllReadyCards[0].length);

		while (SpecialOne === SpecialTwo && AllReadyCards[0].length > 1) {
			SpecialTwo = RandomRange(0, AllReadyCards[0].length);
		}

		AllReadyCards[0][SpecialOne].Special = true;
		AllReadyCards[0][SpecialTwo].Special = true;


		CardSet = {
			CardPool: AllReadyCards,
			CardPoolSize: AllReadyCards[0].length,
			Name: 'NEW CARD Card Pool',
			Icon: 'https://cdn.discordapp.com/attachments/1006650762035728424/1055186205752434791/Oracle.webp',
			Tag: 'NEEW',
			Created: Date(),
			Active: false,
			Specials: [SpecialOne, SpecialTwo],
			Eternals: []
		};

		let data = new CardData(CardSet);
		await data.save();

		await interaction.editReply({
			content: 'NEW CARD SET MADED'});
            return;



    }
}

