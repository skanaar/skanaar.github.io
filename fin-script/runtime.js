finscript.env = {
	t: 0,
	symbols: {},
	getSymbol: function (id) {
		return this.symbols[id]
	},
	holdings: {},
	getHolding: function (sym) {
		return this.holdings[sym] || {name: sym, count: 0, gav: 0}
	},
	externals: {
		not: function (bool){
			return !bool
		},
		price: function (stock){
			return this.symbols[stock.name].data[this.t]
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
		average: function (stock,days) {
			return 0
		},
		noaction: function (){
			return {cmd:'noaction'}
		},
		buy: function (stock,units,price,period) {
			return { cmd:'buy', stock:stock, units:units, price:price, period:period }
		},
		sell: function (stock,units,price,period) {
			return {cmd:'sell', stock:stock, units:units, price:price, period:period }
		}
	}
}

function evaluate(node, env) {
	function onerr(e, nod) {
		throw new Error(e, nod)
	}
	if (node.node === 'number') {
		return node.value
	}
	if (node.node === 'symbol') {
		return env.symbols[node.name.substr(1)]
	}
	if (node.node === 'operator') {
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
		var body = finscript.findFunc(node, node.scope, onerr).body
		for (var i=0; i<node.func.params.length; i++) {
			var name = node.func.params[i].name
			var arg = node.args[i]
			var value = evaluate(arg, env)
			body.lets.unshift({node:'let', name:name, type:arg.type, value:value})
		}
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
