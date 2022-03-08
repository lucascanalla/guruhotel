const mongoose = require('mongoose');
const axios = require('axios');
const config = require('../../config.js');

async function dbConn() {
    try {
        await mongoose.connect(config.dbPath, {
            connectTimeoutMS: 1000000,
            useNewUrlParser: true
        });
        console.log('DB Online');

    } catch (error) {
        console.log(error);
        throw new Error('Error a la hora de inicializar BD');
    }
}

function dbAlive() {
    const dbState = mongoose.connection.readyState;
    //0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    switch (dbState) {
        case 0:
            var db = "Disconnected" 
            break;
        case 1:
            var db = "Connected";
            break;
        case 1:
            var db = "Connecting";
            break;
        case 1:
            var db = "Disconnecting";
            break;
    }

    return db;
}

async function externalAlive() {
    const apiStatus = await axios.get(`${config.externalApiPath}/ping`)
                                .then(res=> res.data);
    return (apiStatus.healthy)
}

async function localAlive() {
    const apiStatus = await axios.get(`${config.externalApiPath}/ping`)
                                .then(res=> res.data);
    return (apiStatus.healthy)
}

module.exports = { dbConn, dbAlive, externalAlive, localAlive }