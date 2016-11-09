module BetterForex
  class ExchangeRedisStore
    attr_accessor :redis

    def initialize( )
      self.redis = Redis.new(:host => "127.0.0.1", :port => 6379)
    end

    #汇率在redis 中的存储结构
    # name is symbol
    # orderlist   [time.to_f(score: time.to_i), time.to_f(time.to_i)]
    # hash        [time.to_f: price, time.to_f: price]
    def store( object)
      #ZADD key score1 member1 [score2 member2]
      #向有序集合添加一个或多个成员，或者更新已存在成员的分数
      case object
        when ExchangeDescription
          redis.hmset( "HM_"+object.symbol, object.time.to_f, object.new_value )
          redis.zadd( "Z_"+object.symbol, object.time.to_i, object.time.to_f )
          #   redis.zadd("zset", 32.0, "member")
        when Quotation
          redis.hmset( "HM_"+object.symbol, object.time.to_f, object.new_value )
          redis.zadd( "Z_"+object.symbol, object.time.to_i, object.time.to_f )
      end
    end
  end
end
