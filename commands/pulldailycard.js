const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	PlayerData,
	EuroDateFunc,
	PullCard,
} = require('../constants.js');

module.exports = {
	data: new SlashCommandBuilder().setName('pulldailycard')
    .setDescription('Gives one card. Usable once per day, reset is at midnight UTC.'),
	async execute(interaction,client) {

        await interaction.deferReply( {ephemeral: false});

        let PlayerDiscordID = interaction.user.id;
		let PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		let PlayerName = interaction.user
		let CurrentDate = EuroDateFunc(new Date());
		let LastPullDate;
		


		if (typeof PlayerName === undefined) {
			return
		}
        let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });


		if (QueryPlayerInfo != null) {

			LastPullDate = EuroDateFunc(QueryPlayerInfo.LastPull);
			let PullType = false

			if (LastPullDate !== CurrentDate) {

				PullType = "Daily"
				QueryPlayerInfo.LastPull = new Date();

			} else {
				(
					Message = await interaction.editReply({ content: 'You have already pulled a card today. Reset is at <t:1677628800:t>.', ephemeral: true })
				);
                return
			}

			let SetsToPull = ["GAMA","4EVA"]
			let RarityOdds = {
				Trained:  41,
				Expert: 86,
				Master: 101,
				Legnadary: 101,
				Special: 95
			}

			PullCard(interaction,QueryPlayerInfo,SetsToPull,PullType,0,RarityOdds)

			

				
        



    }
}
}
