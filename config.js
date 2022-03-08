module.exports = {
    dbPath: process.env.MONGODB || 'mongodb://localhost:27017/guruhotel',
    externalApiPath: process.env.EXTERNAL_API || `http://172.18.208.1:5000`,
    SECRET_TOKEN: process.env.SECRET_TOKEN || "mysecrettoken",
    localApiPath: process.env.LOCAL_API || `http://localhost:4000/`,
    localApiPort: process.env.LOCAL_API_PORT || `3978`,
  };