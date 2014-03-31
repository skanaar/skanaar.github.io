var nomnoml = nomnoml || {}

nomnoml.render = function (graphics, config, compartment){

	function renderCompartment(compartment, centerText, level){
		g.ctx.save()
		g.ctx.translate(config.margin, config.margin)
		g.ctx.fillStyle = '#333'
		_.each(compartment.lines, function (text, i){
			g.ctx.textAlign = centerText ? 'center' : 'left'
			g.ctx.fillText(text, centerText ? compartment.width/2 - config.margin : 0, (1+i)*config.fontSize)
		})
		g.ctx.translate(config.diagramMargin, config.diagramMargin)
		_.each(compartment.relations, function (r){ renderRelation(r, compartment) })
		_.each(compartment.nodes, function (n){ renderNode(n, level) })
		g.ctx.restore()
	}

	function renderNode(node, level){
		var x = Math.round(node.x-node.width/2)
		var y = Math.round(node.y-node.height/2)
		var shade = 230 - 20*level
		g.ctx.fillStyle = 'rgb(' + [shade,shade,shade].join() + ')'
		g.ctx.fillRect(x, y, node.width, node.height)
		g.ctx.strokeRect(x, y, node.width, node.height)
		var yDivider = y
		_.each(node.compartments, function (part, i){
			g.ctx.save()
			g.ctx.translate(x, yDivider)
			setFont(config, i ? 'normal' : 'bold')
			renderCompartment(part, i ? false : 'centerText', level+1)
			g.ctx.restore()
			yDivider += part.height
			g.path([{x:x, y:yDivider}, {x:x+node.width, y:yDivider}]).stroke()
		})
	}

	var empty = false, filled = true, diamond = true

	function renderRelation(r, compartment){
		var startNode = _.findWhere(compartment.nodes, {name:r.start})
		var endNode = _.findWhere(compartment.nodes, {name:r.end})

		var start = rectIntersection(r.path[1], _.first(r.path), startNode.width+2, startNode.height+2)
		var end = rectIntersection(r.path[r.path.length-2], _.last(r.path), endNode.width+2, endNode.height+2)

		var path = [start]
		for(var i=1; i<r.path.length-1; i++) path.push(r.path[i])
		path.push(end)

		g.ctx.fillStyle = '#444'
		g.ctx.fillText(r.startLabel, start.x+config.margin, start.y+config.margin+config.fontSize)
		g.ctx.fillText(r.endLabel, end.x+config.margin, end.y-config.margin)

		if (r.assoc == '-'){
			g.path(path).stroke()
		}
		else if (r.assoc == '--'){
			g.dashPath(path, 3, 3)
		}
		else if (r.assoc == '->'){
			g.path(path).stroke()
			drawArrow(path, filled, end)
		}
		else if (r.assoc == '<->'){
			g.path(path).stroke()
			drawArrow(path, filled, end)
			drawArrow(path.reverse(), filled, start)
		}
		else if (r.assoc == '<-->'){
			g.dashPath(path, 3, 3)
			drawArrow(path, filled, end)
			drawArrow(path.reverse(), filled, start)
		}
		else if (r.assoc == 'o->'){
			g.path(path).stroke()
			drawArrow(path, filled, end)
			drawArrow(path.reverse(), empty, start, diamond)
		}
		else if (r.assoc == '+->'){
			g.path(path).stroke()
			drawArrow(path, filled, end)
			drawArrow(path.reverse(), filled, start, diamond)
		}
		else if (r.assoc == 'o-'){
			g.path(path).stroke()
			drawArrow(path.reverse(), empty, start, diamond)
		}
		else if (r.assoc == '+-'){
			g.path(path).stroke()
			drawArrow(path.reverse(), filled, start, diamond)
		}
		else if (r.assoc == '-:>'){
			g.path(path).stroke()
			drawArrow(path, empty, end)
		}
		else if (r.assoc == '-->'){
			g.dashPath(path, 3, 3)
			drawArrow(path, filled, end)
		}
		else if (r.assoc == '--:>'){
			g.dashPath(path, 3, 3)
			drawArrow(path, empty, end)
		}
	}

	function rectIntersection(p1, p2, w, h){
		var v = diff(p1, p2)
		for(var t=1; t>=0; t-= 0.01){
			var p = mult(v, t)
			if(Math.abs(p.x) < w/2 && Math.abs(p.y) < h/2)
				return add(p2, p)
		}
		return p1
	}

	function drawArrow(path, isOpen, arrowPoint, diamond){
		var size = config.spacing / 30
		var v = diff(path[path.length-2], _.last(path))
		var nv = normalize(v)
		var arrowBase = add(arrowPoint, mult(nv, (diamond ? 7 : 10)*size))
		var t = rot(nv)
		var arrowButt = (diamond) ? add(arrowPoint, mult(nv, 14*size))
				: (isOpen && !config.fillArrows) ? add(arrowPoint, mult(nv, 5*size)) : arrowBase
		var arrow = [
			add(arrowBase, mult(t, 4*size)),
			arrowButt,
			add(arrowBase, mult(t, -4*size)),
			arrowPoint,
			add(arrowBase, mult(t, 4*size))
		]
		g.ctx.fillStyle = isOpen ? '#111' : '#fff'
		var ctx = g.path(arrow).fill().stroke()
	}

	g.ctx.save()
	g.ctx.translate(0.5, 0.5)
	g.ctx.lineWidth = config.lineWidth
	g.ctx.lineJoin = 'round'
	renderCompartment(compartment, false, 0)
	g.ctx.restore()
}
