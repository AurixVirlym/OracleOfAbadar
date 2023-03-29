const { Events } = require('discord.js');
const { ActivityType } = require('discord.js');



module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
        const { ActivityType } = require('discord.js');

        client.user.setActivity('The Faithful Players', { type: ActivityType.Watching });

		

	},
};
