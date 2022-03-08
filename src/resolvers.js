const bcrypt = require('bcryptjs');

const service = require('../service');
const { dbAlive, externalAlive, localAlive }  = require('../local_api/db/connection') ;

const User = require('../local_api/models/User'); 
const Role = require('../local_api/models/Role');

const resolvers = {
	Query: {

		async getUsers( _ , __ , context) {
			if (!context.user) return null
			return await User.find()
		},

		async getHotelMetrics( _ , args, context){
			if (!context.user) return null
			let { roomsLocalApi } = context.dataSources

			return await roomsLocalApi.getRooms(args);
		},
		
		async ping(){
			const db = dbAlive();
			const local_api = await localAlive();
			const external_api = await externalAlive();
			return ({
				db: db,
				local_api: local_api,
				external_api: external_api
			});
		},

		getRooms: async ( _ , args, context) =>{
			if (!context.user) return null
			let { roomsLocalApi } = context.dataSources
			return await roomsLocalApi.getRooms(args);
		}
	},

	RoomsToShow: {
		prices: async (parent, __ ,context, info) => {
			const values = {	
							hotel_id: parent.hotel_id,
							period: info.variableValues.input.period,
							limit: info.variableValues.input.limit,
							room_id: parent.room_id
						}
			return await context.dataSources.pricesLocalApi.getPrices(values)
		}
	},

	RoomMetrics: {
		metrics: async (parent, __ ,context, info ) => {
			const values = {	
				hotel_id: parent.hotel_id,
				room_id: parent.room_id,
				day: info.variableValues.input.day,
				room_type: info.variableValues.input.room_type
			}
			return await context.dataSources.pricesLocalApi.getMetrics(values)

		}
	},

	Mutation: {

		async createUser( _ , { input }) {
            
            const roleData = await Role.findOne({ type: input.role });
            input.role = roleData._id

			const newUser = new User(input)
			return await newUser.save()
		},

		 // Handle user login
		async login( _ , { input }) {
			const user = await User.findOne({ email: input.email });
			if (!user) {
			  throw new Error("No user with that email");
			}
			const valid = await bcrypt.compareSync(input.password, user.password);
			if (!valid) {
			  throw new Error("Incorrect password");
			}

			//Only Manager type of user can get the token for advanced querys
			const userType = await Role.findOne({ _id: user.role });

			if (userType.type = "Manager"){
				return service.createToken(user);
			}else{
				return null
			}
		}

	}
};

module.exports = resolvers;
