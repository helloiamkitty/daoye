var common = {
	baseUrl: 'https://api.poker.top',
	// baseUrl: 'https://api.dev.poker.top',
	payUrl: 'https://pay.poker.top',
	// payUrl: 'https://pay.dev.poker.top',
	downloadUrl: isIphone ? 'https://itunes.apple.com/us/app/de-zhou-yue-ju/id1206728189?mt=8' : 'http://cdn.poker.top/o_1bhj9ss6l8nb5evu5gld7tf99.apk',
  getQueryString: function (name) {  
      var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");  
      var r = window.location.search.substr(1).match(reg);  
      if (r != null) return unescape(r[2]);  
      return null;  
  },
  fillZero: function (t) {
  	if(t < 10) {
        t = '0' + t
    }
    return t;
  },
  digitalFormat: function (num) {
  	var abs = Math.abs(num);
  	if(abs <= 10000) return num;

  	var result = (abs / 10000).toFixed(2);
  	if(/00$/.test(result)) {
  		result = result.substr(0, result.length - 3);
  	} else if(/0$/.test(result)) {
  		result = result.substr(0, result.length - 1);
  	}

  	return (num < 0 ? '-' : '') + result + '万';
  },
  socialTime: function (date, now) {
  	var ts = new Date(date).getTime();
 
		now = now || $.now();
		var nowDate = new Date(now).getDate();

		var minute = 1000 * 60;
		var hour = minute * 60;
		var day = hour * 24;
		var week = day * 7;
		var month = day * 30;

		// 已流逝的时间
		var escape = now - ts;

		//时间戳表示的标准时间
		var tsTime = new Date(ts);
		var tsYear = tsTime.getFullYear();
		var tsMonth = common.fillZero(tsTime.getMonth() + 1);
		var tsDate = common.fillZero(tsTime.getDate());
		var tsHour = common.fillZero(tsTime.getHours());
		var tsMin = common.fillZero(tsTime.getMinutes());

		if(escape < 0){
			return '刚刚';
		}
		if(escape >= month) {
			return tsYear + '-' + tsMonth + '-' + tsDate;
		}
		else if(escape >= day){
			return parseInt(escape / day) + '天前';
		}
		else if(escape >= hour){
			return (nowDate === tsDate ? '今天' : tsMonth + '-' + tsDate) + ' ' + tsHour + ':' + tsMin;
		}
		else if(escape >= minute){
			return parseInt(escape / minute) + '分钟前';
		} else {
			return '刚刚';
		}
	},
	/* 实际高度值/实际宽度 = 设计稿高度值 / 设计稿宽度
	 *
	*/
	getHeightVal: function (designVal, designWidth, realWidth) {
		return realWidth * designVal / designWidth;
	},
	autoFontSize: function($o) {
    var iCW = $o.width(),//文字长度
    		$pre = $o.parent().prev(),//头像宽度
        $p = $o.parent().parent(),
        iPW = $p.width(),//容器宽度
        iCWM = iPW - $pre.width();//显示宽度
    
    if (iCW > iCWM) $o.css('fontSize', ((iCWM - 9) * parseInt($o.parent().css('font-size'))) / iCW );    //h4宽度 / ( em宽度 / h4默认字体大小)
	},
	//webView交互
	webViewBridge: function (opt) {
		if(isAndroid) {
			var webViewObj = opt.webViewObj,
				webviewFunName = opt.webviewFunName,
				data = JSON.stringify(opt.data),
				callback = opt.callback;
			if(opt.receive) {
				window[webviewFunName] = opt.handler;
			} else {
				var res = null;
				if(data == '{}') {
					res = window[webViewObj][webviewFunName]();
				} else {
					res = window[webViewObj][webviewFunName](data);
				}
				if(callback) {
					callback(res);
				}
			}
		} else if(isIphone) {
			function setupWebViewJavascriptBridge(callback) {
		    if (window.WebViewJavascriptBridge) { return callback(WebViewJavascriptBridge); }
		    if (window.WVJBCallbacks) { return window.WVJBCallbacks.push(callback); }
		    window.WVJBCallbacks = [callback];
		    var WVJBIframe = document.createElement('iframe');
		    WVJBIframe.style.display = 'none';
		    WVJBIframe.src = 'https://__bridge_loaded__';
		    document.documentElement.appendChild(WVJBIframe);
		    setTimeout(function() { document.documentElement.removeChild(WVJBIframe) }, 0)
			}

			setupWebViewJavascriptBridge(function(bridge) {

				var webviewFunName = opt.webviewFunName,
					data = opt.data,
					callback = opt.callback,
					handler = opt.handler;
				
				if(opt.receive) {
					bridge.registerHandler(webviewFunName, handler)
				} else {
					bridge.callHandler(webviewFunName, data, function responseCallback (responseData) {
						if(callback) {
							callback(responseData);
						}
					})
				}
			})
		} else {
			return;
		}
	}
};

var M = {};

+function (M) {

	var controller = {};

	var handles = ['click', 'mouseover', 'tap', 'mouseout', 'mouseenter', 'mouseleave', 'change', 'focus', 'blur'];

	$.each(handles, function(key, val) {
		var ev = val;
		if(isIphone) {
			if(val === 'click') {
				ev = 'click touchend';
			}
		}
		$(document).on(ev, '[data-' + val +']', function (ev) {
			var method = $(this).data(val);

			controller[method] && controller[method].apply(this, arguments);
		});
	});

	M.controller = {
		add: function (name, func) {
			if ($.type(name) === 'object') {
				$.each(name, function (key, val) {
					controller[key] = val;
				});
			} else {
				controller[name] = func;
			}

			return this;
		},

		remove: function (name) {
			if ($.type(name) === 'array') {
				$.each(name, function (key, val) {
					delete controller[key];
				});
			} else {
				delete controller[name];
			}

			return this;
		},

		list: function () {
			var array = [];

			$.each(controller, function (name, val) {
				array.push(name);
			});

			return array;
		},

		has: function (name) {
			return !!controller[name];
		}
	};
}(M);

M.controller.add({
	closeDownload: function (ev) {
    	ev.preventDefault();

    	$('.download-wrap').hide();
	},
	downloadClick: function (ev) {
    	ev.preventDefault();

        location.href = '/';
	}
});


