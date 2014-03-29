var nomnoml = nomnoml || {}

nomnoml.parse = function (x){
	var isDirective = function (line){ return line.trim()[0] === '#' }
	var syntaxTypes = _.partition(x.split('\n'), isDirective)
	var pureDiagramCode = syntaxTypes[1].join('\n').trim()
	var directives = _.object(syntaxTypes[0].map(function (line){
		return line.trim().substring(1).split(':')
	}))
	var ast = nomnoml.transformParseIntoSyntaxTree(nomnoml.intermediateParse(pureDiagramCode))
	ast.directives = directives
	return ast
}

nomnoml.intermediateParse = function (x){
	return parser.parse(x)
}

nomnoml.transformParseIntoSyntaxTree = function (entity){

	var relationId = 0

	function transformCompartment(parts){
		var lines = []
		var rawClassifiers = []
		var relations = []
		_.each(parts, function (p){
			if (typeof p === 'string')
				lines.push(p)
			if (p.assoc){ // is a relation
				rawClassifiers.push(p.start)
				rawClassifiers.push(p.end)
				relations.push({
                    id: relationId++,
                    assoc: p.assoc,
                    start: p.start.parts[0][0],
                    end: p.end.parts[0][0],
                    startLabel: p.startLabel,
                    endLabel: p.endLabel
                })
            }
			if (p.parts){ // is a classifier
				rawClassifiers.push(p)
            }
		})
		var allClassifiers = _.map(rawClassifiers, transformItem)
		var noDuplicates = _.map(_.groupBy(allClassifiers, 'name'), function (cList){
			return _.max(cList, function (c){ return c.compartments.length })
		})

		return nomnoml.Compartment(lines, noDuplicates, relations)
	}

	function transformItem(entity){
		if (typeof entity === 'string')
			return entity
		if (_.isArray(entity))
			return transformCompartment(entity)
		if (entity.parts){
			var compartments = _.map(entity.parts, transformCompartment)
			return nomnoml.Classifier(entity.type, entity.id, compartments)
		}
		return undefined
	}

	return transformItem(entity)
}