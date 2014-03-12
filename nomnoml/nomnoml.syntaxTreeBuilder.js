

function parseTreeToSyntaxTree(entity){

	var relationId = 0

	function split(list, separator){
		var output = [[]]
		_.each(list, function (e){
			if (e === separator)
				output.push([])
			else
				_.last(output).push(e)
		})
		return output
	}

	function transformCompartment(parts){
		var lines = []
		var rawClassifiers = []
		var relations = []
		_.each(parts, function (p){
			if (typeof p === 'string')
				lines.push(p)
			if (p.start){ // is a relation
				// TODO: store in-relation defined classifiers
				relations.push({
                    id: relationId++,
                    type: 'association',
                    start: p.start.parts[0],
                    end: p.end.parts[0]
                })
            }
			if (p.parts){ // is a classifier
				rawClassifiers.push(p)
            }
		})
		var classifiers = _.map(rawClassifiers, transformItem)

		return nomnoml.Compartment(lines, classifiers, relations)
	}

	function transformItem(entity){
		if (typeof entity === 'string')
			return entity
		if (entity.parts){
			var type = entity.type || 'class'
			var name = entity.parts[0]
			var parts = split(entity.parts, '|')
			var compartments = _.map(parts, transformCompartment)
			return nomnoml.Classifier(type, name, compartments)
		}
		if (entity.start){
			return {
				type: 'virtual',
				name: '[root]'
			}
			return parseTreeToSyntaxTree({
				parts: [entity]
			})
		}
		return undefined
	}

	return transformItem(entity)
}

var astBuilder = {
	apply: parseTreeToSyntaxTree
}