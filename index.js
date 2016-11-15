var moment = require('moment');// datetime
var redis   = require('redis');
var publisherClient = redis.createClient();
var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
//var cookieParser = require('cookie-parser');
//var bodyParser = require('body-parser');

//var index = require('./routes/index');
//var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views',   path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('view options',{ layout: 'layout' });
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', index);
//app.use('/users', users);
app.get('/', function(req, res){
  res.render('index', { title: 'express'} );
});

app.get('/sse/:symbol', function(req, res) {
  var availableSymbols = ["USUSDSGD"]
  console.log( "came in " );
  // let request last as long as possible
  // req.socket.setTimeout(Infinity);
  req.socket.setNoDelay(true);
  var symbol = "USUSDSGD"
  var messageCount = 0;
  var subscriber = redis.createClient();

  var key = ["Z", symbol, moment().startOf('week').startOf('day').format('x')].join("_");

  var args = [key, parseInt(moment().startOf('day').format('x')), parseInt(moment().format('x'))];

  publisherClient.zrangebyscore(args, function(err, response) {
     if (err) throw err;
     messageCount++;
     var data =  {};
     data[symbol] = response;
     //console.log(data);
     res.write('id: ' + messageCount + '\n');
     res.write('data: ' + JSON.stringify(data) + '\n');
     res.write('\n\n');
  });

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

  //send headers for event-stream connection
  res.writeHead(200, {
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
  //publisherClient.publish( 'USUSDSGD', ('"' + req.params.event_name + '" page visited') );
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('All clients have received "' + req.params.event_name + '"');
  res.end();
});


// catch 404 and forward to error handler
//app.use(function(req, res, next) {
//  var err = new Error('Not Found');
//  err.status = 404;
//  next(err);
//});

// error handler
//app.use(function(err, req, res, next) {
//  // set locals, only providing error in development
//  res.locals.message = err.message;
//  res.locals.error = req.app.get('env') === 'development' ? err : {};
//  // render the error page
//  res.status(err.status || 500);
//  res.render('error');
//});

app.listen(8080);

module.exports = app;
