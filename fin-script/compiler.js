function walkTree(node, enter, exit) {
  function visit(e) {
  	enter(e, node)
  	walkTree(e, enter, exit)
  	exit(e, node)
  }
  if (node.node === 'invoke')
    node.args.forEach(visit)
  if (node.node === 'body') {
    node.lets.forEach(visit)
    node.cases.forEach(visit)
    node.funcs.forEach(visit)
  }
  if (node.node === 'operator'){
    visit(node.a)
    visit(node.b)
  }
  if (node.node === 'func') {
    node.params.forEach(visit)
    visit(node.default)
    visit(node.body)
  }
  if (node.node === 'case'){
    visit(node.predicate)
    visit(node.value)
  }
}

function populateScopes(root) {
	root.scope = root
	walkTree(root, function (node, parent) {
		if (node.node === 'body') {
			node.scope = node
			node.parent = parent.scope
		} else {
			node.scope = parent.scope
		}
	}, function (){})
}

function findInScope(scope, kind, name) {
	return scope[kind].find(e => e.name === name) || findInScope(scope.parent, kind, name)
}

function markupTypes(root) {
	walkTree(root, function (){}, function (node, parent) {
		if (node.node === 'invoke'){
			var fn = findInScope(node.scope, 'funcs', node.name)
			node.func = fn
			node.type = fn.type
		}
		if (node.node === 'deref') {
			var ref = findInScope(node.scope, 'lets', node.name)
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
			node.type = 'Sek'
		}
	})
}

function checkTypes(root) {
	var ok = true
	walkTree(root, function (){}, function (node, parent) {
		var isInitiallyOk = ok
		if (node.node === 'invoke'){
			ok = ok && Object.keys(node.func.args)
				.every(i => node.func.args[i].type === node.params[i].type)
		}
		if (node.node === 'operator'){
			if (node.operator === '<' || node.operator === '>') {
				ok = ok && node.a.type === node.b.type
			}
			if (node.operator === '+' || node.operator === '-') {
				ok = ok && node.a.type === node.b.type
			}
			if (node.operator === '*' || node.operator === '/') {
				var oneIsFactor = (node.a.type === 'Factor' || node.b.type === 'Factor')
				ok = ok && (oneIsFactor || node.a.type === node.b.type)
			}
		}
		if (node.node === 'func'){
			ok = ok && node.type === node.default.type
			ok = ok && node.body.cases.every(c => c.type === node.type)
		}
		if (isInitiallyOk && !ok) console.log('Culprit', node)
	})
	return ok
}
