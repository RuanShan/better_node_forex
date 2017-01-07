//一个汇率品种
var ExchangeOhlcQuotation = require("./exchange_ohlc_quotation")

function  ExchangeOhlcDescription( symbol, time, exchange_redis_store ) {
  //attr_accessor :quotations, :fields, :initial_values, :time, :exchange_redis_store
  //attr_accessor :symbol, :name, :digits, :field_price_index
  //attr_accessor :new_value, :last_settle, :open_value, :high_value, :low_value, :close_value
  //#          商品,最新, 涨跌, 开盘, 最高,最低, 收盘, 涨跌, 涨跌幅
  //# fields = [Name,Price,Arrow,Open,High,Low,Close,Fluctuatation,FluctuatationRate]
    this.symbol = symbol;
    this.quotations = [];
    this.time = time;

    this.exchange_redis_store = exchange_redis_store;

    this.initialize_fields = function( item ){
      this.symbol = item.symbol;
      console.log( "initial " + symbol + time.format("HH:mm:ss") );
      //logger.debug( "initial " + symbol + " " + this.new_value );
    }
}

ExchangeOhlcDescription.prototype.pushMessage = function (data, time ) {
  if( this.quotations.length == 0 )
  {
    this.initialize_fields( data )
  }

  {
      var new_quotation = new ExchangeOhlcQuotation( this, data, time )
      // limitate quotations 's size
      if( this.quotations.length> 3600 ){
        this.quotations.splice(0, 3600);
      }
      this.quotations.push( new_quotation )
      console.log( this.symbol + " " + time.format("HH:mm:ss") + " " + new_quotation.open );
      this.exchange_redis_store.store( new_quotation )

  }
}

module.exports = ExchangeOhlcDescription;

ExchangeOhlcDescription.prototype.constructor = ExchangeOhlcDescription; // make stacktraces readable
