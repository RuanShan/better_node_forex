var _ = require('underscore');
function  Quotation( exchange_description, data, time ) {
  this.exchange_description = exchange_description
  this.data = data;
  this.time = time;
  this.new_value = 0;
  this.symbol = this.exchange_description.symbol;
    //attr_accessor :exchange_description, :data, :time
    //attr_accessor :new_value, :last_settle, :open_value, :high_value, :low_value, :close_value

    //#DUSD	美汇澳元 4
      this.update_field_values = function(){
        if( this.data[ exchange_description.field_price_index ] )
        {
          var last_quotation = _.last( exchange_description.quotations)
          if( last_quotation )
          {
            this.new_value = last_quotation.new_value + this.data[ exchange_description.field_price_index ]
          }else{
            //#quotation[req_field] += qval; // Math.pow(10, quotation.Digits);
            this.new_value = exchange_description.new_value + this.data[ exchange_description.field_price_index ]
          }
        }
      }

  this.update_field_values();
}

module.exports = Quotation;
Quotation.prototype.constructor = Quotation; // make stacktraces readable
