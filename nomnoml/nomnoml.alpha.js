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

function layoutDiagram(measurer, config, ast){
	function runDagre(input){
		return dagre.layout()
					.rankSep(config.spacing)
					.nodeSep(config.spacing)
					.edgeSep(config.spacing)
					.rankDir(config.direction)
					.run(input)
	}
	function measureLines(lines){
		if (!lines.length) return { width: 0, height: config.margin }
		var widths = _.map(lines, function (s){ return measurer.textWidth(s) })
		return {
			width: _.max(widths) + 2 * config.margin,
			height: measurer.textHeight() * lines.length + 2 * config.margin
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
			g.addNode(e.name, { label: 'blubb', width: e.width, height: e.height })
		})
		_.each(c.relations, function (r){
			g.addEdge(r.id, r.start, r.end)
		})
		var dLayout = runDagre(g)
		// TODO: extract actual layout
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
	layoutClassifier(ast)
	return ast
}

var layouter = {
	layout: layoutDiagram
}