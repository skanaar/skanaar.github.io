var nomnoml = nomnoml || {}

nomnoml.render = function (graphics, config, compartment){
	function rectIntersection(p1, p2, w, h){
		var v = diff(p1, p2)
		for(var t=1; t>=0; t-= 0.01){
			var p = mult(v, t)
			if(Math.abs(p.x) < w/2 && Math.abs(p.y) < h/2)
				return add(p2, p)
		}
		return p1
	}

	function drawArrow(path, isOpen, target, diamond){
		var size = config.spacing / 30
		var v = diff(path[path.length-2], _.last(path))
		var nv = normalize(v)
		var arrowPoint = rectIntersection(path[path.length-2], _.last(path), target.width, target.height)
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

	function renderNode(node){
		var x = node.x-node.width/2
		var y = node.y-node.height/2
		g.ctx.fillStyle = 'rgba(220, 220, 220, 1)'
		g.ctx.fillRect(x, y, node.width, node.height)
		g.ctx.strokeRect(x, y, node.width, node.height)
		var yDivider = y
		_.each(node.compartments, function (part){
			g.ctx.save()
			g.ctx.translate(x, yDivider)
			renderCompartment(part)
			g.ctx.restore()
			yDivider += part.height
			g.path([{x:x, y:yDivider}, {x:x+node.width, y:yDivider}]).stroke()
		})
	}

	var empty = false, filled = true, diamond = true

	function renderCompartment(compartment){
		g.ctx.save()
		g.ctx.translate(config.margin, config.margin)
		g.ctx.fillStyle = '#000'
		_.each(compartment.lines, function (text, i){
			g.ctx.fillText(text, 0, (1+i)*config.fontSize)
		})
		_.each(compartment.relations, function (r, i){
			var end = _.findWhere(compartment.nodes, {name:r.end})
			var start = _.findWhere(compartment.nodes, {name:r.start})

			if (r.assoc == '-'){
				g.path(r.path).stroke()
			}
			else if (r.assoc == '--'){
				g.dashPath(r.path, 3, 3)
			}
			else if (r.assoc == '->'){
				g.path(r.path).stroke()
				drawArrow(r.path, filled, end)
			}
			else if (r.assoc == '<->'){
				g.path(r.path).stroke()
				drawArrow(r.path, filled, end)
				drawArrow(_.clone(r.path).reverse(), filled, start)
			}
			else if (r.assoc == '<-->'){
				g.dashPath(r.path, 3, 3)
				drawArrow(r.path, filled, end)
				drawArrow(_.clone(r.path).reverse(), filled, start)
			}
			else if (r.assoc == 'o->'){
				g.path(r.path).stroke()
				drawArrow(r.path, filled, end)
				drawArrow(_.clone(r.path).reverse(), empty, start, diamond)
			}
			else if (r.assoc == '+->'){
				g.path(r.path).stroke()
				drawArrow(r.path, filled, end)
				drawArrow(_.clone(r.path).reverse(), filled, start, diamond)
			}
			else if (r.assoc == 'o-'){
				g.path(r.path).stroke()
				drawArrow(_.clone(r.path).reverse(), empty, start, diamond)
			}
			else if (r.assoc == '+-'){
				g.path(r.path).stroke()
				drawArrow(_.clone(r.path).reverse(), filled, start, diamond)
			}
			else if (r.assoc == '-:>'){
				g.path(r.path).stroke()
				drawArrow(r.path, empty, end)
			}
			else if (r.assoc == '-->'){
				g.dashPath(r.path, 3, 3)
				drawArrow(r.path, filled, end)
			}
			else if (r.assoc == '--:>'){
				g.dashPath(r.path, 3, 3)
				drawArrow(r.path, empty, end)
			}
		})
		_.each(compartment.nodes, renderNode)
		g.ctx.restore()
	}

	g.ctx.save()
	g.ctx.translate(0.5, 0.5)

	g.ctx.font = config.fontSize+'pt '+config.font+', Helvetica, sans-serif'
	renderCompartment(compartment)

	g.ctx.restore()
}
