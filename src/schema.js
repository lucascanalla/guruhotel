const { gql } = require('apollo-server');

const typeDefs = gql `
	type Query {
		getUsers: [User],
		getHotelInsights(input: HotelInsightInput): [Room],
		getHotelMetrics(input: HotelMetricsInput): [RoomMetrics],
		ping: Ping,
		getRooms(input: HotelInsightInput): [RoomsToShow]
	},

	input HotelInsightInput {
		hotel_id: Int!,
		period: PeriodType!,
        room_type: RoomType!,
        limit: Int!
	},
	
	input HotelMetricsInput {
		hotel_id: Int,
		day: String,
        room_type: RoomType
	},

	type HotelInsightResponse {
		room: [Room]
	},
	
	type RoomsToShow {
		hotel_id: String,
		room_id: String,
		room_name: String,
		room_type: RoomType,
		prices: [Prices]
	},

	type Room {
		room_id: String,
		room_name: String,
		room_type: RoomType,
		prices: [Prices],
		last_updated_at: String
	},

	type Prices {
		competitor_name: String,
		currency: String,
		taxes: Int,
		amount: Int,
		date: String
	},


	type RoomMetrics {
		room_id: String,
		room_name: String,
		date: String,
		metrics: Metrics
	},

	type Metrics {
		best_price: PriceSum,
		average_price: PriceSum,
		worst_price: PriceSum,
	},

	type PriceSum {
		competitor_name: String,
		gross_amount: Int,
		net_amount: Int
	}

	type User {
		_id: ID,
		name: String!,
        lastname: String,
        email: String!,
        password: String!,
        role: String!
	},

    type Role {
		_id: ID,
		type: String!
	},

	type Ping {
		db: String,
		local_api: Boolean,
		external_api: Boolean
	},

	type Mutation {
		createUser(input: userInput): User,
		login (input: userLogin): String
	},

	input userInput {
		name: String,
        lastname: String,
        email: String!,
        password: String!,
        role: RoleType
	},

	input userLogin {
        email: String!,
        password: String!
	},

    enum RoleType {
        Manager
        User
    },

	enum PeriodType {
        treinta
        sesenta
		noventa
    },

	enum RoomType {
        residential
        business
    }

`;

module.exports = typeDefs;