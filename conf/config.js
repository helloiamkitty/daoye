const config = require('./config.json');

const env = process.env.NODE_ENV === 'production' ?  'production' : 'development';
module.exports = config[env];
