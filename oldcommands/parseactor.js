const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	GoldAtLevel,
	GoldPerXP,
	RoleBotAdmin,
	RoleStaff,
	RolePlayerGM,
	CollecterTimeout,
	DateOptions,
	PlayerEmbedColor,
	CharacterEmbedColor,
	ConfirmEmbedColor,
	ReportEmbedColor,
	CharacterData,
	PlayerData,
	ReportData,
	CardData,
	RandomRange,
	CalcGoldFromXP,
	EuroDateFunc,
	GenCardEmbed,
	RecalcCharacter,
	CharsAddToReport,
	GMsAddToReport,
	PublishSR,
    ConfirmRow,
} = require('../constants.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bold } = require('discord.js');



module.exports = {
	data: new SlashCommandBuilder().setName('parseactor')
    .setDescription('test command.'),
	async execute(interaction,client) {

        await interaction.deferReply();
        
        'use strict';

const fs = require('fs');
const readline = require('readline');

let NumberOfCharacters = 0

function convert(file) {

    return new Promise((resolve, reject) => {

        const stream = fs.createReadStream(file);
        // Handle stream error (IE: file not found)
        stream.on('error', reject);

        const reader = readline.createInterface({
            input: stream
        });

        const array = [];

        reader.on('line', line => {
            array.push(JSON.parse(line));
        });

        reader.on('close', () => resolve(array));
    });
}

let CharacterClasses = []

await convert('./actors.json')
    .then(res => {
        for (const iterator of res) {
            try {

                
                
                
                /*{
                    "system":{
                    "traits":{
                        "value": [
                           "archetype",
                           "dedication"
                        ]
                    }
                }
            }
                
                nestedFilter = (targetArray, filters) => {
                    var filterKeys = Object.keys(filters);
                    return targetArray.filter(function (eachObj) {
                      return filterKeys.every(function (eachKey) {
                        if (!filters[eachKey].length) {
                          return true; 
                        }
                        return filters[eachKey].includes(eachObj[eachKey]);
                     });
                 });
              };*/

              
            
            //let Class = iterator.items.filter(el => el.name.includes("Dedication"))
          //  let Ancestry = iterator.system.details.gender.value
            NumberOfCharacters += 1
            let Class = iterator.items.find(item => item.type === "background").name;
              //console.log(Class)
           
			
					
             // for (const iterator of Class) {

                IsCharList = CharacterClasses.findIndex(item => item.name === Class);

               
                if (IsCharList === -1) {
                    Classes ={
                        name: Class,
                        value: 1
                    }

					CharacterClasses.push(Classes)
				} else {
                    CharacterClasses[IsCharList].value += 1;
                }
                
            

            //console.log(iterator.name + " = " + Ancestry + " - " + Class)
                
            } catch (error) {
                
            }
         

        }
        
    })
    .catch(err => console.error(err));

    CharacterClasses.sort(function(a, b) {
        const SET_order = a.name.localeCompare(b.name);
        const CID_order = parseInt(b.value) - parseInt(a.value);
        return CID_order || SET_order;
    });

    console.log(CharacterClasses)
    console.log(NumberOfCharacters)


    }
}