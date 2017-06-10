const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  uid: {
    type: String,
    index: true
  },
  content: String,
  contact: {
    type: String,
    index: true,
    default: ""
  },
  date: {
    type: Date,
    index: true
  }
}, {
  collection: 'advice'
});

module.exports = schema;
module.exports.model = function(name="advice") {
  return mongoose.model(name, schema);
};
