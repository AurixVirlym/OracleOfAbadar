const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	PlayerData,
    CharacterData,

} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('changestatus')
    .setDescription('Changes status of character(s). use character name to change a single char or player to change all.')
    .addStringOption(option => option.setName('status').setDescription('The status you wish to change to.').setRequired(true).addChoices(
        { name: 'Awaiting Creation Approval', value: 'Awaiting Creation Approval.' },
        { name: 'Awaiting Approval', value: 'Awaiting Approval.' },
        { name: 'Approved', value: 'Approved' },
        { name: 'Unavailable for Sessions', value: 'Unavailable for Sessions' },
        { name: 'Awaiting Audit or Revision', value: 'Awaiting Audit or Revision' },
        { name: 'M.I.A.', value: 'M.I.A.' },
        { name: 'Retired', value: 'Retired' },
        { name: 'Shadowrealm (Banned)', value: 'Shadowrealm (Banned)' }))
    .addStringOption(option => option.setName('character').setDescription('Character name, case sensitive'))
    .addUserOption(option => option.setName('mention').setDescription('Player discord @mention, use for changing the status on characters of a player.')),
	async execute(interaction,client) {

        await interaction.deferReply();
        
        if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}

        const PlayerDiscordData = interaction.options.getUser('mention');
		let PlayerDiscordMention, PlayerDiscordID, PlayerName

        let CharName = interaction.options.getString('character');
		let NewStatus = interaction.options.getString('status');

		if (PlayerDiscordData !== null) {
            PlayerDiscordID = PlayerDiscordData.id
			PlayerDiscordMention = '<@' + PlayerDiscordID + '>'
			PlayerName = PlayerDiscordData
		




		if (typeof PlayerDiscordMention != undefined && PlayerDiscordMention !== null) {
			PlayerDiscordMention = PlayerDiscordMention.replace(/!/g, '');
			StringToReply = '';
			const QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
			if (QueryPlayerInfo !== null) {
                let QueryCharInfo
				for (const CharacterID of QueryPlayerInfo.Characters) {
					QueryCharInfo = await CharacterData.findOne({ _id: CharacterID });

					if (QueryCharInfo !== null) {
						const OldStatus = QueryCharInfo.Status;
						QueryCharInfo.Status = NewStatus;


                        if (NewStatus == "Retired"){
                            QueryCharInfo.Name += "-r"
                        }

						await QueryCharInfo.save();

						StringToReply += '\nSet "' + QueryCharInfo.Name + '" to ***' + NewStatus + '*** from ***' + OldStatus + '***.';

					}
					else {
						StringToReply += '\nDid not find the character "' + CharacterID + '" in the database.';
					}
				}
			}
			else {
				await interaction.editReply({ content: 'Did not find player: ' + PlayerDiscordMention });
				return;
			}
			await interaction.editReply({ content: StringToReply });
			return;

		}}
		else if (typeof CharName != undefined) {
			var QueryCharInfo = await CharacterData.findOne({ Name: CharName });

		}
		else {
			await interaction.editReply({ content: 'Did not find a character name.' });
			return;
		}

    

		if (QueryCharInfo != null) {
			const OldStatus = QueryCharInfo.Status;
			QueryCharInfo.Status = NewStatus;


            if (NewStatus == "Retired"){
                QueryCharInfo.Name += "-r"
            }

			await QueryCharInfo.save();

			await interaction.editReply({ content: 'Set "' + CharName + '" to ***' + NewStatus + '*** from ***' + OldStatus + '***.' });

			return;
		}
		else {
			await interaction.editReply({ content: 'Did not find the character.' });
		}
		return;



    }
    
}