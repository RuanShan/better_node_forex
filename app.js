// http://stackoverflow.com/questions/34204304/nodejs-as-sse-client-wih-eventsource
var _ = require('underscore');
var fs = require('fs');
var ExchangeCollection = require("./src/exchange_collection")
var ExchangeDescription = require("./src/exchange_description")
var EventSource = require('eventsource');

var fields = ['Price','LastSettle','Open','High','Low','Close']
var symbols = [ 'USAUDUSD','USDINIW','USEURUSD','USGBPUSD','USNZDUSD','USUSDCAD','USUSDCHF','USUSDCNY','USUSDHKD','USUSDJPY','USUSDMOP','USUSDMYR','USUSDSGD','USUSDTWD']

var url = "http://www.baring.cn/quo/bin/quotation.dll?fields=Price,LastSettle,Open,High,Low,Close,&symbols=USAUDUSD,USDINIW,USEURUSD,USGBPUSD,USNZDUSD,USUSDCAD,USUSDCHF,USUSDCNY,USUSDHKD,USUSDJPY,USUSDMOP,USUSDMYR,USUSDSGD,USUSDTWD,"
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
    if(now - g_exchanges.lastupdate > 3000) {//g_exchanges.push_count==10) { ////
      fs.open('dev.log', 'a+', function(err, fd) {
        // => [Error: EISDIR: illegal operation on a directory, open <directory>]
      console.log(" ------------close connection-----------");
      fs.writeSync(fd, "closed at "+ Date.now().toString() +"\n");
        close_connection();
      fs.writeSync(fd, "starting at "+ Date.now().toString()+"\n");
        console.log(" ------------startting connection-----------");
        startup_connection();
      fs.writeSync(fd, "started at "+ Date.now().toString()+"\n");
        console.log(" ------------started-----------");
      })
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
    if( g_exchanges.push_count == 0){
      g_taskid = setInterval(update_state, 500);
    }
    g_exchanges.pushMessage( data, new Date() )
  };

  g_es.onerror = function(err) {
    console.log('ERROR! ' + JSON.stringify(err));
  };
}
startup_connection();
