const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	CharacterData,
	PlayerData,
} = require('../constants.js');

const isImageURL = require('image-url-validator').default;


module.exports = {
	data: new SlashCommandBuilder().setName('characterdetails')
    .setDescription('Changes details of a character that are not required and are considered fluff.')
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
    ))
    .addStringOption(option => option.setName('type').setDescription('Type of the character.').addChoices(
        { name: 'Striker', value: 'Striker' },
        { name: 'Artillery ', value: 'Artillery' },
        { name: 'Support', value: 'Support' },
        { name: 'Controller', value: 'Controller' }))
    .addStringOption(option => option.setName('description').setDescription('A little fluffy description for your character no longer than a tweet.').setMinLength(1).setMaxLength(240))
    .addStringOption(option => option.setName('image').setDescription('An image to represent your character, give a discord image url').setMaxLength(300))
    .addBooleanOption(option => option.setName('allow').setDescription('Permission to your character details in Card game hosted on the bot')),
	async execute(interaction,client) {

        await interaction.deferReply();
        
        let StringToReply = '';
		let CardClass = interaction.options.getString('class');
		let CardDescription = interaction.options.getString('description');
		let CardType = interaction.options.getString('type');
		let CardImage = interaction.options.getString('image');
		let CardAllowed = interaction.options.getBoolean('allow');
		let CharName = interaction.options.getString('character');

		const PlayerDiscordID = interaction.user.id;
		let PlayerDiscordMention = '<@' + PlayerDiscordID + '>';

		let PlayerName = await client.users.fetch(PlayerDiscordID);


		if (typeof PlayerName == undefined) {
			return
		}


		let QueryCharInfo = await CharacterData.findOne({ Name: CharName, BelongsTo: PlayerDiscordMention });

		if (QueryCharInfo != null)  {

				if (CardClass !== null && CardClass !== undefined) {
					QueryCharInfo.CardClass = CardClass;
					StringToReply += '\nUpdated class to ' + CardClass;
				}

				if (CardDescription !== null && CardDescription !== undefined) {
					QueryCharInfo.CardDescription = CardDescription;
					StringToReply += '\nUpdated card description.';
				}

				if (CardType !== null && CardType !== undefined) {
					QueryCharInfo.CardType = CardType;
					StringToReply += '\nUpdated card type to ' + CardType;
				}

				if (CardImage !== null && CardImage !== undefined && isImageURL(CardImage)) {
					QueryCharInfo.CardImage = CardImage;
					StringToReply += '\nUpdated image to ' + CardImage;
				}

				if (CardAllowed !== null && CardAllowed !== undefined) {
					QueryCharInfo.CardAllowed = CardAllowed;
					StringToReply += '\nUpdated allowed status to ' + CardAllowed;
				}

				if (StringToReply === '') {
					StringToReply = 'No options were given, retry and add options.';
				}


				await QueryCharInfo.save();
			
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