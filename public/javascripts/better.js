var g_quotation_desc = {
    first_pass: true,
    symbols: {},
    fields: {},
    req_fields: {},
    symbol_data: [],
    charts: {}
};

function format_intval(v, digits) {
    var txt = "";

    if (digits > 0) {
        var pow = Math.pow(10, digits);

        if (v < pow && v > -pow) {
            if (v < 0) { txt = "-0."; v = -v; }
            else { txt = "0."; }
            var tmp = "" + v;
            for (var i = tmp.length; i < digits; i++) txt += "0";
            txt += tmp;
            return txt;
        }

        txt += v / pow;
        if (txt.indexOf("e") != -1) return "-";

        var idx = txt.indexOf(".");
        if (idx == -1) { txt += "."; idx = txt.length - 1; }
        for (var i = txt.length - idx - 1; i < digits; i++) txt += "0";

        return txt;
    }

    txt += v;
    return txt;
}

function format_float(val, digits) {
    var txt = "";
    if (digits > 0) {
        var v = Math.round(val * Math.pow(10, digits));
        return format_intval(v, digits);
    } else {
        txt += Math.round(val);
        return txt;
    }
}

function ConvertIntegerToCorrectRate( symbol, val  )
{
  return val/10000;
}


$(function () {
  var symbols = [];
  $(".chart[data-symbol]").each(function(){
    symbols.push( $(this).data('symbol') );
  });
  //var symbols = ['USEURUSD','USGBPUSD'];
    Highcharts.setOptions({
        global : {
            useUTC : false
        }
    });

    var source = new EventSource('/sse/'+symbols.join(','));
    source.addEventListener('message', function(e) {
      var data = JSON.parse(e.data);
      if( g_quotation_desc.first_pass )
      {
        g_quotation_desc.first_pass = false;
        InitializeChart( data );
      }else{
        for( var i = 0; i< symbols.length; i++)
        {
          var symbol = symbols[i];
          var time_price = data[symbol];
          var time = (new Date( parseInt(time_price) )).getTime();
          var price= ConvertIntegerToCorrectRate( symbol, parseInt(time_price.split('_')[1]));
          //console.log("data=%s,%s", time, price);
          if(g_quotation_desc.charts[symbol])
          {
            g_quotation_desc.charts[symbol].series[0].addPoint([time, price], true,true);
          }

          // new point added
          //g_quotation_desc.charts[symbols[i]].yAxis[0].plotLines[0].value = price;
        }
      }
      console.log(e);
    }, false);

});

function InitializeChart(message){

  $(".chart").each(function(){
    var $container = $(this);

    var chart = new Highcharts.StockChart({
      credits: {
        enabled: false
      },
        chart: {
          renderTo: this.id
        },
        navigator: {
          height: 0
        },
        scrollbar: {
          enabled : false
        },
        tooltip: {
          valueDecimals: 4,
          formatter: function () {
                  var s = '<b>' + Highcharts.dateFormat('%H:%M:%S', this.x) + '</b>';
                  s += '<br/><b>' +Highcharts.numberFormat(this.y, 4) + '</b>';
                  return s;
          }
        },
        yAxis:{
          labels:
          {
            formatter: function(){
              return format_float( this.value, 4);
            }
          }
        },
        rangeSelector: {
            buttons: [{
              count: 60,
                type: 'minute',
                text: '60M'
            }, {
                count: 30,
                type: 'minute',
                text: '30M'
            }, {
                count: 15,
                type: 'minute',
                text: '15M'
            }],
            inputEnabled: false,
            selected: 0
        },
        title : {
            text : 'Live random data'
        },
        exporting: {
            enabled: false
        },
        series : [{
            name : 'data',
            data : (function () {
              //var container = $("#"+this.renderTo);
              var symbol = $container.data('symbol');
              var raw_data = message[symbol];
                // generate an array of random data
                var data = [];
                raw_data = raw_data.sort();
                for (var i = 0; i < raw_data.length; i += 1) {
                  data.push([
                    (new Date( parseInt(raw_data[i]) )).getTime(),
                    ConvertIntegerToCorrectRate( symbol, parseInt(raw_data[i].split('_')[1]))
                  ]);
                }
                return data;
            }()),
            lineWidth: 1

        }]
    });
    var symbol = $container.data('symbol');
    g_quotation_desc.charts[symbol] = chart;

  })
  // Create the chart
}
