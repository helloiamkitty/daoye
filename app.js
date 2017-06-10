const express = require('express');
const mongoose = require('mongoose');
const glob = require("glob");
const path = require('path');
const _ = require('lodash');
const http = require('http');
const logger = require('./lib/logger');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cookieParser = require('cookie-parser');

global.config = require('./conf/config');

const app = express();
const port = process.env.PORT || config.appPort;
var router = express.Router();

const globEach = (rule, cb = _.noop) => {
  glob.sync(rule).forEach((file) => {
    cb(require(path.resolve(file)));
  });
};

process.on('uncaughtException', (err) => {
  logger.error(`Caught exception: ${err}`);
});

// 包裹router处理函数，捕获所有错误
const wrap = (cr) => {
  return (req, res, next) => {
    if (cr.isAsync) {
      cr(req, res, next).catch(next);
    } else {
      async( cr )(req, res, next).catch(next);
    }
  };
};

// 包装一下router，直接返回router无法捕获异步错误
var _router = {};
['get', 'post', 'delete', 'put'].forEach((value, idx) => {
  _router[value] = (...args) => {
    var cb = wrap(_.last(args));
    var argv = args.slice(0, -1).concat(cb);
    router[value].apply(router, argv);
    return _router;
  };
});

const init = () => {
  // Use native promises
  mongoose.Promise = global.Promise;

  // startup
  globEach('startup/*.js');

  // Build router
  globEach('router/*.js', (module) => {
    module(_router);
  });

  // 线上环境也不禁用autoIndex，除非发现有明显性能问题
  mongoose.connect(config.mongo);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  const sessionStore = new MongoStore({
    mongooseConnection: mongoose.connection,
    touchAfter: 24 * 3600, //自动更新session
    ttl: 7 * 24 * 60 * 60 //过期时间
  })
  app.use(session({
    name: 'sid',
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: sessionStore
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(function(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    // 跨域头部
    const origin = req.headers['origin'];

    if (origin && /daoye\.cn$/.test(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Headers', 'Origin, No-Cache, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');

    next();
  });

  // Use router after other middleware
  app.use('/', router);

  const auth = require('./lib/auth');
  passport.use(new LocalStrategy(auth.authenticate));
  passport.serializeUser(auth.serializeUser);
  passport.deserializeUser(auth.deserializeUser);

  // Error catch
  app.use(function (err, req, res, next) {
    // @TODO: 应该独立封装成对象或函数
    if (err && err.name === 'MongoError') {
      if (err.code === 11000) {
        res.sendStatus(409);
      }
    } else {
      res.sendStatus(500);
      logger.error(`Server error: ${err}`);
    }
  });

  app.listen(port);

  logger.info('App launch success');
};

init();
