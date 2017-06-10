const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  phone: {
    type: String
  },
  password: {
    type: String
  },
  unionid: {
    type: String
  },
  uuid: String,
  username: String,//上限5个汉字
  avatar: String,
  created: Date,
  last_login: Date,
  sex: Number,
  last_session: String
}, {
  collection: 'account'
});

module.exports = schema;
module.exports.model = function(name="account") {
  return mongoose.model(name, schema);
};