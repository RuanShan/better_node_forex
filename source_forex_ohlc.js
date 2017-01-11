// tidy data in redis, result: open, high, low, close
var _ = require('underscore');
var util = require('util');
var redis = require("redis");
var moment = require('moment');
var ExchangeOhlcCollection = require("./src/exchange_ohlc_collection")

// 美汇澳元,美元指数,美汇欧元,美汇英镑,美汇纽元,美汇加元,美汇瑞士,美汇港元,美汇日元,美元兑葡币	,美汇马币,美汇新元,美汇台币
var g_symbols = ['EURUSD','EURJPY','EURGBP','EURCHF','EURCAD','EURAUD','EURNZD', 'USDJPY', 'USDCAD','USDCHF']

var g_taskid = null;
var g_exchanges = null;

//绘制蜡烛图的方法
//http://www.cnblogs.com/zhongxinWang/p/4641032.html
var redisClient = redis.createClient();

function update_state() {
    var now = moment();
    if( now.second() == 5 )
    {
      for( var i=0; i< g_symbols.length; i++ )
      {
        var symbol = g_symbols[i];
        // get prices within last min
        var zkey = build_zkey( symbol, now);
        var startAt = moment( ).subtract( 1, 'minutes').seconds(1);
        var endAt = moment( ).startOf('minute');

        var args = [zkey, parseInt(startAt.format('x')), parseInt(endAt.format('x'))];

        //console.log("args  %s", util.inspect(args));
        redisClient.zrangebyscore(args, function(err, response) {
          if (err) throw err;
          //this.args: [ 'Z_USDCHF_1483804800000', 1483860660000, 1483860719999 ]
          var symbol = this.args[0].split('_')[1];//
          console.log("zrangebyscore %s", symbol );
          if( response.length >0)
          {
            var prices = _.map( response, function( item ){
              return parseFloat( item.split('_')[1] );
            })
            var data = [ { symbol: symbol, open: prices[0], high: _.max(prices), low: _.min(prices), close: prices[prices.length -1] } ]
            g_exchanges.pushMessage(data, endAt);
          }
        });
      }
      //console.log("yes in forex_history, symbol= %s, args=%s", symbol,args);
      console.log("update_state  at %s.",  moment().format('h:mm:ss'));
    }
}

function close_connection()
{
  clearInterval(g_taskid);
}

function startup_connection()
{
  g_exchanges = new ExchangeOhlcCollection( g_symbols);
  g_taskid = setInterval(update_state, 1000); // interval 1s
}


function build_zkey( symbol, now){
  var key = "Z_"+ symbol +"_"+  now.startOf('week').startOf('day').format('x');
  return key;
}
startup_connection();
