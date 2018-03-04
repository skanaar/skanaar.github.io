
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
	fallbackFunction: funcDef('noaction', 'MissingFunctionReturnType', []),
	globalScope: {
		node: 'body',
		funcs: [
			funcDef('noaction', 'Command', []),
			funcDef('price', 'Sek', ['price:Stock']),
			funcDef('count', 'Units', ['holding:Holding']),
			funcDef('have_orders', 'Bool', ['stock:Stock']),
			funcDef('average', 'Sek', ['stock:Stock','days:Days']),
			funcDef('buy', 'Command', ['stock:Stock','units:Units','price:Sek','period:Days']),
			funcDef('sell', 'Command', ['stock:Stock','units:Units','price:Sek','period:Days']),
		]
	},

	parse: function (source, onerror){
		try {
			return parser.parse(source)
		} catch (e) {
			onerror(e.message, {loc:{first_line: 0, first_column:0}})
			throw new Error('Parse error')
		}
	},

	walkTree: function(node, enter, exit) {
		function visit(e) {
			enter(e, node)
			finscript.walkTree(e, enter, exit)
			exit(e, node)
		}
		if (node.node === 'invoke')
			node.args.forEach(visit)
		if (node.node === 'body') {
			node.lets.forEach(visit)
			node.cases.forEach(visit)
			node.funcs.forEach(visit)
			visit(node.default)
		}
		if (node.node === 'operator'){
			visit(node.a)
			visit(node.b)
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

	markupTypes: function(root, onerror) {
		function findLet(node, scope) {
			if (!scope) {
				onerror('Undeclared constant "' + node.name + '"', node)
				throw new Error('Parse error')
			}
			var foundLet = scope.lets.find(e => e.name === node.name)
			var foundParam = scope.params.find(e => e.name === node.name)
			return foundLet || foundParam || findLet(node, scope.parentScope)
		}
		function findFunc(node, scope) {
			if (!scope) {
				onerror('Undeclared function "' + node.name + '"', node)
				throw new Error('Parse error')
			}
			var found = scope.funcs.find(e => e.name === node.name)
			return found || findFunc(node, scope.parentScope)
		}
		finscript.walkTree(root, function (){}, function (node, parent) {
			if (node.node === 'invoke'){
				var fn = findFunc(node, node.scope)
				node.func = fn
				node.type = fn.type
			}
			if (node.node === 'deref') {
				var ref = findLet(node, node.scope)
				node.ref = ref
				node.type = ref.type
			}
			if (node.node === 'operator'){
				if (node.operator === '<' || node.operator === '>') {
					node.type = 'Bool'
				}
				if (node.operator === '+' || node.operator === '-') {
					node.type = node.a.type
				}
				if (node.operator === '*' || node.operator === '/') {
					node.type = (node.a.type === 'Factor') ? node.b.type : node.a.type
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
						if (actual === expected) continue
						ok = false
						onerror('Argument '+(1+i)+' expect "'+expected+'" got "'+actual+'"', node)
					}
				}
			}
			if (node.node === 'operator'){
				if (node.operator === '<' || node.operator === '>') {
					ok = node.a.type === node.b.type
					if (!ok) onerror('Cannot compare two different types', node)
				}
				if (node.operator === '+' || node.operator === '-') {
					ok = node.a.type === node.b.type
					if (!ok) onerror('Cannot add/subtract two different types', node)
				}
				if (node.operator === '*' || node.operator === '/') {
					var oneIsFactor = (node.a.type === 'Factor' || node.b.type === 'Factor')
					ok = (oneIsFactor || node.a.type === node.b.type)
					if (!ok) onerror('Cannot multiply incompatible types', node)
				}
			}
			if (node.node === 'func'){
				ok = ok && node.type === node.body.default.type
				ok = ok && node.body.cases.every(c => c.type === node.type)
				if (!ok) onerror('All return points must have type "' + node.type + '"', node)
			}
			isConsistent = isConsistent && ok
		})
		return isConsistent
	}
};
