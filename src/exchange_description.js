//一个汇率品种
var Quotation = require("./quotation")

function  ExchangeDescription( symbol, fields, time, exchange_redis_store ) {
  //attr_accessor :quotations, :fields, :initial_values, :time, :exchange_redis_store
  //attr_accessor :symbol, :name, :digits, :field_price_index
  //attr_accessor :new_value, :last_settle, :open_value, :high_value, :low_value, :close_value
  //#          商品,最新, 涨跌, 开盘, 最高,最低, 收盘, 涨跌, 涨跌幅
  //# fields = [Name,Price,Arrow,Open,High,Low,Close,Fluctuatation,FluctuatationRate]
    this.symbol = symbol;
    this.fields = fields;
    this.quotations = [];
    this.time = time;
    // quotation fields [symbol_index, delta_price, ]
    this.field_price_index = 1;

    this.name = null;
    this.exchange_redis_store = exchange_redis_store;

    this.initialize_fields = function( item ){

      this.symbol = item[0];
      this.name =  item[1];
      this.digits = item[2];
      //## Price,LastSettle,Open,Hight,Low,Close
      //#reqest_fields.each_with_index{|field, i|
      //#  # skip 名称符号, 名称, 小数点位数
      //#  initial_values[i] = item[ i + 3 ]
      //#}
      this.new_value = item[3];
      this.new_last_settle = item[4];
      this.new_open_value =item[5];
      this.new_high_value =item[6];
      this.new_low_value = item[7];
      this.new_close_value = item[8];
      console.log( "initial " + symbol + time.format("HH:mm:ss")+ " " + this.new_value );
      //logger.debug( "initial " + symbol + " " + this.new_value );
    }
}

ExchangeDescription.prototype.pushMessage = function (data, time ) {
  if( this.name == null)
  {
    this.initialize_fields( data )
    this.exchange_redis_store.store( this )
  }else{

      var new_quotation = new Quotation( this, data, time )
      // limitate quotations 's size
      if( this.quotations.length> 3600 ){
        this.quotations.splice(0, 3600);
      }
      this.quotations.push( new_quotation )
      console.log( this.symbol + " " + time.format("HH:mm:ss") + " " + new_quotation.new_value );
      logger.debug( this.symbol + " " + new_quotation.new_value );
      this.exchange_redis_store.store( new_quotation )

  }
}

module.exports = ExchangeDescription;

ExchangeDescription.prototype.constructor = ExchangeDescription; // make stacktraces readable
