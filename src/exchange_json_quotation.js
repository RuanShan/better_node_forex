var _ = require('underscore');
function  ExchangeJsonQuotation( exchange_description, data, time ) {
  //this.exchange_description = exchange_description
  //this.data = data;
  this.time = time;
  this.price_timestamp = null;
  this.store_required = false; // redis store required
  this.delta = 0; //本次与上次的差量
  this.new_value = 0;
  this.symbol = exchange_description.symbol;

  //#DUSD	美汇澳元 4
  this.update_field_values = function(){
    this.new_value = data.price
    this.price_timestamp = data.timestamp;
  }

  this.update_field_values();
}

module.exports = ExchangeJsonQuotation;
ExchangeJsonQuotation.prototype.constructor = ExchangeJsonQuotation; // make stacktraces readable
