const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	RecalcCharacter,
	CharacterData,
	RoleBotAdmin,
	GoldAtLevel,
	GoldPerXP,
	ReportData,
	CalcGoldFromXP,
} = require('../constants.js');


module.exports = {
	data: new SlashCommandBuilder().setName('recalculateallcharacter')
    .setDescription('Forces a recalculation of all characters, admin only.'),

	async execute(interaction) {

        await interaction.deferReply();

        if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
        
        const EveryChar = []
		let SuccessfulRecalcs = 0;

        await CharacterData.find().then((PlayerDatas) => {
			PlayerDatas.forEach((PlayerData) => {
				EveryChar.push(PlayerData);
			});
		});

        for (let QueryCharInfo of EveryChar) {


			if (QueryCharInfo !== null) {
		let ReportsSucceeded = 0;
		const ReportsToCheck = QueryCharInfo.AssignedReports;
		QueryCharInfo.Level = QueryCharInfo.StartingLevel;
		QueryCharInfo.CurrentXP = QueryCharInfo.ManualXP;
		QueryCharInfo.TotalXP = QueryCharInfo.ManualXP;
		QueryCharInfo.MaxGold = GoldAtLevel[QueryCharInfo.StartingLevel];

		for (const iterator of ReportsToCheck) {


			let QueryReportinfo = await ReportData.findOne({ _id: iterator });


			if (QueryReportinfo !== null && typeof QueryReportinfo !== undefined) {
				QueryCharInfo.CurrentXP += QueryReportinfo.XP;
				QueryCharInfo.TotalXP += QueryReportinfo.XP;
				ReportsSucceeded += 1;

			}
			else {await interaction.editReply({ content: 'Did not find the character ***' + CharToRecalc + '***.' });}

		}

		StringToReply = 'Recalculated ' + ReportsSucceeded + '/' + ReportsToCheck.length + ' for ***' + QueryCharInfo.Name + '***.';

		while (QueryCharInfo.CurrentXP >= 1000 && QueryCharInfo.Level < 10) {
			QueryCharInfo.CurrentXP -= 1000;
			QueryCharInfo.Level += 1;
		}


		QueryCharInfo.MaxGold = CalcGoldFromXP(QueryCharInfo);

		await QueryCharInfo.save();
		SuccessfulRecalcs++
		console.log(StringToReply);

		}

		}

		await interaction.editReply({ content: 'Recalcuated All Characters: ' + SuccessfulRecalcs +"/"+ EveryChar.length});
		
		return;



    }
}