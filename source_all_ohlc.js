// tidy data in redis, result: open, high, low, close
var _ = require('underscore');
var util = require('util');
var redis = require("redis");
var moment = require('moment');
var ExchangeOhlcCollection = require("./src/exchange_ohlc_collection")

// 欧元/美金,欧元/日元,欧元/英镑,欧元/瑞郎,欧元/加元,欧元/澳元,美元/日元,美元/加元,美元/瑞郎
var g_forexs = ['EURUSD','EURJPY','EURGBP','EURCHF','EURCAD','EURAUD','USDJPY', 'USDCAD','USDCHF']
//US_OIL	美国原油  UK_OIL	英国原油 COPPER	铜  SOYBEAN	大豆 NATGAS	天然气
//XAGUSD	白银 XAUUSD	黄金  XPTUSD	铂金 XPDUSD	钯金
var g_products = ['US_OIL', 'UK_OIL', 'COPPER', 'SOYBEAN', 'NATGAS','XAGUSD','XAUUSD'];
//HIS	恒生指数  NAS100	纳斯达克指数 DAX30	德国股指 CHINA50	富时A50 DJ30	道琼斯指数 NK225	日经指数 FT100	英国富时指数 SP500	普尔指数
var g_indexes = ['HIS','NAS100','DAX30','CHINA50','DJ30','NK225','FT100','SP500'];
var g_symbols = [].concat( g_forexs, g_products, g_indexes );
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
