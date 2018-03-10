finscript.env = {
	t: 0,
	symbols: {},
	getSymbol: function (id) {
		// override in execution environment
		return this.symbols[id]
	},
	holdings: {},
	balance: 10000,
	getHolding: function (sym) {
		if (!this.holdings[sym]){
			this.holdings[sym] = {name: sym, count: 10, gav: 10}
		}
		return this.holdings[sym]
	},
	eavesdrop: function (){},
	numericValue: function (node) {
		this.eavesdrop('number', node.value, { value:node.value, type:node.type })
		return node.value
	},
	externals: {
		not: function (bool){
			return !bool
		},
		price: function (stock){
			return this.symbols[stock.name].data[this.t]
		},
		historic_price: function (stock, offset){
			return this.symbols[stock.name].data[this.t - offset]
		},
		count: function (holding) {
			return holding.count
		},
		holding: function (stock) {
			return this.getHolding(stock.name)
		},
		have_orders: function (stock) {
			return this.getHolding(stock.name).count > 0
		},
		max_price: function(stock,days) {
			for (var i=0,res=0; i<days; i++)
				res = Math.max(res, stock.data[this.t+i] || 0)
			this.eavesdrop('max_price', res, { stock, days })
			return res
		},
		min_price: function(stock,days) {
			for (var i=0,res=Infinity; i<days; i++)
				res = Math.min(res, stock.data[this.t+i] || Infinity)
			this.eavesdrop('min_price', res, { stock, days })
			return res
		},
		historic_max: function(stock,days,offset) {
			for (var i=0,res=0; i<days; i++)
				res = Math.max(res, stock.data[this.t+i+Math.round(offset)] || 0)
			this.eavesdrop('historic_max', res, { stock, days, offset })
			return res
		},
		historic_min: function(stock,days,offset) {
			for (var i=0,res=Infinity; i<days; i++)
				res = Math.min(res, stock.data[this.t+i+Math.round(offset)] || Infinity)
			this.eavesdrop('historic_min', res, { stock, days, offset })
			return res
		},
		average: function (stock,days) {
			for (var i=0,sum=0; i<days; i++)
				sum += (stock.data[this.t+i] || 0)
			var res = sum / days
			this.eavesdrop('average', res, { stock, days })
			return res
		},
		historic_average: function (stock,days,offset) {
			for (var i=0,sum=0; i<days; i++)
				sum += (stock.data[this.t+i+Math.round(offset)] || 0)
			var res = sum / (days)
			this.eavesdrop('historic_average', res, { stock, days, offset })
			return res
		},
		volatility: function (stock,days) {
			var diffs = []
			for (var i=1; i<days; i++)
				diffs.push((stock.data[this.t+i] || 0) / (stock.data[this.t+i-1] || 1) - 1)
			function std(list){
				var mean = list.reduce((a,b) => a+b) / list.length;
				var sqd = list.reduce((a,b) => a + (b-mean)*(b-mean), 0)
				return (Math.sqrt(sqd / list.length))
			}
			return std(diffs) / Math.sqrt(252/days)
		},
		historic_volatility: function (stock,days,offset) {
			var diffs = []
			var t = this.t + Math.round(offset)
			for (var i=1; i<days; i++)
				diffs.push((stock.data[t+i] || 0) / (stock.data[t+i-1] || 1) - 1)
			function std(list){
				var mean = list.reduce((a,b) => a+b) / list.length;
				var sqd = list.reduce((a,b) => a + (b-mean)*(b-mean), 0)
				return (Math.sqrt(sqd / list.length))
			}
			return std(diffs) / Math.sqrt(252/days)
		},
		noaction: function (){
			return {cmd:'noaction'}
		},
		buy: function (stock,units,price,period) {
			var maxUnits = Math.min(units, Math.floor(this.balance/price))
			if (maxUnits === 0) { return { cmd:'noaction' } }
			return { cmd:'buy', stock:stock, units:maxUnits, price:price, period:period }
		},
		sell: function (stock,units,price,period) {
			var holding = this.getHolding(stock.name).count
			units = Math.min(holding, units)
			if (Math.floor(units) <= 0){ return { cmd:'noaction' } }
			return {cmd:'sell', stock:stock, units:units, price:price, period:period }
		}
	}
}

function evaluate(node, env) {
	function onerr(e, nod) {
		throw new Error(e, nod)
	}
	if (node.node === 'number') {
		return env.numericValue(node)
	}
	if (node.node === 'symbol') {
		return env.symbols[node.name.substr(1)]
	}
	if (node.node === 'operator') {
		env.eavesdrop('operator', node.operator, { node, lhs:node.lhs, rhs:node.rhs })
		switch (node.operator) {
			case '<': return evaluate(node.lhs, env) < evaluate(node.rhs, env)
			case '>': return evaluate(node.lhs, env) > evaluate(node.rhs, env)
			case '+': return evaluate(node.lhs, env) + evaluate(node.rhs, env)
			case '-': return evaluate(node.lhs, env) - evaluate(node.rhs, env)
			case '*': return evaluate(node.lhs, env) * evaluate(node.rhs, env)
			case '/': return evaluate(node.lhs, env) / evaluate(node.rhs, env)
			default: throw new Error('Unknown operator "'+node.operator+'"')
		}
	}
	if (node.node === 'invoke') {
		if (node.func.extern) {
			var args = node.args.map(e => evaluate(e, env))
			return env.externals[node.name].apply(env, args)
		}
		var eavesdropArgs = []
		var body = finscript.findFunc(node, node.scope, onerr).body
		for (var i=0; i<node.func.params.length; i++) {
			var name = node.func.params[i].name
			var arg = node.args[i]
			var value = evaluate(arg, env)
			eavesdropArgs.push(value)
			body.lets.unshift({node:'let', name:name, type:arg.type, value:value})
		}
		env.eavesdrop('invoke', node.name, eavesdropArgs)
		return evaluate(body, env)
	}
	if (node.node === 'deref') {
		return evaluate(finscript.findLet(node, node.scope).value, env, onerr)
	}
	if (node.node === 'body') {
		for (var n=0; n<node.cases.length; n++) {
			if (true === evaluate(node.cases[n].predicate, env)) {
				return evaluate(node.cases[n].value, env)
			}
		}
		return evaluate(node.default, env)
	}
	return node
}

finscript.evaluate = evaluate
