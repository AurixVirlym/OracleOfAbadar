const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	CharacterData,
    RoleBotAdmin,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('consumableupdate')
    .setDescription('Painpeko, bot admin only'),
    
	async execute(interaction,client) {

        await interaction.deferReply();

        if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
        
        const EveryPlayer = []

        await CharacterData.find().then((PlayerDatas) => {
			PlayerDatas.forEach((PlayerData) => {
				EveryPlayer.push(PlayerData);
			});
		});

        for (let QueryCharacterInfo of EveryPlayer) {

            QueryCharacterInfo.ConsumableLog = []
            QueryCharacterInfo.SpentBudget = 0

            for (const entry of QueryCharacterInfo.PurchaseLog) {
                entry.Renewable = false
            }
            QueryCharacterInfo.markModified('PurchaseLog');

            await QueryCharacterInfo.save()
            console.log("Updated: " + QueryCharacterInfo.Name)

        }
        console.log("Done!")


    }
}