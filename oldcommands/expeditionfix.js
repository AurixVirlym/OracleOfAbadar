const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	PlayerData,
    RoleBotAdmin,
    CardData,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('expeditionfix')
    .setDescription('Painpeko, bot admin only'),
    
	async execute(interaction,client) {

        await interaction.deferReply();

        if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
        
        const EveryPlayer = []

        const BetaSet = await CardData.findOne({
			Tag: "BETA"
		});

        const EternalSet = await CardData.findOne({
			Tag: "4EVA"
		});

        await PlayerData.find().then((PlayerDatas) => {
			PlayerDatas.forEach((PlayerData) => {
				EveryPlayer.push(PlayerData);
			});
		});

        for (let QueryPlayerInfo of EveryPlayer) {

            for (let Card of QueryPlayerInfo.CardCollection) {

                let CardTag = Card.CardTag.slice(0, 4);
                let CardCID = Card.CardTag.slice(4);
        
                let InfoSetQuery

		if (CardTag == "BETA") {
            InfoSetQuery = BetaSet
        } else {
            InfoSetQuery = EternalSet
        }


		if (InfoSetQuery !== undefined && InfoSetQuery !== null) {

            

			const InfoCard = InfoSetQuery.CardPool[0][CardCID];


            let TypeShortened
							switch (InfoCard.Type) {
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

            Card.CardLevel = InfoCard.Level
            Card.CardType = TypeShortened
            }

        }
            QueryPlayerInfo.markModified('CardCollection');
            await QueryPlayerInfo.save()
            console.log("Updated: " + QueryPlayerInfo.DiscordId)

        }
        console.log("Done!")


    }
}
