

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
			if (p.assoc){ // is a relation
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