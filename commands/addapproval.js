const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	CollecterTimeout,
	ConfirmEmbedColor,
	CharacterData,
	EuroDateFunc,
    ConfirmRow,
} = require('../constants.js');




module.exports = {
	data: new SlashCommandBuilder().setName('addapproval')
    .setDescription('Adds an entry to the a character\'s approval log. Staff Only.')
    .addStringOption(option => option.setName('character').setDescription('Character Name, case sensitive').setMinLength(1).setMaxLength(30).setRequired(true))
    .addStringOption(option => option.setName('approval').setDescription('approval entry to add.').setMinLength(1).setMaxLength(120).setRequired(true)),

	async execute(interaction,client) {

        await interaction.deferReply();
        
        if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
		else {
			interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}

		const PlayerDiscordID = interaction.user.id;
		let PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		let CharName = interaction.options.getString('character');
		let ApprovalLine = interaction.options.getString('approval');


		if (CharName == null || ApprovalLine == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		else if (ApprovalLine.length > 120) {
			await interaction.editReply({ content: 'Approval length too long.' });
			return;
		}


		EmbedString = 'Do you wish to approve of "**' + ApprovalLine + '**" for "**' + CharName + '**"?';

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

			switch (interaction.customId) {
			case 'yes':
				let PlayerName = await client.users.fetch(PlayerDiscordID);

				if (typeof PlayerName == undefined) {
					return
				}

                let QueryCharInfo = await CharacterData.findOne({ Name: CharName });

				if (QueryCharInfo != null) {


					let ApprovalDate = new Date();
					ApprovalDate = EuroDateFunc(ApprovalDate);

					const ApprovalEntry = [ApprovalDate, 'Approval: ', ApprovalLine, PlayerName.username, PlayerDiscordMention]; // date,item approved,player approving, Discord ID of approver
					QueryCharInfo.ApprovalLog.push(ApprovalEntry);


					await QueryCharInfo.save();
					await interaction.update({ content: 'Added Entry: ' + '"' + ApprovalEntry[0] + ' - ' + ApprovalEntry[1] + ApprovalEntry[2] + ' by ' + ApprovalEntry[3] + '/' + ApprovalEntry[4] + '"', embeds: [], components: [] });


				}
				else {
					await interaction.update({ content: 'Did not find all the database entries. Check for typos.', embeds: [], components: [] });
					break;
				}


				collector.stop();

				break;

			case 'no':
				await interaction.update({
					content: 'Cancelled.', embeds: [], components: [],
				});
				collector.stop();
				break;

			}

		});



    }
}