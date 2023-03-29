const { Events } = require('discord.js');
var cron = require('node-cron');

module.exports = {
	name: Events.ClientReady,
	async execute(client) {
			console.log('Started Reminder for Reset.')

			cron.schedule('5 0 * * *', () => {
			
			let d = new Date();
			let day = d.getDay();

			let StringToSend = "@CardCollector Reset Time."
			if (day == 1){
			StringToSend = "@CardCollector Weekly Reset Time, you may go on expedition once more!"
			}

			client.channels.get('1057107169859870770').send(StringToSend);

		  }, {
			scheduled: true,
			timezone: 'Etc/UTC'
		  });
		  
	}
};
