const { ApolloServer } =  require('apollo-server');

const Redis =  require('ioredis');
const resolvers = require('./resolvers');
const typeDefs = require('./schema');
const service = require('../service');

//DataSources
const PricesInLocalApiDataSources = require('../datasources/prices-in-local-api');
const RoomsInLocalApiDataSources = require('../datasources/rooms-in-local-api');

const { dbConn }  = require('../local_api/db/connection') ;
const redis = new Redis()
//Connection to MongoDB
dbConn();

const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: async ({ req }) => {
        let authToken = null;
        let user = null;
        
        try {
            authToken = req.headers.authorization;
            if (authToken !== "") {
                user = await service.decodeToken(authToken);
            }
        } catch (e) {
            //console.warn(`No se pudo autenticar el token: ${authToken}`);
        }
        return {
            authToken,
            user
        };
    },
    dataSources: () => ({
        pricesLocalApi: new PricesInLocalApiDataSources(redis),
        roomsLocalApi: new RoomsInLocalApiDataSources(redis)
    })

});

server.listen().then(({ url }) => {
    console.log(`🚀 Servidor corriendo en: ${url}`);
});



