const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	PlayerData,
    RoleBotAdmin,
    CardData,
	CharacterData,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('purchaseconvert')
    .setDescription('Painpeko, bot admin only'),
    
	async execute(interaction,client) {

        await interaction.deferReply();

        if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
        
       EveryChar = []

        await CharacterData.find().then((CharacterDatas) => {
			CharacterDatas.forEach((CharacterData) => {
				EveryChar.push(CharacterData);
			});
		});

        for (let QueryCharInfo of EveryChar) {
			let NewPurchaseLog = []

			for (let index = 0; index < QueryCharInfo.PurchaseLog.length; index++) {
				const Entry = QueryCharInfo.PurchaseLog[index];
				
				let item = {
					Name: Entry[2],
					Value: Entry[3],
					Legacy: true
				}

				let EntrySold = 0
				let EntryBrought = 0

				if (item.Value < 0) {
					EntrySold = -item.Value
				} else {
					EntryBrought = item.Value
				}


				let PurchaseEntry = {
					Date: Entry[0],
					Sold: EntrySold,
					Brought: EntryBrought,
					Total: item.Value,
					Items: [item]
				}

				NewPurchaseLog.push(PurchaseEntry)
			}
			QueryCharInfo.PurchaseLog = NewPurchaseLog
			QueryCharInfo.save()
			console.log(QueryCharInfo.Name + " - Done!")
        }

		console.log("Done!")
        }
       


    }

