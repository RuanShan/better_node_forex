//var _ = require('underscore');
var ExchangeOhlcDescription = require("./exchange_ohlc_description")
var ExchangeOhlcRedisStore = require("./exchange_ohlc_redis_store")

// handle open/high/low/close data for candlestick chart
function  ExchangeOhlcCollection( symbols) {
      this.push_count = 0;
      this.exchange_symbols = symbols;
      this.exchange_map = {};
      this.lastupdate = new Date();
      this.exchange_redis_store = new ExchangeOhlcRedisStore()
      //var self = this;
}
    // [["USUSDCNY","美汇澳元",4,67791,67740,67741,67809,67740,67740],
    //  ["USUSDCAD","美汇加元",4,13362,13362,13363,13391,13359,13362],
    //  ["USGBPUSD","美汇英镑",4,12437,12396,12394,12440,12385,12396],
    //  ["USUSDHKD","美汇港元",4,77555,77547,77548,77560,77542,77547],]
    //attr_accessor :exchange_symbols, :fields, :push_count
    //attr_accessor :exchange_descriptions, :exchange_map, :exchange_redis_store

    //[["USUSDCNY","人 民 币",4,67833,67740,67741,67840,67740,67740],["USAUDUSD","美汇澳元",4,7696,7727,7727,7728,7687,7727],["USUSDCAD","美汇加元",4,13368,13362,13363,13391,13350,13362],["USUSDCHF","美汇瑞士",4,9763,9742,9743,9765,9734,9742],["USGBPUSD","美汇英镑",4,12408,12396,12394,12440,12385,12396],["USUSDHKD","美汇港元",4,77547,77547,77548,77560,77542,77547],["USUSDJPY","美汇日元",2,10472,10445,10445,10476,10429,10445],["USNZDUSD","美汇纽元",4,7325,7343,7343,7348,7316,7343],["USUSDSGD","美汇新元",4,13902,13891,13891,13922,13882,13891],["USUSDTWD","美汇台币",4,314700,314670,315090,316100,313900,314670],["USEURUSD","美汇欧元",4,11043,11039,11040,11067,11029,11039],]
    //[[3],[6],[8,2],[10],]
ExchangeOhlcCollection.prototype.pushMessage = function (data, time ) {

  this.lastupdate = time;

  this.exchange_map = {};
  for( var i = 0; i< data.length; i++ )
  {
    var item = data[i];
    var symbol = item.symbol;
    console.log("initial %s, %s", i, symbol);
    if( this.exchange_map[symbol] == null)
    {
      this.exchange_map[symbol] = new ExchangeOhlcDescription( symbol, time, this.exchange_redis_store);
    }
    this.exchange_map[symbol].pushMessage( item, time );
  }

  this.push_count += 1;
}


module.exports = ExchangeOhlcCollection;

ExchangeOhlcCollection.prototype.constructor = ExchangeOhlcCollection; // make stacktraces readable
