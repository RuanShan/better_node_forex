var moment = require('moment');
var redis = require("redis");
var ExchangeDescription = require("./exchange_description")
var Quotation = require("./quotation")

function  ExchangeRedisStore(  ) {
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
      var expire_at = now.startOf('week').startOf('day').add(2, 'weeks').format('x');
      expire_at = parseInt(expire_at );
      var key = this.build_zkey( symbol, now);
      if( this.symbol_expire_at[symbol] != expire_at)
      {
        this.client.expireat([key, expire_at], function(){   })
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
      var now = moment(obj.time);
      var key = obj.symbol +"_"+  now.startOf('week').startOf('day').format('x');
      var hmkey = "HM_" + key;
      var zkey = "Z_" + key;
      var val = obj.time.format('x') +"_"+ obj.new_value; // we could order it in client.
      if( obj instanceof ExchangeDescription)
      {
          //http://momentjs.com/docs/#/displaying/
          //Unix Timestamp	X	1360013296
          //Unix Millisecond Timestamp	x	1360013296123
          // 一周过期，键值 = 数据格式类型 + 业务类型 + 一周开始时间
          //this.client.hmset( hmkey, parseInt(obj.time.format('x')), obj.new_value )
          this.client.zadd( [zkey, obj.time.format('x'), val]  )
          //#   redis.zadd("zset", 32.0, "member")
      }
      else if ( obj instanceof Quotation) {
        //console.log("store Quotation %s,%s, %s", zkey,  obj.new_value, obj.time.format('x') );
        //this.client.hmset( hmkey, parseInt(obj.time.format('x')), obj.new_value )
        // it has to be uniq, add Timestamp as suffix
        if( obj.delta >0 )
        {
          this.client.zadd( [zkey, obj.time.format('x'), val] )
        }
      }
      this.set_expire( obj);
      this.client.publish( obj.symbol, val );
    }

    this.build_zkey = function( symbol, now){
      var key = "Z_"+ symbol +"_"+  now.startOf('week').startOf('day').format('x');
      return key;
    }
}

module.exports = ExchangeRedisStore;

ExchangeRedisStore.prototype.constructor = ExchangeRedisStore; // make stacktraces readable
