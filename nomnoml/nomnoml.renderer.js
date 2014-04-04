var nomnoml = nomnoml || {}

nomnoml.render = function (graphics, config, compartment){

	var margin = config.margin
	var g = graphics

	function renderCompartment(compartment, centerText, level){
		g.ctx.save()
		g.ctx.translate(margin, margin)
		g.ctx.fillStyle = '#333'
		_.each(compartment.lines, function (text, i){
			g.ctx.textAlign = centerText ? 'center' : 'left'
			var x = centerText ? compartment.width/2 - margin : 0
			g.ctx.fillText(text, x, (0.5+(i+.5)*config.leading)*config.fontSize)
		})
		g.ctx.translate(config.diagramMargin, config.diagramMargin)
		_.each(compartment.relations, function (r){ renderRelation(r, compartment) })
		_.each(compartment.nodes, function (n){ renderNode(n, level) })
		g.ctx.restore()
	}

	function textStyle(node, line){
		if (line === 0){
			switch (node.type){
				case 'CLASS': return { bold: true, center: true }
				case 'FRAME': return { bold: false, center: false, frameHeader: true }
				case 'ABSTRACT': return { italic: true, bold: true, center: true}
			}
		}
		return {}
	}

	function renderNode(node, level){
		var x = Math.round(node.x-node.width/2)
		var y = Math.round(node.y-node.height/2)
		var shade = config.fill[level] || _.last(config.fill)
		g.ctx.fillStyle = shade
		if (node.type === 'NOTE'){
			g.path([
				{x: x, y: y},
				{x: x+node.width-margin, y: y},
				{x: x+node.width, y: y+margin},
				{x: x+node.width, y: y+node.height},
				{x: x, y: y+node.height},
				{x: x, y: y}
			]).fill().stroke()
			g.path([
				{x: x+node.width-margin, y: y},
				{x: x+node.width-margin, y: y+margin},
				{x: x+node.width, y: y+margin}
			]).stroke()
		} else if (node.type === 'PACKAGE') {
			var headHeight = node.compartments[0].height
			g.ctx.fillRect(x, y+headHeight, node.width, node.height-headHeight)
			g.ctx.strokeRect(x, y+headHeight, node.width, node.height-headHeight)
			var w = g.ctx.measureText(node.id).width + 2*margin
			g.path([
				{x:x, y:y+headHeight},
				{x:x, y:y},
				{x:x+w, y:y},
				{x:x+w, y:y+headHeight}
		    ]).fill().stroke()
		} else {
			g.ctx.fillRect(x, y, node.width, node.height)
			g.ctx.strokeRect(x, y, node.width, node.height)
		}
		var yDivider = y
		_.each(node.compartments, function (part, i){
			g.ctx.save()
			g.ctx.translate(x, yDivider)
			var s = textStyle(node, i)
			setFont(config, s.bold ? 'bold' : 'normal', s.italic)
			renderCompartment(part, s.center, level+1)
			g.ctx.restore()
			yDivider += part.height
			if (node.type === 'FRAME' && i === 0){
				var w = g.ctx.measureText(node.id).width + part.height/2 + margin
				g.path([
					{x:x, y:yDivider},
					{x:x+w-part.height/2, y:yDivider},
					{x:x+w, y:yDivider-part.height/2},
					{x:x+w, y:yDivider-part.height}
			    ]).stroke()
			} else
				g.path([{x:x, y:yDivider}, {x:x+node.width, y:yDivider}]).stroke()
		})
	}

	function strokePath(p){
		function enhanceEnd(list){
			var len = p.length
			var fac = Math.max(config.spacing, dist(p[0], _.last(p))/2)
			p[len-2] = add(p[len-1], mult(normalize(diff(p[len-2], p[len-1])), fac))
		}
		if (config.edges === 'curved' && p.length === 4){
			enhanceEnd(p)
	        g.ctx.beginPath()
	        g.ctx.moveTo(p[0].x, p[0].y)
	        g.ctx.bezierCurveTo(p[1].x, p[1].y, p[2].x, p[2].y, p[3].x, p[3].y)
	        g.ctx.stroke()
		}
		else if (config.edges === 'curved' && p.length === 3){
			enhanceEnd(p)
	        g.ctx.beginPath()
	        g.ctx.moveTo(p[0].x, p[0].y)
	        g.ctx.quadraticCurveTo(p[1].x, p[1].y, p[2].x, p[2].y)
	        g.ctx.stroke()
		}
		else {
			g.path(p).stroke()
		}
	}

	var empty = false, filled = true, diamond = true

	function renderRelation(r, compartment){
		var startNode = _.findWhere(compartment.nodes, {name:r.start})
		var endNode = _.findWhere(compartment.nodes, {name:r.end})

		var start = rectIntersection(r.path[1], _.first(r.path), startNode)
		var end = rectIntersection(r.path[r.path.length-2], _.last(r.path), endNode)

		var path = [start]
		for(var i=1; i<r.path.length-1; i++) path.push(r.path[i])
		path.push(end)

		g.ctx.fillStyle = '#444'
		g.ctx.fillText(r.startLabel, start.x+margin, start.y+margin+config.fontSize)
		g.ctx.fillText(r.endLabel, end.x+margin, end.y-margin)

		var dash = 3*config.lineWidth

		if (r.assoc == '-'){
			strokePath(path)
		}
		else if (r.assoc == '--'){
			g.dashPath(path, dash, dash)
		}
		else if (r.assoc == '->'){
			strokePath(path)
			drawArrow(path, filled, end)
		}
		else if (r.assoc == '<->'){
			strokePath(path)
			drawArrow(path, filled, end)
			drawArrow(path.reverse(), filled, start)
		}
		else if (r.assoc == '<-->'){
			g.dashPath(path, dash, dash)
			drawArrow(path, filled, end)
			drawArrow(path.reverse(), filled, start)
		}
		else if (r.assoc == 'o->'){
			strokePath(path)
			drawArrow(path, filled, end)
			drawArrow(path.reverse(), empty, start, diamond)
		}
		else if (r.assoc == '+->'){
			strokePath(path)
			drawArrow(path, filled, end)
			drawArrow(path.reverse(), filled, start, diamond)
		}
		else if (r.assoc == 'o-'){
			strokePath(path)
			drawArrow(path.reverse(), empty, start, diamond)
		}
		else if (r.assoc == '+-'){
			strokePath(path)
			drawArrow(path.reverse(), filled, start, diamond)
		}
		else if (r.assoc == '-:>'){
			strokePath(path)
			drawArrow(path, empty, end)
		}
		else if (r.assoc == '-->'){
			g.dashPath(path, dash, dash)
			drawArrow(path, filled, end)
		}
		else if (r.assoc == '--:>'){
			g.dashPath(path, dash, dash)
			drawArrow(path, empty, end)
		}
	}

	function rectIntersection(p1, p2, rect){
		var v = diff(p1, p2)
		for(var t=1; t>=0; t-= 0.01){
			var p = mult(v, t)
			if(Math.abs(p.x) <= rect.width/2 && Math.abs(p.y) <= rect.height/2)
				return add(p2, p)
		}
		return p1
	}

	function drawArrow(path, isOpen, arrowPoint, diamond){
		var size = config.spacing / 30
		var v = diff(path[path.length-2], _.last(path))
		var nv = normalize(v)
		function getArrowBase(s){ return add(arrowPoint, mult(nv, s*size)) }
		var arrowBase = getArrowBase(diamond ? 7 : 10)
		var t = rot(nv)
		var arrowButt = (diamond) ? getArrowBase(14)
				: (isOpen && !config.fillArrows) ? getArrowBase(5) : arrowBase
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

	function snapToPixels(){
		if (config.lineWidth % 2 > 0)
			g.ctx.translate(0.5, 0.5)
	}

	g.ctx.save()
	g.ctx.lineWidth = config.lineWidth
	g.ctx.lineJoin = 'round'
	snapToPixels()
	renderCompartment(compartment, false, 0)
	g.ctx.restore()
}
