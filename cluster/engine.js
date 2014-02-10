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
	var scale = { x: 0.3, y: 0.15 }
	var selectedEntity = undefined
	var clickedEntity = undefined
	var mouseDownPos = undefined
	var mouseDownOffset = offset

	var entities = nodes.entities
	var relations = nodes.relations

	pulse(draw, 1000/options.fps)

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

	function drawEntities(){
		g.ctx.lineWidth = 10
		_.each(entities, function (e){
			var alpha = nodes.forceScaling(e)
			g.ctx.fillStyle = 'rgba(255, 255, 255, '+0.75*alpha+')'
			g.circle(e.x, e.y, e.r+10).fill()
			g.ctx.fillStyle = g.colorNorm(e.properties.r, e.properties.g, e.properties.b, 0.5*alpha)
			g.circle(e.x, e.y, e.r).fill()
		})
	}

	function drawEntityHuds(){
		if (scale.x < 0.3) return
		g.ctx.lineWidth = 10
		g.ctx.font = '10pt Verdana';
		g.ctx.textAlign = 'center';
		_.each(entities, function (e){
			var screenPos = untransform(e)
			g.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
			g.ctx.fillText(e.name, screenPos.x+1, screenPos.y+1)
			g.ctx.fillStyle = 'rgba(255, 255, 255, 0.9975)'
			g.ctx.fillText(e.name, screenPos.x, screenPos.y)
		})
	}

	function drawRelations(){
		var steps = 8
		var margin = 10
		g.ctx.lineWidth = 5
		relations.each(function (e1, e2, r){
			var alpha = nodes.forceScaling(e1, e2)
			if (r.isAbstract){
				g.ctx.strokeStyle = 'rgba(0, 0, 0, 0.01)'
				g.ctx.fillStyle = 'rgba(0, 0, 0, 0.01)'
			}
			else{
				g.ctx.strokeStyle = 'rgba(255, 255, 255, '+alpha/2+')'
				g.ctx.fillStyle = 'rgba(255, 255, 255, '+alpha/2+')'
			}

			var d = dist(e1, e2)
			var v = mult(diff(e2, e1), 1/steps)
			function down(i){ return {x:0, y: d*(1-sq(2*i/steps-1))/2 } }
			var path = _.times(steps+1, function (i){ return add(add(e1, mult(v, i)), down(i)) })

			//_.each(path, function (p){ g.circle(p.x, p.y, 5).fill() })
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

	var swe = [[104,496],[80,494],[75,471],[80,461],[55,418],[55,389],[61,382],[69,356],[75,340],
	[70,323],[80,311],[67,294],[67,245],[81,214],[101,218],[102,201],[94,198],[108,138],[120,132],
	[133,86],[156,53],[159,60],[166,37],[194,43],[201,12],[258,61],[264,151],[232,153],[213,190],
	[223,206],[207,229],[162,264],[150,303],[154,337],[181,354],[178,366],[163,393],[143,403],
	[143,448],[129,475],[108,477],[104,496]]

	function draw(tick){
		nodes.simulate()

		g.background(150, 150, 150)

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

		drawRelations()
		drawEntities()

		if (selectedEntity){
			var e = selectedEntity
			g.ctx.strokeStyle = g.color255(0,0,0,0.5)
			g.ctx.lineWidth = 10/scale.x
			var sidebarEdge = transform({x:g.width()-200, y: 0})
			sidebarEdge.y = e.y
			g.path([{ x: e.x + e.r + 5/scale.x, y: e.y}, sidebarEdge]).stroke()
		}

		g.ctx.restore()
		drawEntityHuds()
	}

	return {
		select: function (id){
			var e = _.find(entities, function (x){ return x.id == id })
			options.selectEntity(e)
			selectedEntity = e
		},
		zoom: function(direction){
			repeat(function(strength){
				var f = 1 - 0.2*strength
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
		centerSelected: function(){
			if (selectedEntity){
				nodes.nudge(-selectedEntity.x, -selectedEntity.y)
				offset.x = selectedEntity.x + g.height()/2
				offset.y = selectedEntity.y + g.height()/2
				scale.x = 1
				scale.y = 0.5
			}
		},
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
		},
		paint: function(component){
			if (selectedEntity){
				selectedEntity.properties.r *= 0.25
				selectedEntity.properties.g *= 0.25
				selectedEntity.properties.b *= 0.25
				selectedEntity.properties[component] = 1
			}
		}
	}
}