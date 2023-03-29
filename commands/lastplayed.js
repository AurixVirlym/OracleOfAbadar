const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	RolePlayerGM,
	CollecterTimeout,
	ReportEmbedColor,
	CharacterData,
	PlayerData,
	ReportData,
} = require('../constants.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');



module.exports = {
	data: new SlashCommandBuilder().setName('lastplayed')
    .setDescription('See how many games each player played in the last X days.')
    .addNumberOption(option => option.setName('days').setDescription('How many days from today should be checked?').setMinValue(1).setMaxValue(100))
    .addStringOption(option => option.setName('sort').setDescription('How you wish to sort your played or ran games.').addChoices(
        { name: 'Games Played', value: 'played' },
        { name: 'Games Ran', value: 'ran' },
        { name: 'Combined', value: 'combined' },
    )),

	async execute(interaction,client) {

        await interaction.deferReply();
        

        if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
		
		let DaysAgoRequested = interaction.options.getNumber('days');
		let SortMethod = interaction.options.getString('sort');

		if (DaysAgoRequested == null) {
			DaysAgoRequested = 31;
		}

		if (SortMethod == null) {
			SortMethod = 'played';
		}

		let CurrentDate = new Date();
		let MonthAgoDate = CurrentDate.setDate(CurrentDate.getDate() - DaysAgoRequested);
	    CurrentDate = new Date();
		let CharactersIDsofLastMonth = [];
		let GMsIDsOfDate = [];
		let PlayersPlayed = [];
		let NumberOfReports = 0;

		await ReportData.find({
			RunDate: {
				$gt: MonthAgoDate,
				$lt: CurrentDate,
			},
		}).then((ReportDatas) => {
			ReportDatas.forEach((ReportData) => {

				if (ReportData.SSR === false) {
					NumberOfReports += 1;
					CharactersIDsofLastMonth = CharactersIDsofLastMonth.concat(ReportData.Characters);
					GMsIDsOfDate = GMsIDsOfDate.concat(ReportData.GMs);
				}


			});
		});

		const CharactersCounted = {};

		const GMsCounted = {};

		const countFuncPlayers = keys => {
			CharactersCounted[keys] = ++CharactersCounted[keys] || 1;
		};

		const countFuncGMs = keys => {
			GMsCounted[keys] = ++GMsCounted[keys] || 1;
		};

		CharactersIDsofLastMonth.forEach(countFuncPlayers);
		GMsIDsOfDate.forEach(countFuncGMs);
		
		NumberOfPlayersPlayed = 0


		for (const Element of Object.keys(CharactersCounted)) {
			QueryCharInfo = await CharacterData.findOne({ _id: Element });

			IsPlayerOnList = PlayersPlayed.findIndex(item => item.name === QueryCharInfo.BelongsTo);

			if (IsPlayerOnList === -1) {

				PlayersPlayed.push({ name: QueryCharInfo.BelongsTo, quantity: CharactersCounted[Element], GamesRan: 0 });
				NumberOfPlayersPlayed += 1
			}
			else {

				PlayersPlayed[IsPlayerOnList].quantity += CharactersCounted[Element];
			}

		}

		for (const Element of Object.keys(GMsCounted)) {

			QueryGMInfo = await PlayerData.findOne({ _id: Element });

			IsPlayerOnList = PlayersPlayed.findIndex(item => item.name === QueryGMInfo.DiscordId);


			if (IsPlayerOnList === -1) {

				PlayersPlayed.push({ name: QueryGMInfo.DiscordId, quantity: 0, GamesRan: GMsCounted[Element] });
			}
			else {

				PlayersPlayed[IsPlayerOnList].GamesRan += GMsCounted[Element];
			}
		}


		switch (SortMethod) {
		case 'played':
			PlayersPlayed.sort((b, a) => a.quantity - b.quantity);
			break;

		case 'ran':
			PlayersPlayed.sort(function(a, b) {
				const GamesRanOrder = parseInt(b.GamesRan) - parseInt(a.GamesRan);
				const GamesPlayedOrder = parseInt(b.quantity) - parseInt(a.quantity);
				return GamesRanOrder || GamesPlayedOrder;
			});
			break;

		case 'combined':
			PlayersPlayed.sort((b, a) => (a.quantity + a.GamesRan) - (b.quantity + b.GamesRan));
			break;


		}


		
		PlayersPlayedOnDisplay = PlayersPlayed.slice(0, 30);

		let AverageGames = 0
		let StringToAdd =""

		for (const Element of PlayersPlayed) {
			AverageGames += Element.quantity
		}

		for (let index = 0; index < PlayersPlayedOnDisplay.length; index++) {
			const Element = PlayersPlayedOnDisplay[index];

			let SpacedPlayed = String(Element.quantity)
			let	SpacedRan = String(Element.GamesRan)

			let SpacedIndex = String(index) + ". "

				while (SpacedIndex.length < 4) {
					SpacedIndex += '\xa0'
				}
				SpacedIndex = "`"+SpacedIndex+"`"

			StringToAdd += '\n' + `${SpacedIndex}` + Element.name + " **" + SpacedPlayed + '** played - **' + SpacedRan + '** ran.'
			
			
		}
		AverageGames = AverageGames / NumberOfPlayersPlayed
		StringToReply = `**${AverageGames.toFixed(2)}** games played per player with at least 1 game played on average.` + '\n**' + NumberOfPlayersPlayed + '** players who played in games.'
		+  StringToAdd
	

		const rowlist = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('backId')
					.setLabel('Previous')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('forwardId')
					.setLabel('Next')
					.setStyle(ButtonStyle.Primary),
			);

		const embed = new EmbedBuilder()
			.setColor(ReportEmbedColor)
			.setTitle(NumberOfReports + ' Games Played/Ran in last ' + String(DaysAgoRequested) + ' days. Sorted by ' + SortMethod)
			.setDescription(StringToReply)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		let embedMessage = await interaction.editReply({ embeds: [embed], components: [rowlist] });


		let collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});

		let currentIndex = 0;
		let PageSize = 30
		let MaxIndexLength = PlayersPlayed.PageSize
		collector.on('collect', async interaction => {
			{


				// Increase/decrease index
				if (interaction.customId === 'forwardId' && currentIndex + PageSize - PlayersPlayed.length < 0) {currentIndex += PageSize;}
				else if (currentIndex - PageSize >= 0 && interaction.customId === 'backId') {currentIndex -= PageSize;}


				PlayersPlayedOnDisplay = PlayersPlayed.slice(currentIndex, currentIndex + PageSize);
				StringToReply = `**${AverageGames.toFixed(2)}** games played per player with at least 1 game played on average.` + '\n**' + NumberOfPlayersPlayed + '** players who played in games.'
		

				for (let index = 0; index < PlayersPlayedOnDisplay.length; index++) {
					const Element = PlayersPlayedOnDisplay[index];
					
					let SpacedPlayed = String(Element.quantity)
					let	SpacedRan = String(Element.GamesRan)
					let SpacedIndex = String(currentIndex+index) + ". "

					while (SpacedIndex.length < 4) {
						SpacedIndex += '\xa0'
					}
					SpacedIndex = "`"+SpacedIndex+"`"
	
				StringToReply += '\n' + `${SpacedIndex}` + Element.name + " **" + SpacedPlayed + '** played - **' + SpacedRan + '** ran.'

				}
		
				FooterNoteForIndex = String("Showing " + currentIndex + "-" + (PageSize+ currentIndex) + " of " + MaxIndexLength)
				
				// Respond to interaction by updating message with new embed
				await interaction.update({
					embeds: [new EmbedBuilder()
						.setColor(ReportEmbedColor)
						.setTitle(NumberOfReports + ' Games Played/Ran in last ' + String(DaysAgoRequested) + ' days. Sorted by ' + SortMethod)
						.setDescription(StringToReply)
						.setTimestamp()
						.setFooter({ text: 'Absalom Living Campaign' }),
					],

					components: [rowlist],
				});


			}
		});


    }
}



