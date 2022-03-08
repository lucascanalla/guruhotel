const { RESTDataSource } = require('apollo-datasource-rest');
const config = require('../config.js')
const axios = require('axios')
const Room = require('../local_api/models/Room');
const service = require('../service/index');

//const RoomController = require('../local_api/controllers/room');

class RoomsInLocalApiDataSources extends RESTDataSource {
    constructor(redis){
        // Always call super()
        super();
        // Sets the base URL for the REST API and CACHE
        this.baseURL = config.localApiPath
        this.redis = redis
    }

    async getRoomsFromAPI(args){
        //GET data from API
        const roomsFromAPI  = await axios.get(`${config.externalApiPath}/hotels/${args.input.hotel_id}/rooms`)
                                        .then(res=> {return res.data})
        
        //PARSE DATA AND SAVE in DB
        for (let index = 0; index < Object.keys(roomsFromAPI).length; index++) {
            roomsFromAPI[index] = {...roomsFromAPI[index], hotel_id: parseInt(args.input.hotel_id)}
        }
        await Room.insertMany(roomsFromAPI)
            .then(()=>{console.log("inserted")})
            .catch((error)=>{console.log(error)});
        //END SAVE
    }

    async getRooms(args){
        var redisKey = service.concatKeys(args.input, 'getRooms');
        var roomsFromCache = await this.redis.get(`rooms:${redisKey}`)

        if (roomsFromCache===null) {
            //TRY WITH DB
            var roomsFromDB = await Room.find({hotel_id: parseInt(args.input.hotel_id),
                                                room_type: args.input.room_type }).limit(args.input.limit)
           
            if (Object.keys(roomsFromDB).length === 0) {
                await this.getRoomsFromAPI(args);
                //SEARCH AGAIN IN DB WITH FILTERS
                var roomsFromDB = await Room.find({hotel_id: parseInt(args.input.hotel_id),
                                                    room_type: args.input.room_type }).limit(args.input.limit)
                
            }
            
            //SET QUERY IN REDIS CACHE
            var redisKey = service.concatKeys(args.input, 'getRooms');
            await this.redis.set(`rooms:${redisKey}`, JSON.stringify(roomsFromDB), (err, reply) => {
                if(err){console.log(err)}else{console.log(reply)}
            })   
                
            //RETURN Data
            return roomsFromDB
        }else{
            //RETURN DATA FROM CACHE
            return JSON.parse(roomsFromCache)
        }

    }

}

module.exports = RoomsInLocalApiDataSources