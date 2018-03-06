var env = {
	t: 0,
	symbols: {
		OMX30: {name:'OMX30', data:[1,2,3]},
		AZA: {name:'AZA', data:[1,2,3]},
		FING: {name:'FING', data:[1,2,3]},
		GOOG: {name:'GOOG', data:[1,2,3]}
	},
	holdings: {
		AZA: {name:'AZA', count:12, gav:300},
		FING: {name:'FING', count:1000, gav: 50}
	},
	getHolding: function (sym) {
		return env.holdings[sym] || {name: sym, count: 0, gav: 0}
	},
	externals: {
		noaction: function (){ return {cmd:'noaction'} },
		price: function (stock){ return symbols[stock.name].data[env.t] },
		count: function (holding) { return holding.count },
		have_orders: function (stock) { return env.getHolding(stock.name).count > 0 },
		average: function (stock,days) { return 0 },
		buy: function (stock,units,price,period) {
			return { cmd:'buy', units: units, price: price, period: period }
		},
		sell: function (stock,units,price,period) {
			return {cmd: 'sell', units: units, price: price, period: period }
		}
	}
}

function evaluate(node, env) {
	if (node.node === 'number') {
		return node.value
	}
	if (node.node === 'symbol') {
		return env.symbols[node.name]
	}
	if (node.node === 'operator') {
		switch (node.operator) {
			case '<': return evaluate(node.lhs) < evaluate(node.rhs)
			case '>': return evaluate(node.lhs) > evaluate(node.rhs)
			case '+': return evaluate(node.lhs) + evaluate(node.rhs)
			case '-': return evaluate(node.lhs) - evaluate(node.rhs)
			case '*': return evaluate(node.lhs) * evaluate(node.rhs)
			case '/': return evaluate(node.lhs) / evaluate(node.rhs)
			default: throw new Error('Unknown operator "'+node.operator+'"')
		}
	}
	if (node.node === 'invoke') {
		if (node.func.extern) {
			var args = node.args.map(e => evaluate(e.value))
			return env.externals[node.name].apply(null, args)
		}
		return evaluate(finscript.findFunc(node, node.scope).body)
	}
	if (node.node === 'deref') {
		return evaluate(finscript.findLet(node, node.scope).value)
	}
	if (node.node === 'body') {
		for (var i=0; i<node.cases.length; i++) {
			if (true === evaluate(node.cases[i].predicate)) {
				return evaluate(node.cases[i].value)
			}
		}
		return evaluate(node.default)
	}
}

function executeScript(ast) {
	evaluate(ast, env)
}
