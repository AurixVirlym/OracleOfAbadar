
const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const {
} = require('../constants.js');



module.exports = {
	data: new ContextMenuCommandBuilder()
	.setName('infoplayershown')
	.setType(ApplicationCommandType.User),

	async execute(interaction,client) {
        
        
        const command = interaction.client.commands.get("infoplayer");

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction,client,interaction.targetUser,false);

		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}

		return
    }
}