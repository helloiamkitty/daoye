$(function() {
    
    function getRecord (room_id) {
        $.ajax({type: 'GET', url: common.baseUrl + '/room-record', data: {room_id: room_id}, xhrFields: {withCredentials: true}}).done(function (res) {
          renderRecord(res);
        }).fail(function (xhr, errorType, error) {
          $.jPops.alert({
            content: xhr.responseText
          });
        });
    }

    function renderRecord (data) {

      var tsTime = new Date(data.create_time);
      var tsYear = tsTime.getFullYear();
      var tsMonth = common.fillZero(tsTime.getMonth() + 1);
      var tsDate = common.fillZero(tsTime.getDate());
      var tsHour = common.fillZero(tsTime.getHours());
      var tsMin = common.fillZero(tsTime.getMinutes());

      data.create_time_text = tsMonth + '.' + tsDate + ' ' + tsHour + ':' + tsMin;
      data.little_limit = parseInt(data.limit / 2);

      $.each(data.rank, function (key, account) {
        if(account.uid == data.uid) {
          account.pin = true;
        } else {
          account.pin = false;
        }
        account.profit_text = +account.profit > 0 ? '+' + common.digitalFormat(account.profit) : common.digitalFormat(account.profit);
        account.profit_class = account.profit > 0 ? 'plus' : account.profit < 0 ? 'minus' : 'zero';
        account.insuranceClass = account.username == '保险池' ? 'insurance-avatar' : '';
        account.coin = account.username == '保险池' ? '' : '买入：' + account.coin;
        account.hasNoInsurance = account.username == '保险池' ? false : true;
      });
  
      var html = Template.record.record(data);
      $('.container').html(html);

      //头像赋值
      $('.js-avatar').each(function (key, val) {
          var $node = $(this);
          var src = $node.data('src');

          //默认头像
          $node.css({
              'background': 'url(/image/default-avatar.png)',
              'background-size': 'auto 100%',
              'background-position': 'center',
              'background-repeat': 'no-repeat'
          });
          var $img = $('<img>');
          $img.on('load', function (ev) {
              $node.css({
                  'background': 'url(' + src + ')',
                  'background-size': 'auto 100%',
                  'background-position': 'center',
                  'background-repeat': 'no-repeat'
              });
          });
          
          $img.attr('src', src);
      });

      $('.line').last().remove;
    }

    function init () {
      var sid = $.fn.cookie('connect.sid');
      if(sid) {
        $.fn.cookie('connect.sid', sid, {'domain': '.poker.top'});
      }

      var room_id = common.getQueryString('id');
      getRecord(room_id);
    }
        
    init();
})