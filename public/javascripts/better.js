var g_quotation_desc = {
    first_pass: true,
    symbols: {},
    fields: {},
    req_fields: {},
    symbol_data: [],
    charts: {}
};

$(function () {
  var symbols = ['USUSDSGD'];
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
          var time_price = data[symbols[i]];
          var time = (new Date( parseInt(time_price) )).getTime();
          var price= parseInt(time_price.split('_')[1]);
          console.log("data=%s,%s", time, price);
          g_quotation_desc.charts[symbols[i]].series[0].addPoint([time, price], true,true);
        }
      }
      console.log(e);
    }, false);

});

function InitializeChart(message){
  var symbol = 'USUSDSGD'
  // Create the chart
  var chart = new Highcharts.StockChart("chart",{
      chart: {
      },
      rangeSelector: {
          buttons: [{
              count: 1,
              type: 'minute',
              text: '1M'
          }, {
              count: 5,
              type: 'minute',
              text: '5M'
          }, {
              type: 'all',
              text: 'All'
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
          name : 'Random data',
          data : (function () {
            var raw_data = message[symbol];
              // generate an array of random data
              var data = [];
              raw_data = raw_data.sort();
              for (var i = 0; i < raw_data.length; i += 1) {
                data.push([
                  (new Date( parseInt(raw_data[i]) )).getTime(),
                  parseInt(raw_data[i].split('_')[1])
                ]);
              }
              return data;
          }())
      }]
  });
  g_quotation_desc.charts[symbol] = chart;
}
