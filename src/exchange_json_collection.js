//var _ = require('underscore');
var ExchangeJsonDescription = require("./exchange_json_description")
var ExchangeJsonRedisStore = require("./exchange_json_redis_store")

function  ExchangeJsonCollection( symbols, fields) {
      this.push_count = 0;
      this.fields = fields;
      this.exchange_symbols = symbols;
      this.exchange_map = {};
      this.symbol = null;
      this.lastupdate = new Date();
      this.exchange_redis_store = new ExchangeJsonRedisStore()
      //var self = this;
}

//    [ { code: 'HSI', price: '22475', timestamp: '1483745195' },
//      { code: 'USDJPY', price: '117.016', timestamp: '1483745195' } ]
ExchangeJsonCollection.prototype.pushMessage = function (data, time ) {

  this.lastupdate = time;
      if( this.push_count==0 ){
        this.exchange_map = {};
        for( var i = 0; i< data.length; i++ )
        {
          var item = data[i];
          //console.log("ExchangeJsonCollection.pushMessage: initial %s, %s", i, item.symbol);
          this.exchange_map[item.symbol] = new ExchangeJsonDescription( item.symbol, this.price, (time), this.exchange_redis_store);
          this.exchange_map[item.symbol].pushMessage( item, time );
        }
      }else{
        for( var i = 0; i< data.length; i++ )
        {
          var item = data[i];
          var exchange = this.exchange_map[item.symbol];
          //console.log("%s, %s", symbol_index, exchange.symbol);
          exchange.pushMessage( item, time );
        }
      }
      this.push_count += 1;
}


module.exports = ExchangeJsonCollection;

ExchangeJsonCollection.prototype.constructor = ExchangeJsonCollection; // make stacktraces readable
