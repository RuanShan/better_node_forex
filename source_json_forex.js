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
// 美汇澳元,美元指数,美汇欧元,美汇英镑,美汇纽元,美汇加元,美汇瑞士,美汇港元,美汇日元,美元兑葡币	,美汇马币,美汇新元,美汇台币
var symbols = [ 'USDJPY']

//var dataUrl = "http://123.57.1.244:18016/?query=price&type=jsonret&symbol=HSI,USDJPY"
var dataUrl = "http://123.57.1.244:18016/?query=price&symbol=HSI,USDJPY"
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
var g_exchanges =  new ExchangeJsonCollection( symbols, fields );
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
    console.log(response.statusCode) // 200
    console.log(body) // 200

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
