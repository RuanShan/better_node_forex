// http://stackoverflow.com/questions/34204304/nodejs-as-sse-client-wih-eventsource
var request = require('request');
var http = require('http');
var url = require('url');
var util = require('util');
var moment = require('moment');
var ExchangeJsonCollection = require("./src/exchange_json_collection")
var ExchangeJsonDescription = require("./src/exchange_json_description")
//var _ = require('underscore');
var fs = require('fs')
var Log = require('log')
var logger = new Log('debug', fs.createWriteStream('development.log'));
global.logger = logger


var fields = ['price']
// 欧元/美金,欧元/日元,欧元/英镑,欧元/瑞郎,欧元/加元,欧元/澳元,美元/日元,美元/加元,美元/瑞郎
var g_forexs = ['EURUSD','EURJPY','EURGBP','EURCHF','EURCAD','EURAUD','USDJPY', 'USDCAD','USDCHF']
//US_OIL	美国原油  UK_OIL	英国原油 COPPER	铜  SOYBEAN	大豆 NATGAS	天然气
//XAGUSD	白银  GOLD	黄金  XPTUSD	铂金 XPDUSD	钯金
var g_products = ['US_OIL', 'UK_OIL', 'COPPER', 'SOYBEAN', 'NATGAS','XAGUSD','GOLD', 'XPTUSD', 'XPDUSD'];
//HIS	恒生指数  NAS100	纳斯达克指数 DAX30	德国股指 CHINA50	富时A50 DJ30	道琼斯指数 NK225	日经指数 FT100	英国富时指数 SP500	普尔指数
var g_indexes = ['HSI','NAS100','DAX30','CHINA50','DJ30','NK225','FT100','SP500'];
var g_symbols = [].concat( g_products );

//var dataUrl = "http://123.57.1.244:18016/?query=price&type=jsonret&symbol=HSI,USDJPY"
var dataUrl = "http://123.57.1.244:18016/?query=price&symbol="+g_symbols.join(',')
headers = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate, sdch',
  'Accept-Language': 'en-US,en;q=0.8',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Host': '123.57.1.244:18016',
  'Content-Type': 'text/html; charset=UTF-8',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.90 Safari/537.36'
}
var options = { 'headers': headers};

//sse.addEventListener('command.notification', function(e) {
//  var data = JSON.parse(e.data);
//  console.log('eventSource : ' + e.data + '/' + data.message);
//}, false);
var g_taskid = null;
var g_es = null;
var g_exchanges =  new ExchangeJsonCollection( g_symbols, fields );
;

function watchdog() {
    var now = new Date();
    if( now - g_exchanges.lastupdate > 3000) {//g_exchanges.push_count==10) { ////
        // => [Error: EISDIR: illegal operation on a directory, open <directory>]
      logger.info("update_state closed at %s.",  moment().format('X'));
      close_connection();
      logger.info("update_state starting at %s.",  moment().format('X'));
      startup_connection();
      logger.info("update_state started at %s.",  moment().format('X'));
    }
}

function close_connection()
{
  clearInterval(g_taskid);
}

var parsedUrl = url.parse(dataUrl, true);

function startup_connection()
{

  //var options = {host: parsedUrl.hostname, port: parsedUrl.port, path: parsedUrl.pathname, method: 'GET', 'headers': headers};
  //if (parsedUrl.search) options.path += "?" + parsedUrl.search;

  request({uri:dataUrl }, function(error, response, body) {
    //console.log(response.statusCode) // 200
    //console.log(body,dataUrl) // 200

    if (!error && response.statusCode == 200) {
      var items = body.split('#');
      var prices = [];
      for( var i =0;i<items.length; i++){
        //"a#b#".split("#") =>['a','b','']
        item = items[i].split('|');
        if(item.length == 3 ){
          prices.push( {symbol: item[0], price: item[1], timestamp: item[2]})
        }
      }

      console.log(util.inspect(prices));
      //console.log(body) // Show the HTML for the Google homepage.
      g_exchanges.pushMessage( prices, moment() )
    }else{
      util.log("ERROR:"+error);
    }
  });


}

g_taskid = setInterval(startup_connection, 1000);
