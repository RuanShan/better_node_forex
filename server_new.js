var moment = require('moment');// datetime
var util = require('util');
var redis   = require('redis');
var publisherClient = redis.createClient();
var express = require('express');
var path = require('path');
var fs = require('fs')
//var favicon = require('serve-favicon');
var logger = require('morgan');
//var cookieParser = require('cookie-parser');
//var bodyParser = require('body-parser');

//var index = require('./routes/index');
//var users = require('./routes/users');

// create a write stream (in append mode)
//var accessLogStream = fs.createWriteStream(__dirname + '/development.log', {flags: 'a'})


var app = express();

// view engine setup
app.set('views',   path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('view options',{ layout: 'layout' });
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(logger('combined'))
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var defualt_symbols = "USDJPY";
//app.use('/', index);
//app.use('/users', users);
app.get('/', function(req, res){

  res.render('index', { title: 'express', symbols: defualt_symbols.split(',')} );
});

app.get('/forex/:symbols', function(req, res){
  var symbols =  req.params.symbols || defualt_symbols;
  symbols = symbols.split(',');
  res.render('index', { title: 'express', symbols: symbols} );
});

app.get('/forex_history/:symbol',function(req, res){

  var candlesticks = req.query.candlesticks;
  var symbol =  req.params.symbol 
  var key = ["Z", symbol, moment().startOf('week').startOf('day').format('x')].join("_");
  if( candlesticks=='1')
  {
    key = ["Z", symbol, "ohlc", moment().startOf('week').startOf('day').format('x')].join("_");
  }

  var args = [key, parseInt(moment().subtract(60,'minutes').format('x')), parseInt(moment().format('x'))];
  console.log("forex_history, candlesticks=%s, symbol= %s, args=%s", util.inspect(candlesticks), symbol,args);

  publisherClient.zrangebyscore(args, function(err, response) {
    if (err) throw err;
    //console.log("forex_history, %s", response);
    data = {}
    data[symbol] = response
    res.header({'Access-Control-Allow-Origin': '*'}).json(data);
    return
  });

});

app.get('/sse/:symbols', function(req, res) {
  var availableSymbols = ["USEURUSD"]
  var symbols =  req.params.symbols || "USEURUSD,USGBPUSD";
  symbols = symbols.split(',');
  // let request last as long as possible
  // req.socket.setTimeout(Infinity);
  req.socket.setNoDelay(true);

  var messageCount = 0;
  var initialSymbolCount = 0;
  var subscriber = redis.createClient();
  var initialData =  {};

  for( var i=0; i< symbols.length; i++)
  {
    var symbol = symbols[i];
    subscriber.subscribe(symbol);
  }
  // In case we encounter an error...print it out to the console
  subscriber.on("error", function(err) {
    console.log("Redis Error: " + err);
  });

  var currentData = {}
  var symbolCount = 0;
  // When we receive a message from the redis connection
  subscriber.on("message", function(channel, message) {
    currentData[channel]= message;
    symbolCount++;
    if(symbolCount == symbols.length )
    {
      messageCount++; // Increment our message count
      currentData['messageCount'] =  messageCount;
      res.write('id: ' + messageCount + '\n');
      res.write('data: ' + JSON.stringify( currentData ) + '\n');
      res.write('\n\n'); // Note the extra newline
      currentData = {};
      symbolCount = 0;
    }
  });

  //send headers for event-stream connection
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // The 'close' event is fired when a user closes their browser window.
  // In that situation we want to make sure our redis channel subscription
  // is properly shut down to prevent memory leaks...and incorrect subscriber
  // counts to the channel.
  req.on("close", function() {
    subscriber.unsubscribe();
    subscriber.quit();
  });
});

app.get('/sse_one/:symbol', function(req, res) {

   res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*"
  });

  var padding = new Array(2049);
  res.write(":" + padding.join(" ") + "\n"); // 2kB padding for IE
  res.write("retry: 2000\n");

  var lastEventId = Number(req.headers["last-event-id"]) || Number(req.params.lastEventId) || 0;

  var timeoutId = 0;
  var messageCount = lastEventId;

  // let request last as long as possible
  // req.socket.setTimeout(Infinity);
  req.socket.setNoDelay(true);
  var symbol =  req.params.symbol || "USEURUSD"
  var key = ["Z", symbol, moment().startOf('week').startOf('day').format('x')].join("_");
  var args = [key, parseInt(moment().subtract(60,'minutes').format('x')), parseInt(moment().format('x'))];

  var subscriber = redis.createClient();
  subscriber.subscribe(symbol);
  // In case we encounter an error...print it out to the console
  subscriber.on("error", function(err) {
    console.log("Redis Error: " + err);
  });

  // When we receive a message from the redis connection
  subscriber.on("message", function(channel, message) {
    messageCount++; // Increment our message count
    var data = {messageCount: messageCount};
    data[channel]= message;
    res.write('id: ' + messageCount + '\n');
    res.write('data: ' + JSON.stringify( data ) + '\n');
    res.write('\n\n'); // Note the extra newline
  });

  req.on("close", function() {
    subscriber.unsubscribe();
    subscriber.quit();
  });
});

app.get('/sse_ones/:symbols', function(req, res) {

  var symbols =  req.params.symbols || "USEURUSD,USGBPUSD";
  symbols = symbols.split(',');
  // let request last as long as possible
  // req.socket.setTimeout(Infinity);
  req.socket.setNoDelay(true);

  var messageCount = 0;
  var initialSymbolCount = 0;
  var subscriber = redis.createClient();
  var initialData =  {};

  //console.log("sse_ones before subscribe");

  for( var i=0; i< symbols.length; i++)
  {
    var symbol = symbols[i];
    subscriber.subscribe(symbol);
  }
  //console.log("sse_ones after subscribe");
  // In case we encounter an error...print it out to the console
  subscriber.on("error", function(err) {
    console.log("Redis Error: " + err);
  });

  var currentData = {}
  var symbolCount = 0;
  // When we receive a message from the redis connection
  subscriber.on("message", function(channel, message) {
    currentData[channel]= message;
    symbolCount++;
    if(symbolCount == symbols.length )
    {
      messageCount++; // Increment our message count
      currentData['messageCount'] =  messageCount;
      res.write('id: ' + messageCount + '\n');
      res.write('data: ' + JSON.stringify( currentData ) + '\n');
      res.write('\n\n'); // Note the extra newline
      currentData = {};
      symbolCount = 0;
    }
  });

  //send headers for event-stream connection
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // The 'close' event is fired when a user closes their browser window.
  // In that situation we want to make sure our redis channel subscription
  // is properly shut down to prevent memory leaks...and incorrect subscriber
  // counts to the channel.
  req.on("close", function() {
    subscriber.unsubscribe();
    subscriber.quit();
  });
});


app.get('/fire-event/:event_name', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('All clients have received "' + req.params.event_name + '"');
  res.end();
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(8080);

module.exports = app;
