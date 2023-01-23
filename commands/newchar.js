const { SlashCommandBuilder, Routes } = require('discord.js');
const {
    GoldAtLevel,
	CharacterData,
	PlayerData,
    RoleBotAdmin,
	RoleStaff,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('newchar')
    .setDescription('Adds a new character to a player.')
    .addUserOption(option => option.setName('mention').setDescription('Player discord @mention').setRequired(true))
    .addStringOption(option => option.setName('character').setDescription('Name of the new character, captials matter').setMinLength(1).setMaxLength(30).setRequired(true))
    .addNumberOption(option => option.setName('startlevel').setDescription('Number of character slots').setRequired(true).addChoices(
        { name: '1', value: 1 },
        { name: '2', value: 2 })),
	async execute(interaction,client) {

        await interaction.deferReply();

        if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
		else {
			interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}


		var PlayerDiscordMention = interaction.options.getUser('mention');
		var StartingLevel = interaction.options.getNumber('startlevel');
		var CharacterName = interaction.options.getString('character');


		if (CharacterName == null || PlayerDiscordMention == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		else if (CharacterName.length >= 30) {
			await interaction.editReply({ content: 'Name is too long.' });
			return;
		}


		var PlayerDiscordID = PlayerDiscordMention.id
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>'
		

		try {
			var PlayerName = await client.users.fetch(PlayerDiscordID);
		}
		catch (error) {
			await interaction.editReply({ content: 'No such player in database or other error.' });
			return;
		}

		var	CharacterName =	CharacterName.replace(/[\\@#&!`*_~<>|]/g, '');

		if (typeof PlayerName != undefined) {
			var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
			var QueryCharacterInfo = await CharacterData.findOne({ Name: CharacterName });
		}
		else {
			await interaction.editReply({ content: 'Incorrect Player Mention' });
			return;
		}

		if (QueryPlayerInfo != null && QueryCharacterInfo == null) {

            let RetiredCharsNumber = 0 

            for (const Character of QueryPlayerInfo.Characters) {
               let RetireQuery = await CharacterData.findOne({_id: Character})

               if (RetireQuery !== null){

                if (RetireQuery.Status == "Retired"){
                    RetiredCharsNumber++
                }

               }
            }


			if ((QueryPlayerInfo.Characters.length - RetiredCharsNumber) < AutoCalcSlots(QueryPlayerInfo)) {
				item = {
					Name: CharacterName,
					BelongsTo: PlayerDiscordMention, // database id
					Created: Date(),
					Level: StartingLevel,
					StartingLevel: StartingLevel,
					CurrentXP: 0,
					TotalXP: 0,
					ManualXP: 0,
					SpentGold: 0,
					MaxGold: GoldAtLevel[StartingLevel],
					Status: 'Awaiting Creation Approval', // basically options for holding info if a character is retired, active so on.
					PurchaseLog: [],
					AssignedReports: [],
					CardClass: 'Not Set.',
					CardDescription: 'Not Set.',
					CardImage: 'Not Set.',
					CardType: 'Not Set.',
					CardAllowed: false,
				};

				var data = new CharacterData(item);
				await data.save();

				var QueryCharacterInfo = await CharacterData.findOne({ Name: CharacterName });

				await QueryPlayerInfo.Characters.push(QueryCharacterInfo._id);
				await QueryPlayerInfo.save();

				await interaction.editReply({ content: 'Created ' + CharacterName + ' for ' + PlayerDiscordMention });

			}
			else	 {
				await interaction.editReply({ content: 'Player may not have more characters.' });
				return;
			}

		}
		else {
			await interaction.editReply({ content: 'Database Error, name already taken or player has not been added.' });
			return;
		}
		return;




    }
}