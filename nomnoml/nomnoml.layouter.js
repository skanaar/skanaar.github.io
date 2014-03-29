var nomnoml = nomnoml || {}

nomnoml.Classifier = function (type, name, compartments){
	return {
        type: type,
        name: name,
        compartments: compartments
    }
}
nomnoml.Compartment = function (lines, nodes, relations){
	return {
        lines: lines,
        nodes: nodes,
        relations: relations
    }
}

nomnoml.layout = function (measurer, config, ast){
	function runDagre(input){
		return dagre.layout()
					.rankSep(config.spacing)
					.nodeSep(config.spacing)
					.edgeSep(config.spacing)
					.rankDir(config.direction)
					.run(input)
	}
	function measureLines(lines){
		if (!lines.length)
			return { width: 0, height: config.margin }
		return {
			width: _.max(_.map(lines, measurer.textWidth)) + 2*config.margin,
			height: measurer.textHeight() * lines.length + 2*config.margin
		}
	}
	function layoutCompartment(c){
		var textSize = measureLines(c.lines)
		c.width = textSize.width
		c.height = textSize.height

		if (!c.nodes.length && !c.relations.length)
			return

		_.each(c.nodes, layoutClassifier)

		var g = new dagre.Digraph()
		_.each(c.nodes, function (e){
			g.addNode(e.name, { width: e.width, height: e.height })
		})
		_.each(c.relations, function (r){
			g.addEdge(r.id, r.start, r.end)
		})
		var dLayout = runDagre(g)

		var rels = _.indexBy(c.relations, 'id')
		var nodes = _.indexBy(c.nodes, 'name')
		function toPoint(o){ return {x:o.x, y:o.y} }
		dLayout.eachNode(function(u, value) {
			nodes[u].x = value.x
			nodes[u].y = value.y
		})
		dLayout.eachEdge(function(e, u, v, value) {
			var start = nodes[u], end = nodes[v]
			rels[e].path = _.map(_.flatten([start, value.points, end]), toPoint)
		})
		var graph = dLayout.graph()

		c.width = Math.max(textSize.width, graph.width) + 2 * config.margin
		c.height = textSize.height + graph.height + config.margin
	}
	function layoutClassifier(clas){
		_.each(clas.compartments, layoutCompartment)
		clas.width = _.max(_.pluck(clas.compartments, 'width'))
		clas.height = _.sum(clas.compartments, 'height')
		clas.x = clas.width/2
		clas.y = clas.height/2
		_.each(clas.compartments, function(co){ co.width = clas.width })
	}
	layoutCompartment(ast)
	return ast
}