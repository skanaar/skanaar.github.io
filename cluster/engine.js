function Engine(canvasId, nodes, _options){
	var options = {
		fps: _options.fps || 30,
		selectEntity: _options.selectEntity || function (){},
		deselectEntity: _options.deselectEntity || function (){}
	}
	var canvas = document.getElementById(canvasId)
	var g = skanaar.Canvas(canvas, {
		mousedown: onMouseDown, 
		mouseup: onMouseUp, 
		mousemove: onMouseMove
	})
	var offset = { x: canvas.width/2, y: canvas.height/2 }
	var scale = { x: 0.8, y: 0.8 }
	var selectedEntity = undefined
	var clickedEntity = undefined
	var mouseDownPos = undefined
	var mouseDownOffset = offset

	var entities = nodes.entities
	var relations = nodes.relations
	var peers = calculatePeers(nodes.relations)

	var paused = false

	pulse(draw, 1000/options.fps)

	function calculatePeers(relations){
		var map = {}
		_.each(relations, function (r){
			map[r.start.id] = map[r.start.id] || []
			map[r.start.id].push(r.end)
			map[r.end.id] = map[r.end.id] || []
			map[r.end.id].push(r.start)
		})
		return map
	}

	function filteredEntities(source, generations){
		var accumulator = []
		function collect(a, generations){
			_.each(peers[a.id], function (sibling){
				accumulator[a.id] = a
				if (accumulator[sibling.id] === undefined && generations)
					collect(sibling, generations-1)
			})
		}
		collect(source, generations)
		return _.values(accumulator)
	}

	function relationsFor(entities){
		return _.flatten(_.map(entities, function (e){
			return _.filter(relations, function (r){
				return r.start === e || r.end === e
			})
		}))
	}

	function onMouseDown(pos){
		var e = pickEntity(pos)
		if (e){
			clickedEntity = e
		} else {
			mouseDownPos = pos
			mouseDownOffset = _.clone(offset)
		}
	}

	function onMouseMove(pos){
		if (mouseDownPos)
			offset = diff(add(mouseDownOffset, pos), mouseDownPos)
	}

	function onMouseUp(pos){
		var e = pickEntity(pos)
		if (clickedEntity && e){
			if (clickedEntity === e){
				options.selectEntity(e)
				selectedEntity = e
				centerSelected()
			}
			else
				nodes.addRelation(clickedEntity, e)
		}
		
		if (_.isEqual(mouseDownPos, pos)){
			options.deselectEntity()
			selectedEntity = undefined
		}
		mouseDownPos = undefined
		clickedEntity = undefined
	}

	function pulse(action, delay){
		var counter = 0
		function tick(){
			action(counter)
			counter++
			setTimeout(tick, delay)
		}
		setTimeout(tick, delay)
	}

	function transform(pos){
		return { x: (pos.x - offset.x)/scale.x, y: (pos.y - offset.y)/scale.y }
	}
	function untransform(pos){
		return { x: scale.x*pos.x + offset.x, y: scale.y*pos.y + offset.y }
	}

	var phi = 3.14*2

	var entityColor = {
		core: 'rgba(10, 120, 20, 0.75)',
		accelerator: 'rgba(100, 20, 128, 0.75)',
		expander: 'rgba(255, 128, 32, 0.75)',
		existing: 'rgba(10, 120, 20, 0.75)',
		supporting: 'rgba(100, 20, 128, 0.75)',
		potential: 'rgba(255, 128, 32, 0.75)'
	}

	function drawEntities(entities){
		g.ctx.lineWidth = 2
		_.each(entities, function (e){
			var grad = g.ctx.createRadialGradient(e.x, e.y, e.r, e.x, e.y, e.r*2)
			grad.addColorStop(0, 'rgba(0,0,0,0.5)')
			grad.addColorStop(1, 'rgba(0,0,0,0)')
			g.ctx.fillStyle = grad
			g.circle(e.x, e.y, e.r*2).fill()

			if (scale.x > 0.2){
				g.ctx.strokeStyle = entityColor[e.properties.type]
				g.circle(e.x, e.y, e.r+5).stroke()
			}

			var grad = g.ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r*2)
			grad.addColorStop(0, entityColor[e.properties.status])
			grad.addColorStop(1, 'rgba(0,0,0,0)')
			g.ctx.fillStyle = grad
			g.circle(e.x, e.y, e.r).fill()

			var alpha = Math.min(1, Math.max(0, scale.x/2-1))

			var p = e.properties
			var m = p.mobility / (p.mobility + p.nutrition + p.building)
			var n = p.nutrition/ (p.mobility + p.nutrition + p.building)
			var b = p.building / (p.mobility + p.nutrition + p.building)
			g.ctx.fillStyle = g.colorNorm(1, 0.5, 0.25, 0.75*alpha)
			g.arc(e.x, e.y, e.r, 0, m*phi).fill()
			g.ctx.fillStyle = g.colorNorm(0.25, 1, 0.5, 0.75*alpha)
			g.arc(e.x, e.y, e.r, m*phi, (m+n)*phi).fill()
			g.ctx.fillStyle = g.colorNorm(0.5, 0.25, 1, 0.75*alpha)
			g.arc(e.x, e.y, e.r, (m+n)*phi, 0).fill()
		})
	}

	function scaleFadedAlpha(){
		return Math.max(0, Math.min(2*scale.x-1, 0.75))
	}

	function drawEntityHuds(entities){
		var alpha = scaleFadedAlpha()
		if (alpha < 0) return
		g.ctx.lineWidth = 1.5
		g.ctx.strokeStyle = 'rgba(255, 255, 255, '+alpha+')'
		g.ctx.fillStyle = 'rgba(255, 255, 255, '+alpha+')'
		g.ctx.font = '10pt Verdana';
		g.ctx.textAlign = 'left';
		_.each(entities, function (e){
			var screenPos = untransform(e)
			g.circle(screenPos.x, screenPos.y, 6).fill()
			g.path([{x:0, y:0}, {x:22, y:-22}], screenPos).stroke()
			g.path([{x:30, y:-25}, {x:110, y:-25}], screenPos).stroke()
			g.circle(screenPos.x+25, screenPos.y-25, 5).stroke()
			g.circle(screenPos.x+115, screenPos.y-25, 5).stroke()
			g.ctx.fillText(e.name, screenPos.x+35, screenPos.y-30)
		})
	}

	function drawRelations(relations){
		var steps = 20
		var margin = 10
		_.each(relations, function (r){
			var e1 = r.start
			var e2 = r.end
			var d = dist(e1, e2) * 0.3
			var v = mult(diff(e2, e1), 1/steps)
			function down(i){ return {x:0, y: d*(1-sq(2*i/steps-1))/2 } }
			function curved(i){ return add(add(e1, mult(v, i)), down(i)) }
			var path = _.times(steps+1, curved)

			g.ctx.lineWidth = 5
			g.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
			g.path(path).stroke()
			g.ctx.lineWidth = 3
			g.ctx.strokeStyle = entityColor[r.type]
			g.path(path).stroke()
		})
	}

	function withPickedEntity(pos, action){
		var e = pickEntity(pos)
		if (e)
			action(e)
	}

	function pickEntity(pos){
		var p = transform(pos)
		var e = _.min(entities, function (e){ return dist(e, p) })
		return (dist(e, p) < e.r + 10) ? e : undefined
	}

	var swe = [[104,496],[80,494],[75,471],[80,461],[55,418],[55,389],[61,382],
	[69,356],[75,340],[70,323],[80,311],[67,294],[67,245],[81,214],[101,218],
	[102,201],[94,198],[108,138],[120,132],	[133,86],[156,53],[159,60],
	[166,37],[194,43],[201,12],[258,61],[264,151],[232,153],[213,190],
	[223,206],[207,229],[162,264],[150,303],[154,337],[181,354],[178,366],
	[163,393],[143,403],[143,448],[129,475],[108,477],[104,496]]

	function draw(tick){
		if (paused) return

		nodes.simulate()

		g.background(15, 45, 45)
		var hw = g.width()/2
		var hh = g.height()/2
		var grad = g.ctx.createRadialGradient(hw, hh, 0, hw, hh, 2*hh)
		grad.addColorStop(0.25, 'rgba(0, 0, 0, 0)')
		grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)')
		g.ctx.fillStyle = grad
		g.ctx.fillRect(0, 0, 2*hw, 2*hh)

		g.ctx.save()
		g.ctx.translate(offset.x, offset.y)
		g.ctx.scale(scale.x, scale.y)

		withPickedEntity(g.mousePos(), function (e){
			g.ctx.fillStyle = g.color255(0,0,0,0.25)
			g.circle(e.x, e.y, e.r+20).fill()
		})

		if (clickedEntity){
			var p = transform(g.mousePos())
			var d = dist(clickedEntity, p)
			var v = normalize(diff(p, clickedEntity))
			if (d>10){
				var path = _.times(Math.round(d/10), function (i){
					return {
						x: clickedEntity.x + i*v.x*10 + 10*v.y*Math.cos(i+tick/2),
						y: clickedEntity.y + i*v.y*10 - 10*v.x*Math.cos(i+tick/2)
					}
				})
				g.ctx.strokeStyle = g.color255(255, 255, 255,0.5)
				g.ctx.lineWidth = 13
				g.path(path).stroke()
			}
		}

		var es = selectedEntity ? filteredEntities(selectedEntity, 2) : entities

		drawRelations(relationsFor(es))
		drawEntities(es)

		if (selectedEntity){
			var e = selectedEntity
			g.ctx.strokeStyle = g.color255(0,0,0,0.5)
			g.ctx.lineWidth = 10/scale.x
			var sidebarEdge = transform({x:g.width()-200, y: 0})
			sidebarEdge.y = e.y
			g.path([{ x: e.x + e.r + 5/scale.x, y: e.y}, sidebarEdge]).stroke()
		}

		g.ctx.restore()

		drawEntityHuds(es)
	}

	function centerSelected(){
		if (selectedEntity){
			nodes.nudge(-selectedEntity.x, -selectedEntity.y)
			offset.x = selectedEntity.x + g.height()/2
			offset.y = selectedEntity.y + g.height()/2
		}
	}

	return {
		togglePause: function (){
			paused = !paused
		},
		select: function (id){
			var e = _.find(entities, function (x){ return x.id == id })
			options.selectEntity(e)
			selectedEntity = e
			centerSelected()
			scale.x = 1
			scale.y = 1
		},
		zoom: function(direction){
			repeat(function(strength){
				var f = 1 - 0.1*strength
				scale.x *= direction > 0 ? f : 1/f
				scale.y *= direction > 0 ? f : 1/f
			}, 5)
		},
		fillScreen: function(){
			var w = canvas.parentElement.offsetWidth
			canvas.setAttribute('width', w)
			canvas.setAttribute('height', w*3/4)
			offset.x = g.width()/2
			offset.y = g.height()/2
		},
		centerSelected: centerSelected,
		filter: function(component){
			$('.filter-option').toggleClass('active', false)
			if (component === filterProperty){
				filterProperty = ''
			} else {
				$('.filter-'+component).toggleClass('active', true)
				filterProperty = component
				filterFactor = 0
				repeat(function (v){ filterFactor = v })
			}
		}
	}
}