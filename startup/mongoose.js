const mongoose = require("mongoose");
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const limitMax = 100;
const limitDefault = 20;

function parseDate(date, cond) {
  // 开区间
  if (date.charAt(0) === '_') {
    cond = cond.slice(0, -1);
    date = date.slice(1);
  }

  date = new Date(date * 1000);

  return { date, cond };
}

// 公共参数处理
mongoose.Query.prototype.xPatch = function(req) {
  var query = req.query || {};
  query.limit = Math.abs(query.limit) || limitDefault;

  if (!req.infinity) {
    this.limit(Math.min(query.limit, limitMax));
  }

  query.skip && this.skip(+query.skip);

  this.xDate(query);

  if (query.sort) {
    let [name, value=1] = query.sort.split(':');
    let obj = {};

    obj[name] = +value;
    this.sort(obj);
  }

  return this;
};

mongoose.Query.prototype.xDate = function(query = {}) {
  if (query.date) {
    let [start, end] = query.date.split('-');

    if (start) {
      let {date, cond} = parseDate(start, 'gte');
      this.where('date')[cond](date);
    }

    if (end) {
      let {date, cond} = parseDate(end, 'lte');
      this.where('date')[cond](date);
    }
  }

  return this;
};

mongoose.Schema.prototype.xTransform = function(func) {
  if (!this.options.toJSON) {
    this.options.toJSON = {};
  }

  if (!this.options.toObject) {
    this.options.toObject = {};
  }

  this.options.toJSON.transform
    = this.options.toObject.transform
    = func;

    return this;
};

const enableValidators = (schema, options) => {
  schema.pre('findOneAndUpdate', function(next) {
    this.options.runValidators = true;
    next();
  });
};

mongoose.plugin(enableValidators);

