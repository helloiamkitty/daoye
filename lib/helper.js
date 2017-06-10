

const helper = {
  /*按汉字计算长度
   * 
   */
  charLength: function (str) {
    str += '';
    let count = 0;

    for (let i = 0, len = str.length; i < len; i++) {
      if (str.charCodeAt(i) > 255) {
        count += 2;
      } else {
        count++;
      }
    }

    return count;
  },
  /*生成随机数字串
   * len: 长度
   */
  getRandomCode: (len) => {
    const arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result = '';

    for(var i = 0; i < len; i++) {
      const idx = Math.floor(Math.random() * 10);
      result += arr[idx];
    }

    return result;
  }
};

module.exports = helper;