const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { bold } = require('discord.js');



module.exports = {
	data: new SlashCommandBuilder().setName('oraclehelp')
    .setDescription('Gives information on Oracle of Abadar Commands, select "all" for generic overview.')
    .addStringOption(option => option.setName('command').setDescription('Name of command you want information on.').setRequired(false).addChoices(
        { name: 'all', value: 'all' },
        { name: 'addplayer', value: 'addplayer' },
        { name: 'infoplayer', value: 'infoplayer' },
        { name: 'infochar', value: 'infochar' },
        { name: 'inforeport', value: 'inforeport' },
        { name: 'purchase ', value: 'purchase' },
        { name: 'changeslots', value: 'changeslots' },
        { name: 'changestatus', value: 'changestatus' },
        { name: 'changereportdescription', value: 'changereportdescription' },
        { name: 'addapproval', value: 'addapproval' },
        { name: 'newchar', value: 'newchar' },
        { name: 'addxp', value: 'addxp' },
        { name: 'recalculatecharacter', value: 'recalculatecharacter' },
        { name: 'newsessionreport', value: 'newsessionreport' },
        { name: 'addchartosr', value: 'addchartosr' },
        { name: 'assignreporttochar', value: 'assignreporttochar' },
        { name: 'publishsessionreport', value: 'publishsessionreport' },
        { name: 'renamecharacter', value: 'renamecharacter' },
    )),
	async execute(interaction) {

        await interaction.deferReply();

        let CommandHelp = interaction.options.getString('command');
		let HelpToSend = 'God help you, you caused an error.';

		if (CommandHelp === null) {CommandHelp = 'all';}

		switch (CommandHelp) {
		case 'all':
			HelpToSend =
            '***/infoplayer*** - Displays information on players registered on the oracle. Use Discord @mentions. Leave blank to info self.'
            + '\n***/infochar*** - Displays information on a character registered on the oracle. Use character name, case sensative.'
            + '\n***/inforeport*** - Displays read information on a session report registered on the oracle. Use SR name, case sensative.'
            + '\n***/purchase*** - Adds entires to a character\'s purchase log. Use postive gp to buy, negative gp to sell items. Use character name, case sensative.'
            + '\n***/recalculatecharacter*** - Recalculates a character\'s XP and Gold. Use character name, case sensative.'
            + '\n***/assignreporttochar*** - Assigns a Unassigned Report (GMXP) to a character. Use character name and SR name, case sensative for both.'
            + '\n***/renamecharacter*** - Updates the name of your character to a new one, case sensative.'
            + '\n***/changereportdescription*** - **GM Command** - Updates a SR description. Use SR name, case sensative.'
            + '\n***/newsessionreport*** - **GM Command** - Creates a new session report, SR name is case sensative and need to be unique. GM is the person who ran the game.'
            + '\n***/addchartosr*** - **GM Command** - Adds up to 8 characters (at a time) to an unpublished SR. Use character(s) name, case sensative, SR also case sensastive.'
            + '\n***/publishsessionreport*** - **GM Command** - Publishes an unpublished SR, giving out the rewards to the players and GM. Use SR name, case sensative.'
            + '\n***/addplayer*** - **Staff Command** - Adds a person to the oracle\'s database via discord @mentions'
            + '\n***/changeslots*** - **Staff Command** - Updates the amount of characters a player may have. Use Discord @mentions'
            + '\n***/changestatus*** - **Staff Command** - Updates the status of a character. Use Discord @mentions'
            + '\n***/addapproval*** - **Staff Command** - Adds entires to a character\'s approval log. Use character name, case sensative.'
            + '\n***/newchar*** - **Staff Command** - Creates a new character for a player on the oracle. Use Discord @mentions,character name is case sensative, needs to be unique.'
            + '\n***/addxp*** - **Staff Command** - Adds or subtracts XP to character which does not count towards a player\'s total XP.';

			break;
		case 'addplayer':
			HelpToSend = '***/addplayer*** - **Staff Command** - Adds a person to the oracle\'s database via discord @mentions';
			break;
		case 'infoplayer':
			HelpToSend = '***/infoplayer*** - Displays information on players registered on the oracle. Use Discord @mentions. Leave blank to info self.';
			break;
		case 'infochar':
			HelpToSend = '***/infochar*** - Displays information on a character registered on the oracle. Use character name, case sensative.';
			break;
		case 'inforeport':
			HelpToSend = '***/inforeport*** - Displays read information on a session report registered on the oracle. Use SR name, case sensative.';
			break;
		case 'purchase':
			HelpToSend = '***/purchase*** - Adds entires to a character\'s purchase log. Use postive gp to buy, negative gp to sell items. Use character name, case sensative.';
			break;
		case 'changeslots':
			HelpToSend = '***/changeslots*** - **Staff Command** - Updates the amount of characters a player may have. Use Discord @mentions';
			break;
		case 'changestatus':
			HelpToSend = '***/changestatus*** - **Staff Command** - Updates the status of a character. Use Discord @mentions';
			break;
		case 'changereportdescription':
			HelpToSend = '***/changereportdescription*** - **GM Command** - Updates a SR description. Use SR name, case sensative.';
			break;
		case 'addapproval':
			HelpToSend = '***/addapproval*** - **Staff Command** - Adds entires to a character\'s approval log. Use character name, case sensative.';
			break;
		case 'newchar':
			HelpToSend = '***/newchar*** - **Staff Command** - Creates a new character for a player on the oracle. Use Discord @mentions, character name is case sensative, needs to be unique with 30 letter limit.';
			break;
		case 'addxp':
			HelpToSend = '***/addxp*** - **Staff Command** - Adds or subtracts XP to character which does not count towards a player\'s total XP.';
			break;
		case 'recalculatecharacter':
			HelpToSend = '***/recalculatecharacter*** - Recalculates a character\'s XP and Gold. Use character name, case sensative.';
			break;
		case 'newsessionreport':
			HelpToSend = '***/newsessionreport*** - **GM Command** - Creates a new session report, SR name is case sensative and need to be unique. GM is the person who ran the game.';
			break;
		case 'addchartosr':
			HelpToSend = '***/addchartosr*** - **GM Command** - Adds up to 8 characters (at a time) to an unpublished SR. Use character(s) name, case sensative, SR also case sensastive.';
			break;
		case 'assignreporttochar':
			HelpToSend = '***/assignreporttochar*** - Assigns a Unassigned Report (GMXP) to a character. Use character name and SR name, case sensative for both.';
			break;
		case 'publishsessionreport':
			HelpToSend = '***/publishsessionreport*** - **GM Command** - Publishes an unpublished SR, giving out the rewards to the players and GM. Use SR name, case sensative.';
			break;
		case 'renamecharacter':
			HelpToSend = '***/renamecharacter*** - Updates the name of your character to a new one, case sensative. 30 letter limit.';
			break;
		}

		const HelpEmbed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(bold(CommandHelp))
			.setDescription(HelpToSend)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.editReply({ embeds: [HelpEmbed], ephemeral: true });

		return;



    }
}