// Require the necessary discord.js classes
const mongoose = require('mongoose')
const Discord = require("discord.js");
const { Client, GatewayIntentBits, messageLink } = require('discord.js');
const { token , databasetoken } = require('./config.json');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { ComponentType } = require('discord.js');
const { bold, italic, strikethrough, underscore, spoiler, quote, blockQuote } = require('discord.js');

const GoldAtLevel = [0,20,40,80,140,260,460,749,1140,1640,2340]
const GoldPerXP = [0,5,10,15,30,50,70,100,125,175,225]
console.log(token);
console.log(databasetoken);
const RoleBotAdmin = "Bot Admin"
const RoleStaff = "Staff"
const RolePlayerGM = "Player GM"

const DateOptions = {
	day: "numeric",
	month: "numeric",
	year: "numeric",
  }


// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	 mongoose.connect(
		databasetoken ||
		{
				keepAlive: true,
		}
	)		
	console.log('Ready!');
});




const ConfirmRow = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
                .setCustomId('yes')
                .setLabel('Yes')
                .setStyle(ButtonStyle.Success),
				new ButtonBuilder()
                .setCustomId('no')
                .setLabel('No')
                .setStyle(ButtonStyle.Danger))



const PlayerSchema = new mongoose.Schema({
	DiscordId: {type: String, required: true},
	Characters: Array, //for holding Name string and database id to link. Key ID /Value name
	UnassignedReports: Array, //for holding unassigned GMXP. Key ID /Value Name
	Status: String,
	TotalXP: Number, //for calcing every single point of assigned xp to characters. Could be useful for doing slot unlocked
	UntotalXP: Number,
	CharacterSlots: Number //for max allowed characters

  }, {collection: 'Players'});

  const ReportSchema = new mongoose.Schema({
	Name: {type: String, required: true}, //add check for unique names only
	RunDate: Date, //?
	XP: Number, //default 250 but add option
	Description: {type: String, required: true}, //think news and net
	GMs: Array, //anyone who gets unassigned xp. 
	Characters: Array, //id.
	SSR: Boolean,
	Published: {type: Boolean, required: true}, //to determine if the Report should in players hands.
	},{collection: 'Reports'});


	const CharacterSchema = new mongoose.Schema({
		Name: {type: String, required: true},
		BelongsTo: {type: String, required: true},//database id
		Created: Date, //why not?
		Level: Number,
		StartingLevel: Number,
		CurrentXP: Number,
		TotalXP: Number,
		ManualXP: Number,
		SpentGold: Number,
		MaxGold: Number,
		Status: {type: String, required: true}, //basically options for holding info if a character is retired, active so on.
		PurchaseLog: Array,
		ApprovalLog: Array,
		AssignedReports: Array, //used to figure out so reports are given to the character.
		},{collection: 'Characters'});



  const PlayerData = mongoose.model('Players',PlayerSchema)
  const CharacterData = mongoose.model('Characters', CharacterSchema)
  const ReportData = mongoose.model('Reports', ReportSchema)



  function CalcGoldFromXP(QueryCharInfo) {

	return GoldAtLevel[QueryCharInfo.Level]+ (Math.floor(QueryCharInfo.CurrentXP/250)* GoldPerXP[QueryCharInfo.Level])

  }



  async function RecalcCharacter(CharToRecalc,interaction) {
	StringToReply = String(CharToRecalc)
	try {
		QueryCharInfo = await CharacterData.findOne({Name: CharToRecalc});
	} catch (error) {
		await interaction.reply({ content: "Did not find the character ***" + CharToRecalc +"***."})
		return;
	}

	if (QueryCharInfo !== null){
		let ReportsSucceeded = 0
		ReportsToCheck = QueryCharInfo.AssignedReports
		QueryCharInfo.Level = QueryCharInfo.StartingLevel
		QueryCharInfo.CurrentXP = QueryCharInfo.ManualXP
		QueryCharInfo.TotalXP = QueryCharInfo.ManualXP
		QueryCharInfo.MaxGold = GoldAtLevel[QueryCharInfo.StartingLevel]

		for (const iterator of ReportsToCheck) {

			
				QueryReportinfo = await ReportData.findOne({_id: iterator});
			
				
			

			if (QueryReportinfo !== null && typeof QueryReportinfo !== undefined){
				QueryCharInfo.CurrentXP += QueryReportinfo.XP
				QueryCharInfo.TotalXP += QueryReportinfo.XP
				ReportsSucceeded += 1

			} else {await interaction.reply({ content: "Did not find the character ***" + CharToRecalc +"***."})}
			
		}

		StringToReply = "Recalculated " + ReportsSucceeded + "/" + ReportsToCheck.length + " for ***" + QueryCharInfo.Name + "***."

		while(QueryCharInfo.CurrentXP >= 1000 && QueryCharInfo.Level < 10){
			QueryCharInfo.CurrentXP -= 1000
			QueryCharInfo.Level += 1
		}
		

		QueryCharInfo.MaxGold = CalcGoldFromXP(QueryCharInfo)

		StringToReply += "\n***" + QueryCharInfo.Name +"*** is level " + QueryCharInfo.Level + " with a max gold of " + QueryCharInfo.MaxGold + "."
		await QueryCharInfo.save();
		await interaction.reply({ content: StringToReply})
	}






  }

  async function CharsAddToReport(CharsToAddArray,ReportToQuery,interaction) {
	var StringToReply ="ERR"; 
	var QueryReportInfo = await ReportData.findOne({Name: ReportToQuery})
	var SameCheckID;
	CharsConfirmedArray = [];
	if (QueryReportInfo !== null && CharsToAddArray !== undefined){

	if (QueryReportInfo.SSR === true){
		await interaction.reply({ content: "Report is an SSR.", embeds: [], components: []})
		return
	}

	if (QueryReportInfo.Published === false){
		
		CharsToAddArray = CharsToAddArray.filter(function (el) {
			return el != null;
		  });

		  console.log(CharsToAddArray)

	

	if (CharsToAddArray !== null){
		
	

			for (const Element of CharsToAddArray)
			{
			SameCheckID = false
			QueryCharInfo = await CharacterData.findOne({Name: Element})

			if (QueryCharInfo !== null && typeof QueryCharInfo !== undefined ){
				SameCheck = await QueryReportInfo.Characters.includes(QueryCharInfo._id)

				if (SameCheck == false){
					StringToReply += 'Added ' + QueryCharInfo.Name + ' to ' + QueryReportInfo.Name + '.\n';
					QueryReportInfo.Characters.push(QueryCharInfo._id)

					} else (StringToReply += QueryCharInfo.Name + ' already is in ' + QueryReportInfo.Name + '.\n')
			
			} else (StringToReply += 'Character ' + Element + ' does not exist.\n')
		};	

		await QueryReportInfo.save();
	
	//console.log(CharsConfirmedArray)
	//QueryReportInfo.Characters = QueryReportInfo.Characters.concat(CharsConfirmedArray)

}else  {StringToReply = 'No characters found.'}
} else  {StringToReply = 'Report already published.'}
	} else {StringToReply = 'Report not found.'}
await interaction.update({ content: StringToReply, embeds: [], components: []})

}



async function PublishSR(QueryReportInfo,interaction){

	var ProcessSuccess = 0 
	var StringToReply =""; 
	if (QueryReportInfo !== null){
	if (QueryReportInfo.Published === false){
		
		CharsToReward = QueryReportInfo.Characters

		  console.log(CharsToReward)

	
		  if (QueryReportInfo.GMs !== null) {
			for (const Element of QueryReportInfo.GMs) {
				var QueryPlayerInfo = await PlayerData.findOne({_id: Element})
			if (QueryPlayerInfo !== null) {
				QueryPlayerInfo.UnassignedReports.push(QueryReportInfo._id);
				StringToReply += '\nGave report ***"' + QueryReportInfo.Name +'"*** to ' + QueryPlayerInfo.DiscordId + ' as an unassigned report.'
				await QueryPlayerInfo.save()
				ProcessSuccess += 1 

			} else {
				StringToReply += '\nDatabase ID' + Element + "not found."

			}
			
		  }

		} else {
			await interaction.reply({ content: "No GM found on Report."})
			return;
		}




	if (CharsToReward !== null){
		for (const Element of CharsToReward){
			{
				var QueryCharInfo = await CharacterData.findOne({_id: Element})
				if (QueryCharInfo !== null) {
					QueryCharInfo.AssignedReports.push(QueryReportInfo._id);
					QueryCharInfo.CurrentXP += QueryReportInfo.XP
					QueryCharInfo.TotalXP += QueryReportInfo.XP
				
					StringToReply += '\n***' + QueryCharInfo.Name + '*** gained ' + QueryReportInfo.XP + " XP!"
				
				while(QueryCharInfo.CurrentXP >= 1000 && QueryCharInfo.Level < 10){
					QueryCharInfo.CurrentXP -= 1000
					QueryCharInfo.Level += 1
					StringToReply += '\n***' + QueryCharInfo.Name + '*** gained enough XP to gain level ' + QueryCharInfo.Level + '!' 
				}
	
				QueryCharInfo.MaxGold = CalcGoldFromXP(QueryCharInfo)
				
				await QueryCharInfo.save();
				} else {
					StringToReply += '\n***"' + QueryCharInfo.Name +'*** not found in database.'
				}
	}
		}
			QueryReportInfo.Published = true
			await QueryReportInfo.save()
			StringToReply += '\n***' + QueryReportInfo.Name +'*** has been published.'

	} else {StringToReply = 'No characters in Report: ' + QueryReportInfo.Name + "."}
} else {StringToReply = 'Report ' + QueryReportInfo.Name + ' already published.'}

} else {StringToReply = 'Report ' + QueryReportInfo.Name + ' not found.'}

if (StringToReply.length >= 2000){
	StringToReply = StringToReply.slice(0, 1984) + "\nMessageTooLong"
}

if (QueryReportInfo.SSR === true) {
	StringToReply = "SSR Published and given out to " + ProcessSuccess + "/" + QueryReportInfo.GMs.length +" players."
}


await interaction.update({ content: StringToReply, embeds: [], components: []})

}











client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName } = interaction;

		switch(commandName){
			case'ping':
			await interaction.reply({ content: 'Pong!', ephemeral: true });
			break;
		
		
			case'server':
			await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
			break;
			

			case'oraclehelp':

			let CommandHelp = interaction.options.getString('command'); 
			let HelpToSend = "God help you, you caused an error."
			
			if (CommandHelp === null){CommandHelp = "all"}

			switch(CommandHelp){
				case'all':
				HelpToSend =
				"***/infoplayer*** - Displays information on players registered on the oracle. Use Discord @mentions. Leave blank to info self."
				+"\n***/infochar*** - Displays information on a character registered on the oracle. Use character name, case sensative."
				+"\n***/inforeport*** - Displays read information on a session report registered on the oracle. Use SR name, case sensative."
				+"\n***/purchase*** - Adds entires to a character's purchase log. Use postive gp to buy, negative gp to sell items. Use character name, case sensative."
				+"\n***/recalculatecharacter*** - Recalculates a character's XP and Gold. Use character name, case sensative."
				+"\n***/assignreporttochar*** - Assigns a Unassigned Report (GMXP) to a character. Use character name and SR name, case sensative for both."
				+"\n***/renamecharacter*** - Updates the name of your character to a new one, case sensative."
				+"\n***/changereportdescription*** - **GM Command** - Updates a SR description. Use SR name, case sensative."
				+"\n***/newsessionreport*** - **GM Command** - Creates a new session report, SR name is case sensative and need to be unique. GM is the person who ran the game."
				+"\n***/addchartosr*** - **GM Command** - Adds up to 8 characters (at a time) to an unpublished SR. Use character(s) name, case sensative, SR also case sensastive."
				+"\n***/publishsessionreport*** - **GM Command** - Publishes an unpublished SR, giving out the rewards to the players and GM. Use SR name, case sensative."
				+"\n***/addplayer*** - **Staff Command** - Adds a person to the oracle's database via discord @mentions"
				+"\n***/changeslots*** - **Staff Command** - Updates the amount of characters a player may have. Use Discord @mentions"
				+"\n***/changestatus*** - **Staff Command** - Updates the status of a character. Use Discord @mentions"
				+"\n***/addapproval*** - **Staff Command** - Adds entires to a character's approval log. Use character name, case sensative."
				+"\n***/newchar*** - **Staff Command** - Creates a new character for a player on the oracle. Use Discord @mentions,character name is case sensative, needs to be unique."
				+"\n***/addxp*** - **Staff Command** - Adds or subtracts XP to character which does not count towards a player's total XP."
				
				break
				case'addplayer':
				HelpToSend = "***/addplayer*** - **Staff Command** - Adds a person to the oracle's database via discord @mentions"
				break
				case'infoplayer':
				HelpToSend = "***/infoplayer*** - Displays information on players registered on the oracle. Use Discord @mentions. Leave blank to info self."
				break
				case'infochar':
				HelpToSend = "***/infochar*** - Displays information on a character registered on the oracle. Use character name, case sensative."
				break
				case'inforeport':
				HelpToSend = "***/inforeport*** - Displays read information on a session report registered on the oracle. Use SR name, case sensative."
				break
				case'purchase':
				HelpToSend = "***/purchase*** - Adds entires to a character's purchase log. Use postive gp to buy, negative gp to sell items. Use character name, case sensative."
				break
				case'changeslots':
				HelpToSend = "***/changeslots*** - **Staff Command** - Updates the amount of characters a player may have. Use Discord @mentions"
				break
				case'changestatus':
				HelpToSend = "***/changestatus*** - **Staff Command** - Updates the status of a character. Use Discord @mentions"
				break
				case'changereportdescription':
				HelpToSend = "***/changereportdescription*** - **GM Command** - Updates a SR description. Use SR name, case sensative."
				break
				case'addapproval':
				HelpToSend = "***/addapproval*** - **Staff Command** - Adds entires to a character's approval log. Use character name, case sensative."
				break
				case'newchar':
				HelpToSend = "***/newchar*** - **Staff Command** - Creates a new character for a player on the oracle. Use Discord @mentions, character name is case sensative, needs to be unique with 30 letter limit."
				break
				case'addxp':
				HelpToSend = "***/addxp*** - **Staff Command** - Adds or subtracts XP to character which does not count towards a player's total XP."
				break
				case'recalculatecharacter':
				HelpToSend = "***/recalculatecharacter*** - Recalculates a character's XP and Gold. Use character name, case sensative."
				break
				case'newsessionreport':
				HelpToSend = "***/newsessionreport*** - **GM Command** - Creates a new session report, SR name is case sensative and need to be unique. GM is the person who ran the game."
				break
				case'addchartosr':
				HelpToSend = "***/addchartosr*** - **GM Command** - Adds up to 8 characters (at a time) to an unpublished SR. Use character(s) name, case sensative, SR also case sensastive."
				break
				case'assignreporttochar':
				HelpToSend = "***/assignreporttochar*** - Assigns a Unassigned Report (GMXP) to a character. Use character name and SR name, case sensative for both."
				break
				case'publishsessionreport':
				HelpToSend = "***/publishsessionreport*** - **GM Command** - Publishes an unpublished SR, giving out the rewards to the players and GM. Use SR name, case sensative."
				break
				case'renamecharacter':
				HelpToSend = "***/renamecharacter*** - Updates the name of your character to a new one, case sensative. 30 letter limit."
				break
			}

			const HelpEmbed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(bold(CommandHelp))
				.setDescription(HelpToSend)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign'});

			embedMessage = await interaction.reply({ embeds: [HelpEmbed],ephemeral: true})

			break;
			
			case'addplayer':

			if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff].includes(r.name)) ) {}
         	 else {
            interaction.reply({ content: "You lack the role(s) to use this command."})
            break
          }

			var PlayerDiscordMention = interaction.options.getString('mention');  

			if (PlayerDiscordMention == null ){
				await interaction.reply({ content: 'Not all inputs given.'})
				break
				}

				PlayerDiscordMention = PlayerDiscordMention.replace(/!/g, ""); 
			var PlayerDiscordID = PlayerDiscordMention.replace(/[\\<>@#&!]/g, "")

			try {
			var PlayerName = await client.users.fetch(PlayerDiscordID)
			} catch (error) {
				await interaction.reply({ content: 'Incorrect mention.'})
				break
			}
			
		

			if (typeof PlayerName != undefined) {
				var SameCheck = await PlayerData.findOne({DiscordId: PlayerDiscordMention})
			  }
			
			var ErrorSend = 'Failed to add player:' + "  -  " + PlayerDiscordMention

			try {
				var PlayerDiscordUsername = PlayerName.username
			  }
			  catch(err) {				
				console.log('Invalid Name')
				await interaction.reply({ content: 'Invalid Name'})
				break;
			  };
		
			
			if (typeof PlayerDiscordUsername != undefined && typeof PlayerName != undefined && SameCheck == null  ){
				item = {
					DiscordId: PlayerDiscordMention,
					Status: "Active",
					Characters: [], //for holding Name string and database id to link
					UnassignedReports: [], //for holding unassigned GMXP
					TotalXP: 0, //for calcing every single point of assigned xp to characters. Could be useful for doing slot unlocked
					UntotalXP: 0,
					CharacterSlots: 1 //for max allowed characters
				}

			var data = new PlayerData(item)
			data.save()
			
			await interaction.reply({ content: 'Added ' + PlayerDiscordMention + " Welcome to ALC."});} else if (SameCheck != null) {
				ErrorSend += 'Player already exists';
				await interaction.reply({ content: ErrorSend})
			} 
			else if (typeof PlayerDiscordUsername  != undefined)
			{
				await interaction.reply({ content: ErrorSend})

			}
			break;






			case'infoplayer':
			var PlayerDiscordMention = interaction.options.getString('mention'); 
			
			
			if (PlayerDiscordMention == null ){
				var PlayerDiscordID = interaction.user.id
				var PlayerDiscordMention = "<@"+PlayerDiscordID+">"
				}
				
			PlayerDiscordMention = PlayerDiscordMention.replace(/!/g, ""); 
			var PlayerDiscordID= PlayerDiscordMention.replace(/[\\<>@#&!]/g, "")
			try {
				var PlayerName = await client.users.fetch(PlayerDiscordID)
			} catch (error) {
				await interaction.reply({ content: 'No such player in database or other error.'})
				break;
			}	
			
			console.log(PlayerName)
			if (typeof PlayerName != undefined) {
				var QueryPlayerInfo = await PlayerData.findOne({DiscordId: PlayerDiscordMention})
			  }
			  var CharInfoSting = "";
			  if (QueryPlayerInfo != null){
			  
		
			
			  console.log(QueryPlayerInfo);
				var AllOwnedCharsNumber = QueryPlayerInfo.Characters.length
				QueryPlayerInfo.TotalXP = 0
				QueryPlayerInfo.UntotalXP = 0
				CharInfo = []
				CharInfoSting = ""
				MaxIndexLength = AllOwnedCharsNumber
			  for (i = 0; i < AllOwnedCharsNumber; i++) {
				CharPulled = await CharacterData.findById(QueryPlayerInfo.Characters[i])
				if (CharPulled != null){

				CharInfo.push("\n"+ CharPulled.Status +" - " +`${CharPulled.Name}`
				+ ' - Level: ' + CharPulled.Level 
				+ ' - XP: ' + CharPulled.CurrentXP + "/1000"
				+ ' - Gold: ' + (CharPulled.MaxGold - CharPulled.SpentGold.toFixed(2)) + "/" + CharPulled.MaxGold)
		
				QueryPlayerInfo.TotalXP += CharPulled.TotalXP - CharPulled.ManualXP
			
			} else {CharInfo.push(`\nBroken Character Link`)}
			}
			

			StringToEmbed = CharInfo.slice(0,10).toString().replace(/,/g,"")

			var PlayerInfoSting = bold('Total XP: ' + QueryPlayerInfo.TotalXP + " - Character Slots: " + QueryPlayerInfo.CharacterSlots
			  );
			
			 
				//unassigned Report Info
			  UnassignedReportInfo = []
			  UnassignedReportInfoString = ""
			  NumberOfReportsToPull = QueryPlayerInfo.UnassignedReports.length
			  for (let index = 0; index < NumberOfReportsToPull; index++) {
	  
				  let IDtofind = QueryPlayerInfo.UnassignedReports[index]
					  console.log(IDtofind)
					  QueryReportInfo = await ReportData.findOne({_id: IDtofind})
				  if (QueryReportInfo !== null){
					  UnassignedReportInfo.push("\n" + QueryReportInfo.Name + " - XP: "  + QueryReportInfo.XP)
				  } else {
					  UnassignedReportInfo.push("\n***ERR*** - Failed To Find Report: " + QueryPlayerInfo.UnassignedReports[index])
				  }
				  
			  }
			 
			  


			  //player info embed
				const InfoPlayerCharEmbed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(bold(PlayerName.username))
				.setDescription(PlayerInfoSting+StringToEmbed)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign'});


			  const rowchar = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
                .setCustomId('backId')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
                .setCustomId('forwardId')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
                .setCustomId('reportdesc')
                .setLabel('Unassigned Reports')
                .setStyle(ButtonStyle.Primary)
			)

			const rowreport = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
                .setCustomId('backId')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
                .setCustomId('forwardId')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
                .setCustomId('charlist')
                .setLabel('Character List')
                .setStyle(ButtonStyle.Primary)
			)
		
embedMessage = await interaction.reply({ embeds: [InfoPlayerCharEmbed], components: [rowchar]})


	var collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => user.id === interaction.user.id, time: 180000
	  })
	  
	  let currentIndex = 0
	  let currentPage = "charlist"
	  
	  collector.on('collect', async interaction => {
		if (interaction.customId === 'charlist'){
			currentIndex = 0
			MaxIndexLength = CharInfo.length
			currentPage = interaction.customId
			rowtodisplay = rowchar
			StringToEmbed = "\nCharacters: " + CharInfo.slice(currentIndex, currentIndex + 10 ).toString().replace(/,/g,"")
		} 


		if (interaction.customId === 'reportdesc'){
			currentIndex = 0
			MaxIndexLength = UnassignedReportInfo.length
			currentPage = interaction.customId
			rowtodisplay = rowreport
			StringToEmbed = "\nUnassigned Reports: " + UnassignedReportInfo.slice(currentIndex, currentIndex + 10 ).toString().replace(/,/g,"")
		}
		
		{

		// Increase/decrease index
		if (interaction.customId === 'forwardId' && currentIndex + 10 - MaxIndexLength < 0)
		{currentIndex += 10}
		else if (currentIndex - 10 >= 0 && interaction.customId === 'backId'){currentIndex -= 10}


		if (interaction.customId === 'fowardId' || 'backID'){
		switch(currentPage){
			case"charlist":
			StringToEmbed = "\nCharacters: " + CharInfo.slice(currentIndex, currentIndex + 10 ).toString().replace(/,/g,"")
			rowtodisplay = rowchar
			break


			case"reportdesc":
			StringToEmbed = "\nUnassigned Reports: " + UnassignedReportInfo.slice(currentIndex, currentIndex + 10 ).toString().replace(/,/g,"")
			rowtodisplay = rowreport
			break
		}
		}
		


		// Respond to interaction by updating message with new embed
		await interaction.update({
		  embeds: [new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(bold(PlayerName.username))
			.setDescription(PlayerInfoSting+StringToEmbed)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign'})
			],
			
		  components: [rowtodisplay]
		})


	}
	  })

	} else {
		await interaction.reply({ content: 'No such player in database or other error.'})
	  }


			break;






			  case'newchar':

			  if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff].includes(r.name)) ) {}
				else {
				interaction.reply({ content: "You lack the role(s) to use this command."})
				break
			}



			var StartingLevel = interaction.options.getNumber('startlevel');  
			var PlayerDiscordMention = interaction.options.getString('mention')
			var CharacterName = interaction.options.getString('character'); 

			

			console.log(StartingLevel + " , " + PlayerDiscordMention + " , " + CharacterName)
			
			
			if (CharacterName == null || PlayerDiscordMention == null ){
				await interaction.reply({ content: 'Not all inputs given.'})
				break
				} else if (CharacterName.length >= 30){
				await interaction.reply({ content: 'Name is too long.'})
				break
				}
			
			PlayerDiscordMention = PlayerDiscordMention.replace(/!/g, ""); 
			var	CharacterName =	CharacterName.replace(/[\\@#&!`*_~<>|]/g, "");
			var PlayerDiscordID= PlayerDiscordMention.replace(/[\\<>@#&!]/g, "")
			var PlayerName = await client.users.fetch(PlayerDiscordID)

			
			
			
			if (typeof PlayerName != undefined) {
				var QueryPlayerInfo = await PlayerData.findOne({DiscordId: PlayerDiscordMention})
				var QueryCharacterInfo = await CharacterData.findOne({Name: CharacterName})
			  } else {
				await interaction.reply({ content: 'Incorrect Player Mention'})
				break;
			  }

			  if (QueryPlayerInfo != null && QueryCharacterInfo == null){

					if (QueryPlayerInfo.Characters.length < QueryPlayerInfo.CharacterSlots){
				item = {
					Name: CharacterName,
					BelongsTo: PlayerDiscordMention,//database id
					Created: Date(),
					Level: StartingLevel,
					StartingLevel: StartingLevel,
					CurrentXP: 0,
					TotalXP: 0,
					ManualXP: 0,
					SpentGold: 0,
					MaxGold: GoldAtLevel[StartingLevel],
					Status: 'Awaiting Creation Approval', //basically options for holding info if a character is retired, active so on.
					PurchaseLog: [],
					AssignedReports: []
			}

			var data = new CharacterData(item)
			await data.save();

			var QueryCharacterInfo = await CharacterData.findOne({Name: CharacterName})
			console.log(QueryCharacterInfo)
			await QueryPlayerInfo.Characters.push(QueryCharacterInfo._id)
			await QueryPlayerInfo.save();

			await interaction.reply({ content: 'Created ' + CharacterName + " for " + PlayerDiscordMention});

					} else	 {
					await interaction.reply({ content: 'Player may not have more characters.'})
					break;
				}
		
		} else {
				await interaction.reply({ content: 'Database Error, name already taken or player has not been added.'})
				break;
			  }
			  break

		






			  case'changeslots':


			  if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff].includes(r.name)) ) {}
         	 else {
            interaction.reply({ content: "You lack the role(s) to use this command."})
            break
          }

			  
			var PlayerDiscordMention = interaction.options.getString('mention');  
			var NewSlots = interaction.options.getNumber('slots'); 
			

			if (PlayerDiscordMention == null || NewSlots == null ){
				await interaction.reply({ content: 'Not all inputs given.'})
				break
				}
			if (typeof NewSlots != Number && NewSlots < 0)
			{
				await interaction.reply({ content: 'Invalid value for slots'})
				break
				}

				PlayerDiscordMention = PlayerDiscordMention.replace(/!/g, ""); 
			  
			 var PlayerDiscordID= PlayerDiscordMention.replace(/[\\<>@#&!]/g, "")
			 var PlayerName = await client.users.fetch(PlayerDiscordID)
  
			if (typeof PlayerName != undefined) {
				  var QueryPlayerInfo = await PlayerData.findOne({DiscordId: PlayerDiscordMention})
				} else {
				  await interaction.reply({ content: 'Incorrect Player Mention'})
				  break;
				}

			if (QueryPlayerInfo != null){
				var OldSlots = QueryPlayerInfo.CharacterSlots
				QueryPlayerInfo.CharacterSlots = NewSlots
				await QueryPlayerInfo.save();
				await interaction.reply({ content: PlayerDiscordMention + ' now has ' + NewSlots + ' character slots instead of ' + OldSlots + '.'})
			} else {interaction.reply({ content: 'Did not find player entry'})}
			break;





			case'infocharacter':
			var CharName = interaction.options.getString('character'); 
			if (CharName == null){
				await interaction.reply({ content: 'Not all inputs given.'})
				break
				}
			
			if (typeof CharName != undefined  ){

					var QueryCharacterInfo = await CharacterData.findOne({Name: CharName})
			  }

			  if (QueryCharacterInfo != null){
				var CharInfoSting = bold("Level: "+ QueryCharacterInfo.Level + " - XP: " + QueryCharacterInfo.CurrentXP + "/1000")
				+"\nGold: " + (QueryCharacterInfo.MaxGold - QueryCharacterInfo.SpentGold.toFixed(2)).toFixed(2) + "/" + QueryCharacterInfo.MaxGold
				+"\nStatus: " + QueryCharacterInfo.Status
				
			try {
				PlayerName = await client.users.fetch(QueryCharacterInfo.BelongsTo.replace(/[\\<>@#&!]/g, ""))
				DiscordNameToDisplay = PlayerName.username + "'s "
			} catch (error) {
				DiscordNameToDisplay = "ERR - Could not Find Discord Name of Player"
			}
			 var PlayerName = await client.users.fetch(QueryCharacterInfo.BelongsTo.replace(/[\\<>@#&!]/g, ""))


			 AssignedReportInfo = []
			 PurchaseLogInfo = []
			 ApprovalLogInfo = []
			 AssignedReportInfoString = ""
			 NumberOfReportsToPull = QueryCharacterInfo.AssignedReports.length
			 NumberOfPurchaseLogs = QueryCharacterInfo.PurchaseLog.length
			 NumberOfApprovalLogs = QueryCharacterInfo.ApprovalLog.length

			 for (let index = 0; index < NumberOfReportsToPull; index++) {
	 
				 let IDtofind = QueryCharacterInfo.AssignedReports[index]
					 console.log(IDtofind)
					
					 QueryReportInfo = await ReportData.findOne({_id: IDtofind})

				 if (QueryReportInfo !== null){
					AssignedReportInfo.push("\n"+ QueryReportInfo.RunDate.toLocaleString('en-GB', DateOptions).split(',')[0] +" - "+ QueryReportInfo.Name + " - XP: "  + QueryReportInfo.XP)
				 } else {
					AssignedReportInfo.push("\n***ERR*** - Failed To Find Report: " + QueryCharacterInfo.AssignedReports[index])
				 }
				 
			 }

			 for (let index = 0; index < NumberOfPurchaseLogs; index++) {
	 
				let PLog = QueryCharacterInfo.PurchaseLog[index]
				PurchaseLogInfo.push("\n"+ PLog[0] + " - " + PLog[1] + PLog[2] + " for " + PLog[3]+' gp.')
			
				
			}

			for (let index = 0; index < NumberOfApprovalLogs; index++) {
	 
				let ApprovalEntry = QueryCharacterInfo.ApprovalLog[index]
				ApprovalLogInfo.push("\n"+ ApprovalEntry[0] + " - " + ApprovalEntry[1] + ApprovalEntry[2] + " by " + ApprovalEntry[3] + "/" + ApprovalEntry[4])
			
				
			}

			



			 

			  //char info embed
				const InfoCharEmbed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(bold(DiscordNameToDisplay + QueryCharacterInfo.Name))
				.setDescription(CharInfoSting)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign'});
			
			  
	
				const rowindex = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
					.setCustomId('backId')
					.setLabel('Previous')
					.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
					.setCustomId('forwardId')
					.setLabel('Next')
					.setStyle(ButtonStyle.Primary)
				)
				
				const rowinfochar= new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
					.setCustomId('characterinfo')
					.setLabel('Overview')
					.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
					.setCustomId('purchaselog')
					.setLabel('Purchase Logs')
					.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
					.setCustomId('sessionreports')
					.setLabel('Session Reports')
					.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
					.setCustomId('approvallog')
					.setLabel('Approval Log')
					.setStyle(ButtonStyle.Primary),
					
				)
	

				
			
	embedMessage = await interaction.reply({ embeds: [InfoCharEmbed], components: [rowinfochar]})
	
	
		var collector = embedMessage.createMessageComponentCollector({
			filter: ({user}) => user.id === interaction.user.id, time: 180000
		  })
		
		  let MaxIndexLength = 0
		  let currentIndex = 0
		  let rowtodisplay = [rowinfochar, rowindex]
		  let currentPage = "characterinfo"
		  
		  collector.on('collect', async interaction => {
			QueryCharacterInfo = await CharacterData.findOne({Name: CharName})

			if (interaction.customId === 'sessionreports'){
				currentIndex = 0
				MaxIndexLength = AssignedReportInfo.length
				currentPage = interaction.customId
				StringToEmbed = bold("Level: "+ QueryCharacterInfo.Level + " - XP: " + QueryCharacterInfo.CurrentXP + "/1000")
				+"\n**Session Reports** " + AssignedReportInfo.slice(currentIndex, currentIndex + 10 ).toString().replace(/,/g,"")
			} 
	
	
			if (interaction.customId === 'purchaselog'){
				currentIndex = 0
				MaxIndexLength = PurchaseLogInfo.length
				currentPage = interaction.customId
				StringToEmbed = bold("Gold: " + (QueryCharacterInfo.MaxGold - QueryCharacterInfo.SpentGold.toFixed(2)).toFixed(2) + "/" + QueryCharacterInfo.MaxGold)+
				"\n**Purchase Log:** " + PurchaseLogInfo.slice(currentIndex, currentIndex + 10 ).toString().replace(/,/g,"")
			}

			if (interaction.customId === 'approvallog'){
				currentIndex = 0
				MaxIndexLength = ApprovalLogInfo.length
				currentPage = interaction.customId
				StringToEmbed = "**Approval Log:** " + ApprovalLogInfo.slice(currentIndex, currentIndex + 10 ).toString().replace(/,/g,"")
			}
			
			if (interaction.customId === 'characterinfo'){
				currentIndex = 0
				MaxIndexLength = 0
				currentPage = interaction.customId
				StringToEmbed = bold("Level: "+ QueryCharacterInfo.Level + " - XP: " + QueryCharacterInfo.CurrentXP + "/1000")
				+"\nGold: " + (QueryCharacterInfo.MaxGold - QueryCharacterInfo.SpentGold.toFixed(2)).toFixed(2) + "/" + QueryCharacterInfo.MaxGold
				+"\nStatus: " + QueryCharacterInfo.Status
			}
			
			{
	
			// Increase/decrease index
			if (interaction.customId === 'forwardId' && currentIndex + 10 - MaxIndexLength < 0)
			{currentIndex += 10}
			else if (currentIndex - 10 >= 0 && interaction.customId === 'backId'){currentIndex -= 10}
	
	
			if (interaction.customId === 'fowardId' || 'backID' && interaction.customId !== 'characterinfo'){
			switch(currentPage){
				case"purchaselog":
				StringToEmbed = bold("Gold: " + (QueryCharacterInfo.MaxGold - QueryCharacterInfo.SpentGold.toFixed(2)) + "/" + QueryCharacterInfo.MaxGold)+
				"\n**Purchase Log:** " + PurchaseLogInfo.slice(currentIndex, currentIndex + 10 ).toString().replace(/,/g,"")
				break
				
				case"approvallog":
				StringToEmbed = "**Approval Log:** " + ApprovalLogInfo.slice(currentIndex, currentIndex + 10 ).toString().replace(/,/g,"")
				break
	
				case"reportdesc":
				StringToEmbed = bold("Level: "+ QueryCharacterInfo.Level + " - XP: " + QueryCharacterInfo.CurrentXP + "/1000")
				+"\n**Assigned Reports:**" + AssignedReportInfoString.slice(currentIndex, currentIndex + 10 ).toString().replace(/,/g,"")
				break
			}
			}
			
			if (MaxIndexLength > 10){
				
			// Respond to interaction by updating message with new embed
			await interaction.update({
				embeds: [new EmbedBuilder()
				  .setColor(0x0099FF)
				  .setTitle(bold(DiscordNameToDisplay + QueryCharacterInfo.Name))
				  .setDescription(StringToEmbed)
				  .setTimestamp()
				  .setFooter({ text: 'Absalom Living Campaign'})
				  ],
				  
				components: [rowinfochar, rowindex]
			  })
			} 
			else {

				await interaction.update({
					embeds: [new EmbedBuilder()
					  .setColor(0x0099FF)
					  .setTitle(bold(DiscordNameToDisplay + QueryCharacterInfo.Name))
					  .setDescription(StringToEmbed)
					  .setTimestamp()
					  .setFooter({ text: 'Absalom Living Campaign'})
					  ],
					  
					components: [rowinfochar]

			}
		  )}
	
	
		}
		  })
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			} else {
				await interaction.reply({ content: 'No such character in database or other error.'})
			  }
			break;
		
		
		


		
		
			case'newsessionreport':


			if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff,RolePlayerGM].includes(r.name)) ) {}
         	 else {
            interaction.reply({ content: "You lack the role(s) to use this command."})
            break
          }
		  	var StringToReply = 'ERR'
		  	var GMstoReport = []
		  	var MakeSSR = false
			var PlayerDiscordMention = interaction.options.getString('gm');  
			var ReportName = interaction.options.getString('reportname'); 
		
			if (ReportName == null || PlayerDiscordMention == null ){
				await interaction.reply({ content: 'Not all inputs given.'})
				break
				} else if (ReportName.length >= 60){
				await interaction.reply({ content: 'Name is too long.'})
				break
				}
			
				PlayerDiscordMention = PlayerDiscordMention.replace(/!/g, ""); 
			var	ReportName =ReportName.replace(/[\\@#&!`*_~<>|]/g, "");
			var PlayerDiscordID= PlayerDiscordMention.replace(/[\\<>@#&!]/g, "")





			EmbedString = 'Do you wish to make the SR "**' + ReportName + '**" - ran by "**' + PlayerDiscordMention + '**"?'  
				
			var ConfirmEmbed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setDescription(EmbedString)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign'});
	
			embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow]})
	
	
			var collector = embedMessage.createMessageComponentCollector({
				filter: ({user}) => user.id === interaction.user.id, time: 180000
			  })
			  
			collector.on('collect', async interaction => {
				
				switch (interaction.customId) {
					case 'yes':
					
					
			if (PlayerDiscordMention === "@everyone"){
				
				if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff].includes(r.name)) ){

					MakeSSR = true
					StringToReply = 'Special Session Report ***"'+ ReportName + '"*** has been created'
					await PlayerData.find({  Status: "Active"}).then((PlayerDatas) => {
						PlayerDatas.forEach((PlayerData) => {
							GMstoReport.push(PlayerData._id)
			
						});})

				}
				else {
		  		interaction.update({ content: "You lack the role(s) to make a SSR report.", embeds: [], components: []})
				break
		  		}

			} else {

			try {
			var PlayerName = await client.users.fetch(PlayerDiscordID)
			} catch (error) {
			await interaction.update({ content: 'Incorrect Player Mention', embeds: [], components: []})
			console.log(PlayerDiscordMention)
			break;
			}
				

			if (typeof PlayerName != undefined) {
				var QueryPlayerInfo = await PlayerData.findOne({DiscordId: PlayerDiscordMention})
			  } else {
				await interaction.update({ content: 'Incorrect Player Mention', embeds: [], components: []})
				break;
			  }

			  if (QueryPlayerInfo === null){
				await interaction.update({ content: 'Name already taken or GM did not have a player profile assigned to them.', embeds: [], components: []})
				break
			}
				GMstoReport = QueryPlayerInfo._id
				StringToReply = 'Report for ***"'+ ReportName + '"*** has been created, ran by ' + PlayerName.username
			}

			
				


				var QueryReportInfo = await ReportData.findOne({Name: ReportName})
			  if (QueryReportInfo === null){
	
				item = {
					Name: ReportName, 
					RunDate: Date(), //?
					XP: 250, //default 250 but add option
					Description: "The Description has not been updated.",
					GMs: GMstoReport, //anyone who gets unassigned xp. 
					Characters: [], //id.
					SSR: MakeSSR,
					Published: false, //to determine if the Report should in players hands.
					}

			var data = new ReportData(item)
			await data.save();
			await interaction.update({ content: StringToReply, embeds: [], components: []})
 	}		else {await interaction.update({ content: 'Name already taken or GM did not have a player profile assigned to them.', embeds: [], components: []})}
						
						collector.stop()
	
						break;
					
					case 'no':
						await interaction.update({
							content: "Cancelled.", embeds: [], components: []
					 })
					 collector.stop()
					 break
	
				}
					
			  })






		
			break;




			case'addchartosr':

			if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff,RolePlayerGM].includes(r.name)) ) {}
         	 else {
            interaction.reply({ content: "You lack the role(s) to use this command."})
            break
          }

		var CharsFromMessage = [
		interaction.options.getString('character-1'),
		interaction.options.getString('character-2'),
		interaction.options.getString('character-3'),
		interaction.options.getString('character-4'),
		interaction.options.getString('character-5'),
		interaction.options.getString('character-6'),
		interaction.options.getString('character-7'),
		interaction.options.getString('character-8')
		]

		console.log(CharsFromMessage);
	
		var ReportName = interaction.options.getString('reportname'); 
	
		if (ReportName == null){
			await interaction.reply({ content: 'Not all inputs given.'})
			break
			} else if (ReportName.length >= 60){
			await interaction.reply({ content: 'Name is too long.'})
			break
			}

			if (CharsFromMessage.every(element => element === null)){
			await interaction.reply({ content: 'No characters given.'})
			break
			}
			
			
		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, "");


		EmbedString = 'Do you wish to add the following characters to SR "**' + ReportName + '**"?\n' + CharsFromMessage
				
		var ConfirmEmbed = new EmbedBuilder()
		.setColor(0x0099FF)
		.setDescription(EmbedString)
		.setTimestamp()
		.setFooter({ text: 'Absalom Living Campaign'});

		embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow]})


		var collector = embedMessage.createMessageComponentCollector({
			filter: ({user}) => user.id === interaction.user.id, time: 180000
		  })
		  
		collector.on('collect', async interaction => {
			
			switch (interaction.customId) {
				case 'yes':
				
				
					CharsAddToReport(CharsFromMessage,ReportName,interaction)
					collector.stop()

					break;
				
				case 'no':
					await interaction.update({
						content: "Cancelled.", embeds: [], components: []
				 })
				 collector.stop()
				 break

			}
				
		  })







	
			break
		


			case'publishsessionreport':

			if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff,RolePlayerGM].includes(r.name)) ) {}
         	 else {
            interaction.reply({ content: "You lack the role(s) to use this command."})
            break
          }


			var ReportName = interaction.options.getString('reportname'); 
	
		if (ReportName == null){
			await interaction.reply({ content: 'Not all inputs given.'})
			break
			} else if (ReportName.length >= 60){
			await interaction.reply({ content: 'Name is too long.'})
			break
			}
		

			
		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, "");


		EmbedString = 'Do you wish to publish the SR "**' + ReportName + '**"?'
				
				var ConfirmEmbed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setDescription(EmbedString)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign'});

			embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow]})

			var collector = embedMessage.createMessageComponentCollector({
				filter: ({user}) => user.id === interaction.user.id, time: 180000
			  })
			  
			collector.on('collect', async interaction => {
				
				switch (interaction.customId) {
					case 'yes':
						
					var QueryReportInfo = await ReportData.findOne({Name: ReportName})
		
					if (QueryReportInfo !== null){
						
						
						if (QueryReportInfo.SSR === true){
							if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff,].includes(r.name)) ) {}
							else {
							interaction.update({ content: "You lack the role(s) to modify this SSR.", embeds: [], components: []})
							collector.stop()
							 break
							
							}
					}
						
						PublishSR(QueryReportInfo,interaction)
						collector.stop()
					
					
					} else {await interaction.update({ content: 'Report ' + ReportName + ' not found.', embeds: [], components: []})}
			
				
						collector.stop()
						break

						break;
					
					case 'no':
						await interaction.update({
							content: "Cancelled.", embeds: [], components: []
					 })
					 collector.stop()
					 break

				}
					
			  })

			  break
			  
			case'changereportdescription': 

			if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff,RolePlayerGM].includes(r.name)) ) {}
         	 else {
            interaction.reply({ content: "You lack the role(s) to use this command."})
            break
			 }
			var ReportName = interaction.options.getString('reportname'); 
			var DescriptionForReport = interaction.options.getString('reportdescription'); 
	
		if (ReportName == null || DescriptionForReport == null){
			await interaction.reply({ content: 'Not all inputs given.'})
			break
			} else if (ReportName.length >= 60){
			await interaction.reply({ content: 'Report name is too long.'})
			break
			}
		

			
		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, "");

		var QueryReportInfo = await ReportData.findOne({Name: ReportName})
		
		if (QueryReportInfo !== null){
			if (QueryReportInfo.SSR === true){
				if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff,].includes(r.name)) ) {}
				else {
				interaction.reply({ content: "You lack the role(s) to modify this SSR."})
				break
				}
		}

			QueryReportInfo.Description = DescriptionForReport
			await QueryReportInfo.save()
			await interaction.reply({ content: 'Description for report ***' + ReportName + '*** has been updated.'})

		} else {await interaction.reply({ content: 'Report ' + ReportName + ' not found.'})}

		break





			
		case'inforeport':
		
		var ReportName = interaction.options.getString('reportname'); 
	
		if (ReportName == null){
			await interaction.reply({ content: 'Not all inputs given.'})
			break
			} else if (ReportName.length >= 60){
			await interaction.reply({ content: 'Name is too long.'})
			break
			}
		

			
		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, "");

		var QueryReportInfo = await ReportData.findOne({Name: ReportName})
		
		if (QueryReportInfo !== null){
			var GMid;
			QueryPlayerData = await PlayerData.findOne({_id: QueryReportInfo.GMs[0]})

			if (QueryPlayerData != null) {
			var GMid = QueryPlayerData.DiscordId.replace(/[\\@#&!`*_~<>|]/g, "")
			console.log(GMid)
			}
			if (QueryReportInfo.SSR === false){
				var GMName = await client.users.fetch(GMid);
			}
			

			if (typeof GMName != undefined && GMName != null){
			var SRtitle = QueryReportInfo.Name + " - Ran by " + GMName.username }
			else if (QueryReportInfo.SSR === true) {
			var SRtitle = QueryReportInfo.Name + " - Special Session Report."
			}  else {
				var SRtitle = QueryReportInfo.Name
				}
		
		
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
				new ButtonBuilder()
                .setCustomId('reportdesc')
                .setLabel('Report Description')
                .setStyle(ButtonStyle.Primary)
			)

			const rowdesc = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
                .setCustomId('charlist')
                .setLabel('Character List')
                .setStyle(ButtonStyle.Primary)
			)
			
			const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(SRtitle)
			.setDescription(QueryReportInfo.Description)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign'});				

embedMessage = await interaction.reply({ embeds: [embed], components: [rowdesc]})


	var collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => user.id === interaction.user.id, time: 180000
	  })
	  
	  let currentIndex = 0
	  collector.on('collect', async interaction => {
		if (interaction.customId === 'reportdesc'){
		await interaction.update({ embeds: [embed], components: [rowdesc]})
		} else
		
		{




		// Increase/decrease index
		if (interaction.customId === 'forwardId' && currentIndex + 10 - QueryReportInfo.Characters.length < 0)
		{currentIndex += 10}
		else if (currentIndex - 10 >= 0 && interaction.customId === 'backId'){currentIndex -= 10}

	
		if (interaction.customId === 'charlist'){
			currentIndex = 0
		} 

		CharInReportID = QueryReportInfo.Characters.slice(currentIndex, currentIndex + 10 )
		CharInReportDisplay = "Characters: "

		for (const element of CharInReportID) {
			 var QueryCharacterInfo = await CharacterData.findOne({_id: element});

			if (QueryCharacterInfo != null){
				CharInReportDisplay += "\n "+ QueryCharacterInfo.Name
			}
		}

		// Respond to interaction by updating message with new embed
		await interaction.update({
		  embeds: [new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(SRtitle)
			.setDescription(CharInReportDisplay)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign'})
			],
			
		  components: [rowlist]
		})


	}
	  })





			}
		break
		
			case'assignreporttochar':

			if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff,RolePlayerGM].includes(r.name)) ) {}
         	 else {
            interaction.reply({ content: "You lack the role(s) to use this command."})
            break
          }


			var PlayerDiscordID = interaction.user.id
			var PlayerDiscordMention = "<@"+PlayerDiscordID+">"
			var CharName = interaction.options.getString('character')
			var ReportName = interaction.options.getString('reportname'); 
			var StringToReply =""
		
			if (ReportName == null || PlayerDiscordMention == null ){
				await interaction.reply({ content: 'Not all inputs given.'})
				break
				} else if (ReportName.length >= 60){
				await interaction.reply({ content: 'Name is too long.'})
				break
				}
			
			var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, "");


			EmbedString = 'Do you wish to add the unassigned report "**' + ReportName + '**" to **"' + CharName +'**"?'
				
		var ConfirmEmbed = new EmbedBuilder()
		.setColor(0x0099FF)
		.setDescription(EmbedString)
		.setTimestamp()
		.setFooter({ text: 'Absalom Living Campaign'});

		embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow]})


		var collector = embedMessage.createMessageComponentCollector({
			filter: ({user}) => user.id === interaction.user.id, time: 180000
		  })
		  
		collector.on('collect', async interaction => {
			
			switch (interaction.customId) {
				case 'yes':


					var PlayerName = await client.users.fetch(PlayerDiscordID)

			
			if (typeof PlayerName != undefined) {
				var QueryPlayerInfo = await PlayerData.findOne({DiscordId: PlayerDiscordMention})
				var QueryReportInfo = await ReportData.findOne({Name: ReportName})
				var QueryCharInfo = await CharacterData.findOne({Name: CharName})
				console.log(QueryPlayerInfo)
				console.log(QueryReportInfo)
				console.log(QueryCharInfo)
			  } else {
				await interaction.update({ content: 'Did not find all the database entries. Check for typos.', embeds: [], components: []})
				break;
			  }

			  if (QueryPlayerInfo != null && QueryReportInfo !== null && QueryCharInfo != null){
				
				if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId){
					if (QueryPlayerInfo.UnassignedReports.includes(QueryReportInfo._id) == true){

	
						
						QueryCharInfo.AssignedReports.push(QueryReportInfo._id);
						QueryCharInfo.CurrentXP += QueryReportInfo.XP
						QueryCharInfo.TotalXP += QueryReportInfo.XP
				
						StringToReply += '\n***' + QueryCharInfo.Name + '*** gained ' + QueryReportInfo.XP + " XP!"
				
					while(QueryCharInfo.CurrentXP >= 1000 && QueryCharInfo.Level < 10){
					QueryCharInfo.CurrentXP -= 1000
					QueryCharInfo.Level += 1
					StringToReply += '\n***' + QueryCharInfo.Name + '*** gained enough XP to gain level ' + QueryCharInfo.Level + '!' 
					}
	
					QueryCharInfo.MaxGold = CalcGoldFromXP(QueryCharInfo)
				
					await QueryCharInfo.save();
					var index = QueryPlayerInfo.UnassignedReports.indexOf(QueryReportInfo._id)
					if (index > -1) { // only splice array when item is found
					QueryPlayerInfo.UnassignedReports.splice(index, 1); // 2nd parameter means remove one item only
					}
					
					
					await QueryPlayerInfo.save();
					StringToReply += '\n***' + QueryReportInfo.Name +'*** has been given to ***' + QueryCharInfo.Name +'!***'
					await interaction.update({ content: StringToReply, embeds: [], components: []})



					} else {await interaction.update({ content: '***'+ QueryReportInfo.Name+'*** session report does not belong to you / you already used it.', embeds: [], components: []})}
				} else {await interaction.update({ content: '***'+ QueryCharInfo.Name+'*** character does not belong to you.', embeds: [], components: []})}
 	}		else {await interaction.update({ content: 'Did not find every database entry.', embeds: [], components: []})}
				
				
					collector.stop()

					break;
				
				case 'no':
					await interaction.update({
						content: "Cancelled.", embeds: [], components: []
				 })
				 collector.stop()
				 break

			}
				
		  })









			
			break



			case'purchase':
			var PlayerDiscordID = interaction.user.id
			var PlayerDiscordMention = "<@"+PlayerDiscordID+">"
			var CharName = interaction.options.getString('character')
			var PurchasedItem = interaction.options.getString('item')
			var PurchasedValue = interaction.options.getNumber('gp')

			var StringToReply =""
		
			if (CharName == null || PurchasedItem == null || PurchasedValue == null){
				await interaction.reply({ content: 'Not all inputs given.'})
				break
				} else if (PurchasedItem.length >= 80){
				await interaction.reply({ content: 'Name is too long.'})
				break
				}


				EmbedString = 'Do you wish to buy/sell "**' + PurchasedItem + '**"' + ' for **' + PurchasedValue + ' gp** on "**' + CharName + '**"'
				
				var ConfirmEmbed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setDescription(EmbedString)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign'});
		
				embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow]})
		
		
				var collector = embedMessage.createMessageComponentCollector({
					filter: ({user}) => user.id === interaction.user.id, time: 180000
				  })
				  
				collector.on('collect', async interaction => {
					
					switch (interaction.customId) {
						case 'yes':
						
						
							var PlayerName = await client.users.fetch(PlayerDiscordID)

			
			if (typeof PlayerName != undefined) {
				var QueryPlayerInfo = await PlayerData.findOne({DiscordId: PlayerDiscordMention})
				var QueryCharInfo = await CharacterData.findOne({Name: CharName})
				console.log(QueryPlayerInfo)
				console.log(QueryCharInfo)
			}

			  if (QueryPlayerInfo != null && QueryCharInfo != null){
				if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId){

					PurchaseDate = new Date()
					PurchaseDate = PurchaseDate.toLocaleString('en-GB', DateOptions).split(',')[0]
					
					if (PurchasedValue >= 0) {
						RemainingGold  = QueryCharInfo.MaxGold - QueryCharInfo.SpentGold.toFixed(2)
						if (PurchasedValue <= RemainingGold){
						var PurchaseEntry = [PurchaseDate,"Bought: ",PurchasedItem,PurchasedValue] //date,sold/bought,item,value.
						QueryCharInfo.PurchaseLog.push(PurchaseEntry)
						QueryCharInfo.SpentGold += PurchasedValue

						await QueryCharInfo.save()
						await interaction.update({ content: 'Added Entry: ' +'"' + PurchaseEntry[0] + " - " + PurchaseEntry[1] + PurchaseEntry[2] + " for " + PurchaseEntry[3]+' gp."' + " to " +QueryCharInfo.Name + ".", embeds: [], components: []})
					
						} else {await interaction.update({ content: QueryCharInfo.Name + " can't afford this item.", embeds: [], components: []})}

					} else if (PurchasedValue < 0) {
						
						if (QueryCharInfo.SpentGold >= PurchasedValue){
						var PurchaseEntry = [PurchaseDate,"Sold: ",PurchasedItem,PurchasedValue] //date,sold/bought,item,value.
						QueryCharInfo.PurchaseLog.push(PurchaseEntry)
						QueryCharInfo.SpentGold += PurchasedValue

						await QueryCharInfo.save()
						await interaction.update({ content: 'Added Entry: ' +'"' + PurchaseEntry[0] + " - " + PurchaseEntry[1] + PurchaseEntry[2] + " for " + PurchaseEntry[3]+' gp"' + " to " +QueryCharInfo.Name + ".", embeds: [], components: []})
						
						} else {await interaction.update({ content: QueryCharInfo.Name + " never spent this much gp.", embeds: [], components: []})}
				
						} else {
						await interaction.update({ content: "ERR", embeds: [], components: []})}
					
					
					




				}	else{
					await interaction.update({ content: 'Character does not belong to you, get your own, stinky.', embeds: [], components: []})
					break;
				  } 
		
			} else{
				await interaction.update({ content: 'Did not find all the database entries. Check for typos.', embeds: [], components: []})
				break;
			  }
							collector.stop()
		
							break;
						
						case 'no':
							await interaction.update({
								content: "Cancelled.", embeds: [], components: []
						 })
						 collector.stop()
						 break
		
					}
						
				  })
		










			
		

		break


		case"changestatus":

		
		if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff].includes(r.name)) ) {}
		else {
	  interaction.reply({ content: "You lack the role(s) to use this command."})
	  break
	}



		var CharName = interaction.options.getString('character')
		var PlayerDiscordMention = interaction.options.getString('mention')
		var NewStatus = interaction.options.getString('status')


		if (typeof PlayerDiscordMention != undefined && PlayerDiscordMention !== null){
			PlayerDiscordMention = PlayerDiscordMention.replace(/!/g, ""); 
			StringToReply = ""
			var QueryPlayerInfo = await PlayerData.findOne({DiscordId: PlayerDiscordMention})
			if (QueryPlayerInfo !== null){
				for (const CharacterID of QueryPlayerInfo.Characters) {
				var QueryCharInfo = await CharacterData.findOne({_id: CharacterID})

				if (QueryCharInfo !== null){
					let OldStatus = QueryCharInfo.Status
					QueryCharInfo.Status = NewStatus
					await QueryCharInfo.save()

					StringToReply += '\nSet "' + QueryCharInfo.Name +'" to ***' + NewStatus + '*** from ***' + OldStatus + '***.'

				} else {
					StringToReply += '\nDid not find the character "'+CharacterID+'" in the database.'
					}
				}
			} else { interaction.reply({ content: 'Did not find player: ' + PlayerDiscordMention})
			break
		}	
		interaction.reply({ content: StringToReply})
		break

		} else if (typeof CharName != undefined) {
			var QueryCharInfo = await CharacterData.findOne({Name: CharName})
			console.log(QueryCharInfo)
		  } else {
			await interaction.reply({ content: 'Did not find a character name.'})
			break;
		  }

		  if (QueryCharInfo != null){
			let OldStatus = QueryCharInfo.Status
			QueryCharInfo.Status = NewStatus
			await QueryCharInfo.save()

			await interaction.reply({ content: 'Set "' + CharName +'" to ***' + NewStatus + '*** from ***' + OldStatus + '***.'})

		break
		  } else {
			await interaction.reply({ content: 'Did not find the character.'})
			}
		break;




		case'returnallplayers':
		var AllPlayers = []
		await PlayerData.find({ Characters:{$exists: true, $not: {$size: 0}}, Status: "Active"}).then((PlayerDatas) => {
			PlayerDatas.forEach((PlayerData) => {
				AllPlayers.push(PlayerData.DiscordId)

			});})


		console.log(AllPlayers)
		break

		case'addapproval':

			if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff].includes(r.name)) ) {}
         	 else {
            interaction.reply({ content: "You lack the role(s) to use this command."})
            break
          }

			var PlayerDiscordID = interaction.user.id
			var PlayerDiscordMention = "<@"+PlayerDiscordID+">"
			var CharName = interaction.options.getString('character')
			var ApprovalLine = interaction.options.getString('approval')
			

			var StringToReply =""
		
			if (CharName == null || ApprovalLine == null){
				await interaction.reply({ content: 'Not all inputs given.'})
				break
				} else if (ApprovalLine.length > 120){
				await interaction.reply({ content: 'Approval length too long.'})
				break
				}


				EmbedString = 'Do you wish to approve of "**' + ApprovalLine + '**" for "**' + CharName + '**"?'
				
		var ConfirmEmbed = new EmbedBuilder()
		.setColor(0x0099FF)
		.setDescription(EmbedString)
		.setTimestamp()
		.setFooter({ text: 'Absalom Living Campaign'});

		embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow]})


		var collector = embedMessage.createMessageComponentCollector({
			filter: ({user}) => user.id === interaction.user.id, time: 180000
		  })
		  
		collector.on('collect', async interaction => {
			
			switch (interaction.customId) {
				case 'yes':
						var PlayerName = await client.users.fetch(PlayerDiscordID)

			
					if (typeof PlayerName != undefined) {
						var QueryCharInfo = await CharacterData.findOne({Name: CharName})
						console.log(QueryCharInfo)
					}
		
					  if (QueryCharInfo != null){
					
		
							ApprovalDate = new Date()
							ApprovalDate = ApprovalDate.toLocaleString('en-GB', DateOptions).split(',')[0]
							
								RemainingGold  = QueryCharInfo.MaxGold - QueryCharInfo.SpentGold.toFixed(2)
								
								var ApprovalEntry = [ApprovalDate,"Approval: ", ApprovalLine , PlayerName.username, PlayerDiscordMention] //date,item approved,player approving, Discord ID of approver
								QueryCharInfo.ApprovalLog.push(ApprovalEntry)
							
		
								await QueryCharInfo.save()
								await interaction.update({ content: 'Added Entry: ' +'"' + ApprovalEntry[0] + " - " + ApprovalEntry[1] + ApprovalEntry[2] + " by " + ApprovalEntry[3] + "/" + ApprovalEntry[4]+'"', embeds: [], components: []})
							
								
							
						
					} else{
						await interaction.update({ content: 'Did not find all the database entries. Check for typos.', embeds: [], components: []})
						break;
					  }
				
					
					collector.stop()

					break;
				
				case 'no':
					await interaction.update({
						content: "Cancelled.", embeds: [], components: []
				 })
				 collector.stop()
				 break

			}
				
		  })



		
			

		break
	
	
		case"addxp":
		
		if (interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff].includes(r.name)) ) {}
		else {
	  interaction.reply({ content: "You lack the role(s) to use this command."})
	  break
	}
			
		var CharName = interaction.options.getString('character')
		var XPtoAdd = Math.round(interaction.options.getNumber('xp'))

		var StringToReply =""
	
		if (CharName == null || XPtoAdd == null){
			await interaction.reply({ content: 'Not all inputs given.'})
			break
			} else if (CharName.length >= 31){
			await interaction.reply({ content: 'Name is too long.'})
			break
			}
	

		
		if (typeof CharName != undefined) {

			var QueryCharInfo = await CharacterData.findOne({Name: CharName})
			console.log(QueryCharInfo)
		}

		  if (QueryCharInfo != null){
			QueryCharInfo.ManualXP += XPtoAdd
			await QueryCharInfo.save();
			RecalcCharacter(CharName,interaction);
		} else {
			await interaction.reply({ content: 'Did not find the character.'})
			}


		break


		case"recalculatecharacter":
			
		var CharName = interaction.options.getString('character')

		var StringToReply =""
	
		if (CharName == null){
			await interaction.reply({ content: 'Not all inputs given.'})
			break
			} else if (CharName.length >= 31){
			await interaction.reply({ content: 'Name is too long.'})
			break
			}
	

		
		if (typeof CharName != undefined) {

			RecalcCharacter(CharName,interaction);
		} else {
			await interaction.reply({ content: 'Did not find the character.'})
			}
		break


		case'renamecharacter':
		var OldCharName = interaction.options.getString('oldname')
		var NewCharName = interaction.options.getString('newname').replace(/[\\@#&!`*_~<>|]/g, "");


			var PlayerDiscordID = interaction.user.id
			var PlayerDiscordMention = "<@"+PlayerDiscordID+">"
			
			var StringToReply =""
		
			if (OldCharName == null || NewCharName == null){
				await interaction.reply({ content: 'Not all inputs given.'})
				break
				} else if (NewCharName.length > 30){
				await interaction.reply({ content: 'Name is too long.'})
				break
				}


				EmbedString = 'You wish to rename "**' + OldCharName + '**" to "**' + NewCharName +'**"?'
				
				var ConfirmEmbed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setDescription(EmbedString)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign'});

			embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow]})
			
			var collector = embedMessage.createMessageComponentCollector({
				filter: ({user}) => user.id === interaction.user.id, time: 180000
			  })
			
			  
			collector.on('collect', async interaction => {
				
				if (interaction.customId === 'yes'){


					



						var QueryPlayerInfo = await PlayerData.findOne({DiscordId: PlayerDiscordMention})
						var QueryCharInfo = await CharacterData.findOne({Name: OldCharName})
						var NewNameCheck = await CharacterData.findOne({Name: NewCharName})
	
					
	
					if (QueryPlayerInfo != null && QueryCharInfo != null && NewNameCheck == null){
						if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId || interaction.member.roles.cache.some(r=>[RoleBotAdmin,RoleStaff].includes(r.name))){
							
							QueryCharInfo.Name = NewCharName
							QueryCharInfo.save();

							await interaction.update({
								content: 'Renamed "**' + OldCharName + '**" to "**' + NewCharName +'**".', embeds: [], components: []
							  })


						} else {
							await interaction.update({
							content: "Character does not belong to you.", embeds: [], components: []
						  })}
						} else {
							await interaction.update({
								content: "Did not find player/character in database or name is already taken.", embeds: [], components: []
							  })
						}
					
					

					} else if (interaction.customId === 'no'){
					await interaction.update({
						content: "Cancelled.", embeds: [], components: []
					  })

				}
					
			  })
				
			

			


			








		break
}
	



});





// Login to Discord with your client's token
client.login( token );



