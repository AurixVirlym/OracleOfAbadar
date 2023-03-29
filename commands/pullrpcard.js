const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	PlayerData,
	PullCard,
} = require('../constants.js');

module.exports = {
	data: new SlashCommandBuilder().setName('pullrpcard')
    .setDescription('Gives one card. Requires RP to use.')
	.addStringOption(option => option.setName('set').setDescription('The set you wish to pull, defaults to the newest set.').addChoices(
        { name: 'BETA - 10 RP', value: 'BETA' },
		{ name: 'GAMMA - 10 RP', value: 'GAMA' },
		{ name: 'ANY SET - 9 RP', value: 'MIXED' },
		{ name: 'Eternal Only - 999 RP', value: '4EVA' },
		)),
	async execute(interaction,client) {

        await interaction.deferReply( {ephemeral: false});

        let PlayerDiscordID = interaction.user.id;
		let PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		let PlayerName = interaction.user
		let RarityOdds

		let SetChoice = interaction.options.getString('set');

		if (SetChoice == null){
			SetChoice = 'GAMA'
		}

		switch (SetChoice) {
			case 'BETA':
				SetsToPull = ["BETA","4EVA"]
				RPcost = 10
				RarityOdds = {
					Trained:  75,
					Expert: 101,
					Master: 101,
					Legnadary: 101,
				}
				break;
			
			case 'GAMMA':
				SetsToPull = ["GAMA","4EVA"]
				RPcost = 10
				RarityOdds = {
					Trained:  41,
					Expert: 86,
					Master: 101,
					Legnadary: 101,
				}
				break;

			case 'MIXED':
				SetsToPull = ["BETA","GAMA","4EVA"]
				RarityOdds = {
					Trained:  36,
					Expert: 86,
					Master: 101,
					Legnadary: 101,
				}
				RPcost = 9
				break;
			
			case '4EVA':
				SetsToPull = ["4EVA"]
				RarityOdds = {
					Trained:  101,
					Expert: 101,
					Master: 101,
					Legnadary: 101,
				}
				RPcost = 999
				break;
		
			default:
				SetsToPull = ["GAMA","4EVA"]
				RPcost = 10
				RarityOdds = {
					Trained:  41,
					Expert: 86,
					Master: 101,
					Legnadary: 101,
				}
				break;
		}



		if (typeof PlayerName === undefined) {
			return
		}
        let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });


		if (QueryPlayerInfo != null) {
			let PullType = false

			if (QueryPlayerInfo.RecycledPoints >= RPcost) {
				CanPull = true;
				PullType = "RP"}
				else {
				(
					Message = await interaction.editReply({ content: `You do not have enough RP for this Pull. You are missing ${RPcost - QueryPlayerInfo.RecycledPoints}.`, ephemeral: true })
				);
                return
			}

			

			PullCard(interaction,QueryPlayerInfo,SetsToPull,PullType,RPcost,RarityOdds)

			

				
        



    }
}
}
