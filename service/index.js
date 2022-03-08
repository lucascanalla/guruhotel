const jwt = require("jwt-simple");
const moment = require("moment");
const config = require("../config");

function createToken(user) {
  const payload = {
    sub: user._id,
    name: user.name,
    lastname: user.lastname,
    email: user.email,
    role: user.role,
    iat: moment().unix(),
    exp: moment()
      .add(3, "days")
      .unix()
  };

  return jwt.encode(payload, config.SECRET_TOKEN);
}

function decodeToken(bearer) {
  const token = bearer.split(" ")[1];
  const payload = jwt.decode(token, config.SECRET_TOKEN);

  if (payload.exp <= moment().unix()) {
    reject({
      status: 401,
      message: "El token ha expirado"
    });
  }
  return payload.sub;
}

function concatKeys(args, from){
  switch (from) {
    case 'getPrice':
      var key = String.prototype.concat(args.hotel_id,args.period,args.limit,args.room_id)
      break;
    case 'getMetrics':
      var key = String.prototype.concat(args.hotel_id,args.room_id,args.day,args.room_type)
      break;
    case 'getRooms':
      var key = String.prototype.concat(args.hotel_id,args.period,args.room_type,args.limit)
      break;
    
    default:
      break;
  }

  return key;
}



module.exports = {
  createToken,
  decodeToken,
  concatKeys
};