const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	CharacterData,
	PlayerData,
	ReportData,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('firstsessionfix')
    .setDescription('Painpeko, bot admin only'),
    
	async execute(interaction,client) {

        await interaction.deferReply();

        if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
        
        const EveryPlayer = []

        await PlayerData.find().then((PlayerDatas) => {
			PlayerDatas.forEach((PlayerData) => {
				EveryPlayer.push(PlayerData);
			});
		});

        for (let QueryPlayerInfo of EveryPlayer) {

            QueryPlayerInfo.FirstSR = false
            QueryPlayerInfo.CardSort = "tag"
            
            if (QueryPlayerInfo.Characters != null){

            for (let CharacterID of QueryPlayerInfo.Characters) {
                QueryCharacterInfo = await CharacterData.findOne({_id: CharacterID})
                if (QueryCharacterInfo.AssignedReports != null){
                    
                for (ReportID of QueryCharacterInfo.AssignedReports) {
                    QueryReportInfo = await ReportData.findOne({_id: ReportID})

                    if (QueryReportInfo.SSR == false){
                        QueryPlayerInfo.FirstSR = true
                        break
                    }
                }
                if (QueryPlayerInfo.FirstSR == true)
                {break}}
                
            }}
            await QueryPlayerInfo.save()
            console.log("Updated: " + QueryPlayerInfo.DiscordId)

        }


    }
}