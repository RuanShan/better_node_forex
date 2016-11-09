var _ = require('underscore');
function  Quotation( exchange_description, data, time ) {
  this.exchange_description = exchange_description
  this.data = data
  this.time = time
  var new_value = 0

    Object.defineProperty(this, 'new_value', {
      get: function () {
        return new_value;
      }
    });
    //attr_accessor :exchange_description, :data, :time
    //attr_accessor :new_value, :last_settle, :open_value, :high_value, :low_value, :close_value

    //#DUSD	美汇澳元 4

      this.update_field_values = function(){
        if( this.data[ exchange_description.field_price_index ] )
        {
          var last_quotation = _.last( exchange_description.quotations)
          if( last_quotation )
          {
            new_value = last_quotation.new_value + this.data[ exchange_description.field_price_index ]
          }else{
            //#quotation[req_field] += qval; // Math.pow(10, quotation.Digits);
            new_value = exchange_description.new_value + this.data[ exchange_description.field_price_index ]
          }
        }
      }
      this.symbol = function(){
        this.exchange_description.symbol
      }
  this.update_field_values();
}

module.exports = Quotation;
Quotation.prototype.constructor = Quotation; // make stacktraces readable
