// http://stackoverflow.com/questions/34204304/nodejs-as-sse-client-wih-eventsource
var fs = require('fs')
var Log = require('log')
var logger = new Log('debug', fs.createWriteStream('development.log'));
global.logger = logger
//var _ = require('underscore');
var moment = require('moment');
var ExchangeCollection = require("./src/exchange_collection")
var ExchangeDescription = require("./src/exchange_description")
var EventSource = require('eventsource');

var fields = ['Price','LastSettle','Open','High','Low','Close']
// 长江实业,中电控股,香港中华煤气,九龙仓集团,汇丰控股,电能实业,凯富能源,电讯盈科,长和国际实业,恒隆集团
//  http://www.baring.cn/quo/bin/quotation.dll?fields=Price,LastSettle,&symbols=HKHK0001,HKHK0002,HKHK0003,HKHK0004,HKHK0005,HKHK0006,HKHK0007,HKHK0008,HKHK0009,HKHK0010
var symbols = [ 'HKHK0001','HKHK0002','HKHK0003','HKHK0004','HKHK0005','HKHK0006','HKHK0007','HKHK0008','HKHK0009','HKHK0010']

var url = "http://www.baring.cn/quo/bin/quotation.dll?fields=Price,LastSettle,Open,High,Low,Close,&symbols=HKHK0001,HKHK0002,HKHK0003,HKHK0004,HKHK0005,HKHK0006,HKHK0007,HKHK0008,HKHK0009,HKHK0010,"
headers = {
  'Accept': 'text/event-stream',
  'Accept-Encoding': 'gzip, deflate, sdch',
  'Accept-Language': 'en-US,en;q=0.8',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Host': 'www.baring.cn',
  'Referer': 'http://www.baring.cn/quo/index.html',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.90 Safari/537.36'
}
var options = { 'headers': headers};

//sse.addEventListener('command.notification', function(e) {
//  var data = JSON.parse(e.data);
//  console.log('eventSource : ' + e.data + '/' + data.message);
//}, false);
var g_taskid = null;
var g_es = null;
var g_exchanges = null;

function update_state() {
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
  g_es.close();
}

function startup_connection()
{
  g_es = new EventSource(url, options);
  g_exchanges = new ExchangeCollection( symbols, fields );


  g_es.onmessage = function (event) {
    console.log(event.data);
    var txt = /\[.*\]/.exec(event.data)[0];
    var data = eval(txt);
    //console.log("g_exchanges.push_count %s", g_exchanges.push_count );
    if( g_exchanges.push_count == 0){
      g_taskid = setInterval(update_state, 500);
    }
    g_exchanges.pushMessage( data, moment() )
  };

  g_es.onerror = function(err) {
    logger.error("eventsource error %s",  err );
  };

  g_es.onopen = function( event ){
    logger.info("eventsource opened.");
  }
  g_es.onclose = function( event ){
    logger.info("eventsource closed.");
  }
}
startup_connection();
