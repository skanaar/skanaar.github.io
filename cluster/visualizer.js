function Visualizer(){

	var entityColor = {
		core: 'rgba(255, 64, 0, 0.5)',
		accelerator: 'rgba(200, 40, 255, 0.5)',
		expander: 'rgba(200, 255, 0, 0.5)',
		existing: 'rgba(210, 100, 20, 1)',
		supporting: 'rgba(10, 170, 210, 1)',
		potential: 'rgba(60, 180, 10, 1)',
		none: 'rgba(0, 0, 0, 0)'
	}

	var relationColor = {
		participant: hsl(0.0, 0.5, 1, 0.5),
		provider:    hsl(0.2, 0.5, 1, 0.5),
		catalyst:    hsl(0.4, 0.5, 1, 0.5),
		potential:   hsl(0.6, 0.5, 1, 0.5),
		alternative: hsl(0.8, 0.5, 1, 0.5)
	}

	function hsl(hue, sat, lit, alpha){
		function component(v){
			return lit*(1-sat + sat*sq(Math.cos(6.283*v)/2 + 0.5))
		}
		var r = Math.round(255 * component(hue))
		var g = Math.round(255 * component(hue-1/3))
		var b = Math.round(255 * component(hue+1/3))
		return 'rgba(' + [r, g, b, (alpha === undefined ? 1 : alpha)].join() + ')'
	}

	function drawEntities(entities, scale, radiusOf){
		var phi = 3.14*2
		_.each(entities, function (e){
			//drop shadow
			var radius = radiusOf(e)
			g.ctx.fillStyle = g.radialGradient(e.x, e.y, radius, radius*2, {
				0: 'rgba(0,0,0,0.25)',
				1: 'rgba(0,0,0,0)'
			})
			g.circle(e.x, e.y, radius*2).fill()

			// border
			if (scale.x > 0.2){
				g.ctx.lineWidth = 2
				g.ctx.strokeStyle = entityColor[e.type]
				g.circle(e.x, e.y, radius+3).stroke()
			}

			// core
			g.ctx.fillStyle = g.radialGradient(e.x, e.y, 0, radius*3, {
				0: entityColor[e.status],
				1: 'rgba(0,0,0,0)'
			})
			g.circle(e.x, e.y, radius).fill()

			// pie pieces
			var alpha = Math.min(1, Math.max(0, scale.x/2-1))
			var m = e.mobility / (e.mobility + e.nutrition + e.building)
			var n = e.nutrition/ (e.mobility + e.nutrition + e.building)
			var b = e.building / (e.mobility + e.nutrition + e.building)
			g.ctx.fillStyle = g.colorNorm(1, 0.5, 0.25, 0.75*alpha)
			g.arc(e.x, e.y, radius, 0, m*phi).fill()
			g.ctx.fillStyle = g.colorNorm(0.25, 1, 0.5, 0.75*alpha)
			g.arc(e.x, e.y, radius, m*phi, (m+n)*phi).fill()
			g.ctx.fillStyle = g.colorNorm(0.5, 0.25, 1, 0.75*alpha)
			g.arc(e.x, e.y, radius, (m+n)*phi, 0).fill()
		})
	}

	function drawEntityHuds(entities, scale){
		var alpha = Math.max(0, Math.min(2*scale.x-1, 0.75))
		if (alpha < 0) return
		g.ctx.lineWidth = 1.5
		g.ctx.strokeStyle = 'rgba(255, 255, 255, '+alpha+')'
		g.ctx.fillStyle = 'rgba(255, 255, 255, '+alpha+')'
		g.ctx.font = '10pt Verdana';
		g.ctx.textAlign = 'left';
		_.each(entities, function (e){
			var screenPos = untransform(e)
			var len = Math.max(g.ctx.measureText(e.name).width, g.ctx.measureText(e.company+'()').width)
			g.circle(screenPos.x, screenPos.y, 6).fill()
			g.path([{x:4, y:-4}, {x:32, y:-32}], screenPos).stroke()
			g.path([{x:40, y:-35}, {x:50+len, y:-35}], screenPos).stroke()
			g.circle(screenPos.x+35, screenPos.y-35, 5).stroke()
			g.circle(screenPos.x+55+len, screenPos.y-35, 5).stroke()
			g.ctx.fillText(e.name, screenPos.x+45, screenPos.y-40)
			g.ctx.fillText('('+e.company+')', screenPos.x+45, screenPos.y-21)
		})
	}

	function drawRelations(relations, scale){
		var steps = 20
		var margin = 10
		_.each(relations, function (r){
			var e1 = r.start
			var e2 = r.end
			var d = dist(e1, e2) * 0.3 * scale.x/scale.y
			var v = mult(diff(e2, e1), 1/steps)
			function down(i){ return {x:0, y: d*(1-sq(2*i/steps-1))/2 } }
			function curved(i){ return add(add(e1, mult(v, i)), down(i)) }
			var path = _.times(steps+1, curved)

			g.ctx.lineWidth = 4
			g.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
			g.path(path).stroke()
			g.ctx.lineWidth = 1.5
			g.ctx.strokeStyle = relationColor[r.type]
			g.path(path).stroke()
		})
	}

	function vingette(){
		var hw = g.width()/2
		var hh = g.height()/2
		var grad = g.radialGradient(hw, hh, 0, 2*hh, {
			0.25: 'rgba(0, 0, 0, 0)',
			1: 'rgba(0, 0, 0, 0.2)'
		})
		g.ctx.fillStyle = grad
		g.ctx.fillRect(0, 0, 2*hw, 2*hh)
	}

	var g
	var transform
	var untransform

	function draw(graphics, data, interactions, scale, offset, tick, coords){
		g = graphics
		transform = coords.transform
		untransform = coords.untransform

		function radiusOf(entity){
			return interactions.centralEntity === entity ? 60 : 30
		}

		g.ctx.clearRect(0, 0, g.width(), g.height())
		vingette()

		g.ctx.save()
		
		g.ctx.translate(g.width()/2, g.height()/2)
		g.ctx.scale(scale.x, scale.y)
		g.ctx.translate(-offset.x, -offset.y)
		
		if (interactions.selectedEntity){
			g.ctx.fillStyle = '#174140'
			var e = interactions.selectedEntity
			g.circle(e.x, e.y, radiusOf(e)+20).fill()
		}

		if (interactions.clickedEntity){
			var p = transform(g.mousePos())
			var d = dist(interactions.clickedEntity, p)
			var v = normalize(diff(p, interactions.clickedEntity))
			if (d>10){
				var path = _.times(Math.round(d/10), function (i){
					return {
						x: interactions.clickedEntity.x + i*v.x*10 + 10*v.y*Math.cos(i+tick/2),
						y: interactions.clickedEntity.y + i*v.y*10 - 10*v.x*Math.cos(i+tick/2)
					}
				})
				g.ctx.strokeStyle = g.color255(255, 255, 255,0.5)
				g.ctx.lineJoin = 'round'
				g.ctx.lineWidth = 13
				g.path(path).stroke()
			}
		}

		drawRelations(data.relations, scale, offset)
		drawEntities(data.entities, scale, radiusOf)

		if (interactions.selectedEntity){
			var e = interactions.selectedEntity
			g.ctx.strokeStyle = '#174140'
			g.ctx.lineWidth = 10/scale.x
			var sidebarEdge = transform({x:g.width()-200, y: 0})
			sidebarEdge.y = e.y
			g.path([{ x: e.x + radiusOf(e) + 5/scale.x, y: e.y}, sidebarEdge]).stroke()
		}

		g.ctx.restore()

		drawEntityHuds(data.entities, scale)
	}

	return { draw: draw }
}