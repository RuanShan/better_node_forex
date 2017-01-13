var util = require('util');
var moment = require('moment');
var redis = require("redis");
var ExchangeJsonDescription = require("./exchange_json_description")
var ExchangeJsonQuotation = require("./exchange_json_quotation")

function  ExchangeJsonRedisStore(  ) {
  this.symbol_expire_at = {};

    this.client = redis.createClient();
    this.client.on("error", function(err) {
    	logger.error("redis error %s",  err);
    });
    this.client.on("ready", function(err) {
    	logger.info("redis ready");
    });

    this.set_expire = function( obj ){
      var symbol = obj.symbol;
      var now = moment(obj.time);
      var key = this.build_zkey( symbol, now);
      //var expire_at = now.startOf('week').startOf('day').add(2, 'weeks').format('x');
      var expire_at = now.startOf('week').startOf('day').add(1, 'weeks').format('x');
      expire_at = parseInt(expire_at );
      if( this.symbol_expire_at[symbol] != expire_at)
      {
        this.client.pexpireat([key, expire_at], function(err, response){
            if (err) throw err;
            //console.log("key=%s,expire_at=%s,response=%s",key,expire_at,response);
        })
        this.symbol_expire_at[symbol] = expire_at;
        console.log("redis key %s expire at %s", symbol, expire_at);
      }
    }

    this.set_expire_plus = function( symbol, key, time ){

      //var expire_at = now.startOf('week').startOf('day').add(2, 'weeks').format('x');
      var expire_at = time.startOf('week').startOf('day').add(1, 'weeks').format('x');
      expire_at = parseInt(expire_at );
      if( this.symbol_expire_at[symbol] != expire_at)
      {
        this.client.pexpireat([key, expire_at], function(err, response){
            if (err) throw err;
            //console.log("key=%s,expire_at=%s,response=%s",key,expire_at,response);
        })
        this.symbol_expire_at[symbol] = expire_at;
        console.log("redis key %s expire at %s", symbol, expire_at);
      }
    }

    this.store = function( obj )
    {
      //#汇率在redis 中的存储结构
      //# name is symbol
      //# orderlist   [time.to_f(score: time.to_i), time.to_f(time.to_i)]
      //# hash        [time.to_f: price, time.to_f: price]

      //  #ZADD key score1 member1 [score2 member2]
      //  #向有序集合添加一个或多个成员，或者更新已存在成员的分数
      var time = obj.time; // donot change it.
      var client = this.client;
      var symbol = obj.symbol;
      var now = moment(time);
      var key = symbol +"_"+  now.startOf('week').startOf('day').format('x');
      var zkey = this.build_zkey( symbol, now);
      var val = time.format('x') +"_" + obj.new_value+"_" + obj.price_timestamp; // we could order it in client.
      var quote = parseFloat(obj.new_value)
          //http://momentjs.com/docs/#/displaying/
          //Unix Timestamp	X	1360013296
          //Unix Millisecond Timestamp	x	1360013296123
          // 一周过期，键值 = 数据格式类型 + 业务类型 + 一周开始时间
          //this.client.hmset( hmkey, parseInt(time.format('x')), obj.new_value )
      if ( obj instanceof ExchangeJsonQuotation) {
        console.log("store Quotation %s,%s", zkey, val  );
        //this.client.hmset( hmkey, parseInt(time.format('x')), obj.new_value )
        // it has to be uniq, add Timestamp as suffix
        this.client.zadd( [zkey, time.format('x'), val] )
      }
      this.set_expire( obj);
      // before publish
      // in last 5 seconds, handle quote heck
      console.log( "time.seconds = %s ", time.toString());
      if (  time.seconds()>55 || time.seconds() < 5 )
      {
        var hackquote_zkey = this.build_hackquote_zkey(symbol, moment(time) )
        var hackquote_hkey = this.build_hackquote_hkey(now )
        var end_time = moment(time)
        var field = this.build_hquote_field_name(symbol, end_time);
        //console.log( " hkey=%s field=%s",hkey, field);
        this.client.hget(hackquote_hkey, field, function(err,response){
          //console.log( "argv=%s, symbol=%s, err=%s response=%s", util.inspect(this.args), symbol, err, response)
          if(err) return;
          var expire_at = moment(time).startOf('week').startOf('day').add(1, 'weeks').format('x');

          var quote_highlow = response
          if( quote_highlow ){
            console.log( " quote_highlow=%s current_quote=%s", quote_highlow, quote)
            var hack_quote = parseFloat( quote_highlow )
            var highlow = parseInt( quote_highlow.split('_')[1])
            if( highlow == 1 && hack_quote > quote  )
            {
              if( time.seconds() == 0 )
              {
                console.log( " seconds= %s,original =%s, hack =%s", time.seconds(), quote, hack_quote);
                quote = hack_quote;
              }else{
                console.log( " seconds= %s,original =%s, hack =%s", time.seconds(), quote, quote + (hack_quote -quote)/2);
                quote = quote + (hack_quote -quote)/2
                quote = Math.floor(quote*100000)*1.0/100000
              }
              val = time.format('x') +"_" + quote +"_" + obj.price_timestamp;

              client.zadd( [hackquote_zkey, time.format('x'), val] )
              client.pexpireat([hackquote_zkey, expire_at])
            } else if ( highlow == 0 && hack_quote < quote  )
            {
              if( time.seconds() == 0 )
              {
                console.log( " seconds= %s,original =%s, hack =%s", time.seconds(), quote, hack_quote);
                quote = hack_quote;
              }else{
                console.log( " seconds= %s,original =%s, hack =%s", time.seconds(), quote, quote + (hack_quote -quote)/2);
                quote = quote + (hack_quote -quote)/2
                quote = Math.floor(quote*100000)*1.0/100000
              }
              val = time.format('x') +"_" + quote +"_" + obj.price_timestamp;
              client.zadd( [hackquote_zkey, time.format('x'), val] )
              client.pexpireat([hackquote_zkey, expire_at])

            }
          }
          client.publish( obj.symbol, val );

        })

      }else{
        this.client.publish( obj.symbol, val );
      }
    }

    this.build_zkey = function( symbol, now){
      var key = "Z_"+ symbol +"_"+  now.startOf('week').startOf('day').format('x');
      return key;
    }

    this.build_hackquote_zkey = function( symbol, now ){
      return "Z_hquote_" + symbol +"_"+  now.startOf('week').startOf('day').format('x');
    }
    //"HM_hquote_1483804800000" => {"USDCHF_1484227200"=>"1.00622_0"}
    this.build_hackquote_hkey = function( now ){
      return "HM_hquote_" + now.startOf('week').startOf('day').format('x');
    }
    this.build_hquote_field_name = function( symbol, now ){
      if( now.seconds() > 55) {
        now.add(1, 'minutes');
      }
      return symbol+"_" + now.startOf('minute').format('X');
    }
}

module.exports = ExchangeJsonRedisStore;

ExchangeJsonRedisStore.prototype.constructor = ExchangeJsonRedisStore; // make stacktraces readable
