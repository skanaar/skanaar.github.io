var express = require('express')
var fetch = require('node-fetch')
var bodyParser = require('body-parser')

var app = express()

var jsonParser = bodyParser.json()

var searchUrl = 'https://www.avanza.se/ab/sok/inline?query='
var graphUrl = 'https://www.avanza.se/ab/component/highstockchart/getchart/orderbook'
app.use('/history', jsonParser, function (req, res) {
	fetch(searchUrl + req.query.symbol)
		.then(res => res.text())
		.then(function (text) {
			try {
				var orderbookId = +text.match('/om-aktien.html/([0-9]*)')[1]
				var opts = {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						'chartResolution' : 'MINUTE',
						'chartType' : 'AREA',
						'compareIds' : [],
						'navigator' : true,
						'orderbookId' : orderbookId,
						'owners' : false,
						'percentage' : false,
						'ta' : [],
						'timePeriod' : 'year',
						'volume' : false,
						'widthOfPlotContainer' : 558
					})
				}
				fetch(graphUrl, opts)
					.then(res => res.json())
					.then(json => res.send(JSON.stringify(json)));
			}
			catch (e) {
				res.send('server error')
			}
		});
  })


//app.get('/data', (req, res) => res.send('Hello World!'))

app.use('/', express.static(__dirname))

app.listen(7000, () => console.log('Example app listening on port 7000!'))
