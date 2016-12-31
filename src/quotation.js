var _ = require('underscore');
function  Quotation( exchange_description, data, time ) {
  //this.exchange_description = exchange_description
  //this.data = data;
  this.time = time;
  this.store_required = false; // redis store required
  this.delta = 0; //本次与上次的差量
  this.new_value = 0;
  this.symbol = exchange_description.symbol;
  //'Price','LastSettle','Open','High','Low','Close'
  this.field_indexes = [1,2,3,4,5,6];
  this.field_deltas = [0,0,0,0,0,0];
  //绘制蜡烛图的方法
  //http://www.cnblogs.com/zhongxinWang/p/4641032.html
  this.new_last_settle = 0;
  this.new_open_value = 0;
  this.new_high_value = 0;
  this.new_low_value = 0;
  this.new_close_value = 0;

  //#DUSD	美汇澳元 4
  this.update_field_values = function(){
    for( i =0;i< this.field_indexes.length; i++)
    {
      //console.log( "data [%i]=%s",i, data[ this.field_indexes[i] ]);
      if( data[ this.field_indexes[i] ] != null )
      {
        this.field_deltas[i] = data[ this.field_indexes[i] ];
        if( this.field_deltas[i] > 0 ){
          this.store_required = true;
        }
      }
    }

    this.delta = this.field_deltas[0];

    var last_quotation = exchange_description.quotations[exchange_description.quotations.length-1];
    if( last_quotation )
    {
      this.new_value = last_quotation.new_value +  this.field_deltas[0];
      this.new_last_settle = last_quotation.new_last_settle + this.field_deltas[1];
      this.new_open_value = last_quotation.new_open_value + this.field_deltas[2];
      this.new_high_value = last_quotation.new_high_value + this.field_deltas[3];
      this.new_low_value = last_quotation.new_low_value + this.field_deltas[4];
      this.new_close_value = last_quotation.new_close_value + this.field_deltas[5];
    }else{
      //#quotation[req_field] += qval; // Math.pow(10, quotation.Digits);
      this.new_value = exchange_description.new_value +  this.field_deltas[0];
      this.new_last_settle = exchange_description.new_last_settle +  this.field_deltas[1];
      this.new_open_value = exchange_description.new_open_value +  this.field_deltas[2];
      this.new_high_value = exchange_description.new_high_value +  this.field_deltas[3];
      this.new_low_value = exchange_description.new_low_value +  this.field_deltas[4];
      this.new_close_value = exchange_description.new_close_value +  this.field_deltas[5];
    }
  }

  this.update_field_values();
}

module.exports = Quotation;
Quotation.prototype.constructor = Quotation; // make stacktraces readable
