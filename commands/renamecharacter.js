const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	CollecterTimeout,
	ConfirmEmbedColor,
	CharacterData,
	PlayerData,
    ConfirmRow,
} = require('../constants.js');




module.exports = {
	data: new SlashCommandBuilder().setName('renamecharacter')
    .setDescription('Renames a character which you own.')
    .addStringOption(option => option.setName('oldname').setDescription('Current Character Name, case sensitive.').setMinLength(1).setMaxLength(32).setRequired(true))
    .addStringOption(option => option.setName('newname').setDescription('New Character Name, case sensitive.').setMinLength(1).setMaxLength(30).setRequired(true))
	.addUserOption(option => option.setName('mention').setDescription('Player discord @mention.')),

	async execute(interaction,client) {

        await interaction.deferReply();

        const OldCharName = interaction.options.getString('oldname');
		const NewCharName = interaction.options.getString('newname').replace(/[\\@#&!`*_~<>|]/g, '');


		let PlayerDiscordData= interaction.options.getUser('mention');

		let PlayerDiscordID, PlayerDiscordMention, PlayerName

		if (PlayerDiscordData == null) {
			 PlayerDiscordID = interaction.user.id;
			 PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
			 PlayerName = interaction.user
		}

		else {
			PlayerDiscordID = PlayerDiscordData.id
			PlayerDiscordMention = '<@' + PlayerDiscordID + '>'
			PlayerName = PlayerDiscordData
		}

		if (typeof PlayerName === undefined) {
			return
		}

		if (OldCharName == null || NewCharName == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		else if (NewCharName.length > 30) {
			await interaction.editReply({ content: 'Name is too long.' });
			return;
		}


		EmbedString = 'You wish to rename "**' + OldCharName + '**" to "**' + NewCharName + '**"?';

		let ConfirmEmbed = new EmbedBuilder()
			.setColor(ConfirmEmbedColor)
			.setDescription(EmbedString)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.editReply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });

		let collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});


		collector.on('collect', async interaction => {

			if (interaction.customId === 'yes') {


				const QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
				const QueryCharInfo = await CharacterData.findOne({ Name: OldCharName, BelongsTo: PlayerDiscordMention});
				const NewNameCheck = await CharacterData.findOne({ Name: NewCharName, BelongsTo: PlayerDiscordMention});


				if (QueryPlayerInfo != null && QueryCharInfo != null && NewNameCheck == null) {
					if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId || interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {

						QueryCharInfo.Name = NewCharName;
						QueryCharInfo.save();

						await interaction.update({
							content: 'Renamed "**' + OldCharName + '**" to "**' + NewCharName + '**".', embeds: [], components: [],
						});


					}
					else {
						await interaction.update({
							content: 'Character does not belong to you.', embeds: [], components: [],
						});
					}
				}
				else {
					await interaction.update({
						content: 'Did not find player/character in database or name is already taken.', embeds: [], components: [],
					});
				}


			}
			else if (interaction.customId === 'no') {
				await interaction.update({
					content: 'Cancelled.', embeds: [], components: [],
				});

			}

		});
        return
        



    }
}