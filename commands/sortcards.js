const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	PlayerData,
    SortCards,
} = require('../constants.js');


module.exports = {
	data: new SlashCommandBuilder().setName('sortcards')
    .setDescription('Sorts your Card Collection.')
    .addStringOption(option => option.setName('type').setRequired(true).setDescription('How you wish to sort your collection.').addChoices(
        { name: 'Qty, Top to Bottom', value: 'QTtoB' },
        { name: 'Qty, Bottom to Top', value: 'QBtoT' },
        { name: 'By Card Tag', value: 'tag' },
        { name: 'By Character Name', value: 'CharName' },
        { name: 'By Character Level', value: 'lvl' },
    )),
	async execute(interaction,client) {

        await interaction.deferReply();
        
        let SortType = interaction.options.getString('type');

		let PlayerDiscordID = interaction.user.id;
		let PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
        let PlayerName = interaction.user


		if (typeof PlayerName === undefined) {
			return
		}

        let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });

		if (QueryPlayerInfo != null) {
            QueryPlayerInfo.CardSort = SortType
			SortCards(QueryPlayerInfo)
            QueryPlayerInfo.save();
            await interaction.editReply({ content: 'Card Collection sorted.' });
            return
			} else {
                await interaction.editReply({ content: 'No player found' });
                return
            }


    }
}