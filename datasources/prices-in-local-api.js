const { RESTDataSource } = require('apollo-datasource-rest');
const config = require('../config.js');
const axios = require('axios');
const moment = require('moment');
const Price = require('../local_api/models/Price');
const service = require('../service/index');

class PricesInLocalApiDataSources extends RESTDataSource {
    constructor(redis){
        // Always call super()
        super();
        // Sets the base URL for the REST API
        this.baseURL = config.localApiPath
        this.redis = redis;
    }

    async getPricesFromAPI(args){
        //GET data from API 

        const priceFromAPI  = await axios
                            .get(`${config.externalApiPath}/hotels/${args.hotel_id}/prices?start_date=01%2F04%2F2022&end_date=01%2F04%2F2022`)
                            .then(res=> {return res.data})


        const priceArray = [];
        //PARSE data from API
        for (var [room_Id, value] of Object.entries(priceFromAPI.prices)) {
            const room_id = room_Id
            for (var [key, value2] of Object.entries(value[0])) {
                for (var [key2, value3] of Object.entries(value2)) {
                    if (key2 === 'date') {
                        var dateFormat = value3
                    }else{
                        var competitor_name = key2;
                        var currency = value3.currency
                        var taxes = value3.tax
                        var amount = value3.price
                    }
                    const priceJson = { room_id: room_id,
                                        date: moment(dateFormat, "DD/MM/YYYY"),
                                        competitor_name: competitor_name,
                                        amount: amount,
                                        currency: currency,
                                        taxes: taxes,
                                        last_updated_at: moment().format("DD/MM/YYYY")
                                    }
                    //console.log(priceJson)
                    priceArray.push(priceJson);
                }
            }
        }
        
        //INSERT DATA IN DB
        await Price.insertMany(priceArray)
        .then(()=>{console.log("inserted")})
        .catch((error)=>{console.log(error)});

    }

    async getPrices(args){

        var redisKey = service.concatKeys(args, 'getPrice');
        console.log(redisKey);
        var priceFromCache = await this.redis.get(`prices:${redisKey}`)
        
        if (priceFromCache===null) {
            //TRY GET data in DB
            var pricesFromDB = await Price.find({room_id: args.room_id})
            //console.log(pricesFromDB);

            if (Object.keys(pricesFromDB).length === 0) {

                if (args.period == 'noventa') {
                    //si es mas de 30, iterar. si es 60, 2 veces. 90, 3 veces
                    //console.log("sdasda")
                }

                await this.getPricesFromAPI(args)
                //SEARCH AGAIN IN DB WITH FILTERS
                var pricesFromDB = await Price.find({room_id: args.room_id})

            }

            //SET QUERY IN REDIS CACHE
            var redisKey = service.concatKeys(args, 'getPrice');
            console.log(redisKey);
            await this.redis.set(`prices:${redisKey}`,JSON.stringify(pricesFromDB), (err, reply) => {
                if(err){console.log(err)}else{console.log(reply)}
            })   
            
            return pricesFromDB
        }else{
            //RETURN DATA FROM CACHE
            //return false
            return JSON.parse(priceFromCache)
        }

    }

    async getMetrics(args){

        const filter = {
                            room_id: args.room_id,
                            date: new Date(args.day)
                        }
        //GET Key for redis
        var redisKey = service.concatKeys(args, 'getMetrics');
        var metricsFromCache = await this.redis.get(`metrics:${redisKey}`)
        
        if (metricsFromCache===null) {
            //TRY GET data in DB
            var metricsFromDB = await Price.find(filter)

            if (metricsFromDB === null) {
                
                await this.getPricesFromAPI(args)
                //SEARCH AGAIN IN DB WITH FILTERS
                var metricsFromDB = await Price.find(filter)
            }
            console.log(metricsFromDB[0])
            var bestp_c =  metricsFromDB[0].competitor_name
            var bestp_g =  metricsFromDB[0].amount + (metricsFromDB[0].tax)
            var bestp_n =  metricsFromDB[0].amount
            var worstp_c = metricsFromDB[0].competitor_name
            var worstp_g = metricsFromDB[0].amount + (metricsFromDB[0].tax)
            var worstp_n = metricsFromDB[0].amount
            var avg_c = metricsFromDB[0].competitor_name
            var avg_g = (metricsFromDB[0].amount) + (metricsFromDB[0].tax)
            var avg_n = (metricsFromDB[0].amount)                           
            var count = 0;
            var sum = 0;
            for (let index = 1; index < metricsFromDB.length; index++) {
                var j = metricsFromDB[index];
                if((((j.amount) + (j.tax)) > worstp_g) || worstp_g===null ) {
                    var worstp_c = j.competitor_name
                    var worstp_g = (j.amount) + (j.tax)
                    var worstp_n = j.amount                        
                }
                if (((j.amount) + (j.tax)) < bestp_c || bestp_c===null) {
                    var bestp_c =  j.competitor_name
                    var bestp_g =  (j.amount) + (j.tax)
                    var bestp_n =  j.amount                    
                }
                count = count + 1
                sum = sum + (j.amount)
            }
            
            //SET AVG and diff between first position on array and AVG
            const avg = sum/count;
            //Get always positive number
            if (Math.sign(avg - avg_n) === -1) {
                var diff = avg_n - avg
            }else{
                var diff = avg - avg_n;
            }

            for (let index = 0; index < metricsFromDB.length; index++) {
                const k = metricsFromDB[index];
                if (k.amount === avg) {
                    var avg_c = k.competitor_name
                    var avg_g = (k.amount) + (k.tax)
                    var avg_n = k.amount
                                            
                }else{
                    if (Math.sign(avg - (k.amount)) === -1) {
                        if((k.amount - avg) < diff ){
                            var avg_c = k.competitor_name
                            var avg_g = (k.amount) + (k.tax)
                            var avg_n = k.amount
                        }
                    }else{
                        if((avg - (k.amount)) < diff ){
                            var avg_c = k.competitor_name
                            var avg_g = (k.amount) + (k.tax)
                            var avg_n = k.amount
                        }
                    }
                }
                
            }

            const best_price = {
                                competitor_name: bestp_c,
                                gross_amount: bestp_g,
                                net_amount: bestp_n
                                }
            const average_price = {
                                    competitor_name: avg_c,
                                    gross_amount: avg_g,
                                    net_amount: avg_n
                                }
            const worst_price = {
                                    competitor_name: worstp_c,
                                    gross_amount: worstp_g,
                                    net_amount: worstp_n
                                }
            
            const metricParse = {
                                    best_price,
                                    worst_price,
                                    average_price
                                }
            
                                    
            
            //SET QUERY IN REDIS CACHE
            var redisKey = service.concatKeys(args, 'getMetrics');
            await this.redis.set(`metrics:${redisKey}`, JSON.stringify(metricParse), (err, reply) => {
                if(err){console.log(err)}else{console.log(reply)}
            })

            return metricParse
            
        }else{
            return JSON.parse(metricsFromCache)
        }

    }

}

module.exports = PricesInLocalApiDataSources