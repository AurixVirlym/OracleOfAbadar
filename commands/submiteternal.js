const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	PlayerData,
    CardData,
    RoleBotAdmin,
	RoleStaff,
	RolePlayerGM,
} = require('../constants.js');

const isImageURL = require('image-url-validator').default;


module.exports = {
	data: new SlashCommandBuilder().setName('submiteternal')
    .setDescription('Submit an eternal character card. Once submitted, details can only be changed by a bot admin.')
	.addStringOption(option => option.setName('character').setDescription('Character Name').setMinLength(1).setMaxLength(30).setRequired(true))
    .addStringOption(option => option.setName('class').setDescription('Class of the character.').addChoices(
        { name: 'Alchemist', value: 'Alchemist' },
        { name: 'Barbarian', value: 'Barbarian' },
        { name: 'Bard', value: 'Bard' },
        { name: 'Champion', value: 'Champion' },
        { name: 'Cleric', value: 'Cleric' },
        { name: 'Druid', value: 'Druid' },
        { name: 'Fighter', value: 'Fighter' },
        { name :'Gunslinger', value: 'Gunslinger' },
        { name: 'Inventor', value: 'Inventor' },
        { name: 'Investigator', value: 'Investigator' },
        { name: 'Magus', value: 'Magus' },
        { name: 'Monk', value: 'Monk' },
        { name: 'Oracle', value: 'Oracle' },
        { name: 'Psychic', value: 'Psychic' },
        { name: 'Ranger', value: 'Ranger' },
        { name: 'Rogue', value: 'Rogue' },
        { name: 'Sorcerer', value: 'Sorcerer' },
        { name: 'Summoner', value: 'Summoner' },
        { name: 'Swashbuckler', value: 'Swashbuckler' },
        { name: 'Thaumaturge', value: 'Thaumaturge' },
        { name: 'Witch', value: 'Witch' },
        { name: 'Wizard', value: 'Wizard' },
        { name: 'Kineticist ', value: 'Kineticist ' },
    ).setRequired(true))
    .addStringOption(option => option.setName('type').setDescription('Type of the character.').addChoices(
        { name: 'Striker', value: 'Striker' },
        { name: 'Artillery ', value: 'Artillery ' },
        { name: 'Support', value: 'Support' },
        { name: 'Controller', value: 'Controller' }).setRequired(true))
    .addStringOption(option => option.setName('description').setDescription('A little fluffy description for your character no longer than a tweet.').setMinLength(1).setMaxLength(240).setRequired(true))
    .addStringOption(option => option.setName('image').setDescription('An image to represent your character, give a discord image url').setMaxLength(300).setRequired(true))
    .addNumberOption(option => option.setName('level').setDescription('Gold spent/gained').setMinValue(1).setMaxValue(25).setRequired(true)),

	async execute(interaction,client) {

        await interaction.deferReply();

        if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
        
        let StringToReply = 'ERR';
		let CardClass = interaction.options.getString('class');
		let CardDescription = interaction.options.getString('description');
		let CardType = interaction.options.getString('type');
		let CardImage = interaction.options.getString('image');
        let CardLevel =interaction.options.getNumber('level');
		let CharName = interaction.options.getString('character');

		const PlayerDiscordID = interaction.user.id;
		let PlayerDiscordMention = '<@' + PlayerDiscordID + '>';

		let PlayerName = await client.users.fetch(PlayerDiscordID);


        let EternalSetData = await CardData.findOne({ Tag: "4EVA" });

		if (typeof PlayerName == undefined) {
			return
		}

        let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });

		if (QueryPlayerInfo != null && EternalSetData != null) {
           let EternalsUnlocked = 1 + Math.floor(QueryPlayerInfo.GMXP/3000)
			  if (QueryPlayerInfo.EternalCards < EternalsUnlocked) {

              if (await isImageURL(CardImage)) {
				
				const Card = {
					Name: CharName,
					CID: EternalSetData.CardPool[0].length,
					Level: CardLevel,
					Tier: 6,
					Rarity: 'Eternal',
					Image: CardImage,
					Class: CardClass,
					Description: CardDescription,
					Type: CardType,
					Special: false,
					Tag: "4EVA"
				};
                
				EternalSetData.CardPool[0].push(Card);
                EternalSetData.CardPoolSize += 1
				
			}
                QueryPlayerInfo.EternalCards += 1
                EternalSetData.markModified('CardPool')
                await QueryPlayerInfo.save();
				await EternalSetData.save();
                StringToReply = "Card accepted with no issue, let Danni know as cards are not added to the set until she manually edits it."
                let CardEmbed = GenCardEmbed(Card, EternalSetData);
                await interaction.editReply({
                    content: StringToReply, embeds: CardEmbed
                });
                return

               
        } else {
			StringToReply = 'You do not have enough eternal slots for a new card, an eternal card is given once for being a Player GM and above and another is given for 3000 GMXP you have.';
		}

		}
		else {
			StringToReply = 'No character with that name found, try again.';
		}

		await interaction.editReply({
			content: StringToReply,
		});

		return;



    }
}