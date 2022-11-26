const { databasetoken } = require('./config.json');
const mongoose = require('mongoose')


    mongoose.connect(
       databasetoken ||
       {
               keepAlive: true,
       }
   )
   console.log('Ready!')
    
