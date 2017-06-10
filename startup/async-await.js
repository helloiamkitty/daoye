const async = require('asyncawait/async');
const await = require('asyncawait/await');

// 改写全局async
global.async = function(func) {
  var result = async(func);
  result.isAsync = true;
  return result;
};

// 暴露全局的await
global.await = await;

