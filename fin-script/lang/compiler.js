
function funcDef(name, type, params) {
	var ps = params.map(e => ({ node:'param', name:e.split(':')[0], type:e.split(':')[1] }))
	return {
		node: 'func',
		extern: true,
		name: name,
		type: type,
		params: ps,
		scope: { node:'body', cases:[], lets:[], funcs:[], params:ps }
	}
}

var finscript = {
	globalScope: {
		node: 'body',
		lets: [],
		cases: [],
		params: [],
		funcs: [
			funcDef('not', 'Bool', ['bool:Bool']),
			funcDef('all', 'Bool', ['bool:Bool','bool:Bool']),
			funcDef('any', 'Bool', ['bool:Bool','bool:Bool']),
			funcDef('price', 'Sek', ['stock:Stock']),
			funcDef('max', 'Sek', ['stock:Stock','period:Days']),
			funcDef('min', 'Sek', ['stock:Stock','period:Days']),
			funcDef('average', 'Sek', ['stock:Stock','period:Days']),
			funcDef('volatility', 'Dimensionless', ['stock:Stock','period:Days']),
			funcDef('historic_price', 'Sek', ['stock:Stock','offset:Days']),
			funcDef('historic_max', 'Sek', ['stock:Stock','period:Days','offset:Days']),
			funcDef('historic_min', 'Sek', ['stock:Stock','period:Days','offset:Days']),
			funcDef('historic_average', 'Sek', ['stock:Stock','period:Days','offset:Days']),
			funcDef('historic_volatility', 'Dimensionless', ['stock:Stock','period:Days','offset:Days']),
			funcDef('count', 'Units', ['holding:Holding']),
			funcDef('have_orders', 'Bool', ['stock:Stock']),
			funcDef('holding', 'Holding', ['stock:Stock']),
			funcDef('no_action', 'Command', []),
			funcDef('buy', 'Command', ['stock:Stock','units:Units','price:Sek','period:Days']),
			funcDef('sell', 'Command', ['stock:Stock','units:Units','price:Sek','period:Days'])
		]
	},

	parse: function (source, onerror){
		try {
			return parser.parse(source)
		} catch (e) {
			var line = +(e.message.match(/line ([0-9]*)/) || [0,0])[1]
			onerror(e.message, {loc:[{first_line: line, first_column:0},{last_column: 70}]})
			throw new Error('Parse error')
		}
	},

	walkTree: function(node, enter, exit) {
		function visit(e) {
			enter(e, node)
			finscript.walkTree(e, enter, exit)
			exit(e, node)
		}
		if (node.node === 'let')
			visit(node.value)
		if (node.node === 'invoke')
			node.args.forEach(visit)
		if (node.node === 'body') {
			node.lets.forEach(visit)
			node.cases.forEach(visit)
			node.funcs.forEach(visit)
			visit(node.default)
		}
		if (node.node === 'operator'){
			visit(node.lhs)
			visit(node.rhs)
		}
		if (node.node === 'func') {
			node.params.forEach(visit)
			visit(node.body)
		}
		if (node.node === 'case'){
			visit(node.predicate)
			visit(node.value)
		}
	},

	populateScopes: function(root) {
		root.scope = root
		root.scope.parentScope = finscript.globalScope
		finscript.walkTree(root, function (node, parent) {
			if (node.node === 'body') {
				node.scope = node
				node.scope.parentScope = parent.scope
			} else {
				node.scope = {funcs:[], lets:[], params:[], parentScope: parent.scope }
			}
		}, function (){})
	},

	findLet: function(node, scope, onerror) {
		if (!scope) {
			onerror('Undeclared constant "' + node.name + '"', node)
			throw new Error('Parse error')
		}
		var foundLet = scope.lets.find(e => e.name === node.name)
		var foundParam = scope.params.find(e => e.name === node.name)
		return foundLet || foundParam || finscript.findLet(node, scope.parentScope, onerror)
	},

	findFunc: function(node, scope, onerror) {
		if (!scope) {
			onerror('Undeclared function "' + node.name + '"', node)
			throw new Error('Parse error')
		}
		var found = scope.funcs.find(e => e.name === node.name)
		return found || finscript.findFunc(node, scope.parentScope, onerror)
	},

	markupTypes: function(root, onerror) {
		function aliasType(type) {
			return ['Units', 'Factor'].includes(type) ? 'Dimensionless' : type
		}
		finscript.walkTree(root, function (){}, function (node, parent) {
			if (node.node === 'invoke'){
				var fn = finscript.findFunc(node, node.scope, onerror)
				node.func = fn
				node.type = fn.type
			}
			if (node.node === 'deref') {
				var ref = finscript.findLet(node, node.scope, onerror)
				node.ref = ref
				node.type = ref.type
			}
			if (node.node === 'operator'){
				var Left = aliasType(node.lhs.type)
				var Right = aliasType(node.rhs.type)
				if (node.operator === '<' || node.operator === '>') {
					node.type = 'Bool'
				}
				if (node.operator === '+' || node.operator === '-') {
					node.type = Left
				}
				if (node.operator === '*') {
					if (Left === 'Dimensionless') { node.type = Right }
					else if (Right === 'Dimensionless') { node.type = Left }
					else { node.type = Right+'x'+Left }
				}
				if (node.operator === '/') {
					if (Left === 'Dimensionless') { node.type = Right }
					if (Right === 'Dimensionless') { node.type = Left }
					if (Left === Right) { node.type = 'Dimensionless' }
				}
			}
			if (node.node === 'case'){
				node.type = node.value.type
			}
			if (node.node === 'symbol'){
				node.type = 'Stock'
			}
		})
	},

	checkTypes: function(root, onerror) {
		function aliasType(type) {
			return ['Units', 'Factor'].includes(type) ? 'Dimensionless' : type
		}
		var isConsistent = true
		finscript.walkTree(root, function (){}, function (node, parent) {
			var ok = true
			if (node.node === 'invoke'){
				ok = node.func.params.length === node.args.length
				if (!ok) onerror('"'+node.name+'" takes '+node.func.params.length+' arguments',node)
				if (ok) {
					for (var i=0; i<node.func.params.length; i++) {
						var actual = node.args[i].type
						var expected = node.func.params[i].type
						if (aliasType(actual) === aliasType(expected)) { continue }
						ok = false
						onerror('Argument '+(1+i)+' expect "'+expected+'" got "'+actual+'"', node)
					}
				}
			}
			if (node.node === 'operator'){
				var Left = aliasType(node.lhs.type)
				var Right = aliasType(node.rhs.type)
				if (node.operator === '<' || node.operator === '>') {
					ok = Left === Right
					if (!ok) onerror('Cannot compare "'+Left+'" and "'+Right+'"', node)
				}
				if (node.operator === '+' || node.operator === '-') {
					ok = Left === Right
					var op = node.operator === '+' ? 'add' : 'subtract'
					if (!ok) onerror('Cannot '+op+' "'+Left+'" and "'+Right+'"', node)
				}
				if (node.operator === '*') {
					ok = (Left === 'Dimensionless' || Right === 'Dimensionless')
					if (!ok) onerror('Cannot multiply unsupported types', node)
				}
				if (node.operator === '/') {
					ok = (Left === 'Dimensionless' || Right === 'Dimensionless' || Left === Right)
					if (!ok) onerror('Cannot divide incompatible types', node)
				}
			}
			if (node.node === 'func'){
				ok = ok && node.type === node.body.default.type
				if (!ok) onerror('Return type "' + node.type + '" expected', node.body.default)
				node.body.cases.forEach(c => {
					if (c.type !== node.type) {
						ok = false
						onerror('Return type "' + node.type + '" expected', c.value)
					}
				})
			}
			isConsistent = isConsistent && ok
		})
		return isConsistent
	}
};
