const crypto = require('crypto');
const mongoose = require('mongoose');
const Adminaccount = require('../schema/adminaccount').model();

var scmp = require('scmp');

var auth = exports = module.exports = {};

const sha256 = (string) => {
  const secret = 'taxas&poker.top&the-best-app-of-taxas';
	const hash = crypto.createHmac('sha256', secret).update(string).digest('hex');
  return hash;
};

const findByUsername = (username) => {
  return Adminaccount.findOne({username: username}).exec();
};

auth.authenticate = async (function(username, password, done) {
  findByUsername(username).then((user) => {
    if (!user) {
      return done(null, false);
    }

    if (!scmp(user.password, sha256(password))) {
      return done(null, false);
    }

    return done(null, user);
  })
  .catch((err) => {
    done(err);
  });
});

auth.sha256 = sha256;

auth.serializeUser = function(user, done) {
  done(null, user.username);
};

auth.deserializeUser = function(username, done) {
  findByUsername(username).then(function (user) {
    done(null, user);
  }).catch(function (err) {
    done(err);
  });
};

auth.register = function(user) {
  user.password = sha256(user.password);
  var ac = new Adminaccount(user);
  return ac.save();
};
