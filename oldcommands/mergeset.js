const { SlashCommandBuilder, Routes } = require('discord.js');

const {

	RoleBotAdmin,

	CardData,

} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('setmerge')
    .setDescription('DO NOT USE THIS COMMAND, I WILL END YOU')
    .addStringOption(option => option.setName('mainset').setDescription('mainset').setMinLength(1).setMaxLength(4).setRequired(true))
    .addStringOption(option => option.setName('expac').setDescription('expac').setMinLength(1).setMaxLength(4).setRequired(true)),

	async execute(interaction,client) {

        await interaction.deferReply();

        if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
        
        let MainSet = interaction.options.getString('mainset')
		let Expansion = interaction.options.getString('expac')

		let MainSetData = await CardData.findOne({
			Tag: MainSet })

		let ExpansionData = await CardData.findOne({
			Tag: Expansion })

		let NewCards = []

        if (ExpansionData === null || MainSetData === null){
			await interaction.editReply({ content: 'Could not find both sets.' });
			return;
		}
		
		for (let index = 0; index < ExpansionData.CardPool[0].length; index++) {

			let CardToLook = ExpansionData.CardPool[0][index]
			

				let IsCardOnSet = MainSetData.CardPool[0].findIndex(item => item.Name === CardToLook.Name);

			if (IsCardOnSet === -1) {
				NewCards.push(ExpansionData.CardPool[0][index]);
		
			}
		}

	
		

		
		let MainSetSize = MainSetData.CardPoolSize
		for (let index = 0; index < NewCards.length; index++) {
			let Card = NewCards[index];
			NewCards[index].CID = MainSetSize + index
            Card.Tag = MainSetData.Tag
			MainSetData.CardPool[0].push(Card)

			MainSetData.CardPool[Card.Tier].push(MainSetSize + index)
			MainSetData.CardPoolSize += 1
		}
        
		MainSetData.markModified('CardPool')
		await MainSetData.save()
        console.log("Merged Set Finished.")
		return


    }
}