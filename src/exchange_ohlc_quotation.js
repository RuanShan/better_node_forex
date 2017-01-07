var _ = require('underscore');
function  ExchangeOhlcQuotation( exchange_description, data, time ) {
  //this.exchange_description = exchange_description
  //this.data = data;
  this.time = time;
  this.store_required = false; // redis store required
  this.symbol = exchange_description.symbol;

  //绘制蜡烛图的方法
  //http://www.cnblogs.com/zhongxinWang/p/4641032.html
  this.open = 0;
  this.high = 0;
  this.low = 0;
  this.close = 0;

  //#DUSD	美汇澳元 4
  this.update_field_values = function(){
      this.open = data.open;
      this.high = data.high;
      this.low = data.low;
      this.close = data.close;
  }

  this.update_field_values();
}

module.exports = ExchangeOhlcQuotation;
ExchangeOhlcQuotation.prototype.constructor = ExchangeOhlcQuotation; // make stacktraces readable
