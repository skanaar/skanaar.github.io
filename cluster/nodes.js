function initNodes(canvasId, options){
	var canvas = document.getElementById(canvasId)
	var g = skanaar.Canvas(canvas, { mouseup: onMouseUp })
	var offset = { x: canvas.width/2, y: canvas.height/2 }
	var scale = { x: 0.4, y: 0.4 }
	var clusterColor = { r: 0, g: 0, b: 0 }
	var entities = _.times(40, Entity)
	var tight = 1

	window.addEventListener('resize', _.throttle(fillScreen, 750, {leading: false}))
	window.addEventListener('wheel', zoom)
	fillScreen()
	_.times(5, simulate)
	pulse(draw, 1000/(options.fps || 30))

	function fillScreen(){
		var w = canvas.parentElement.offsetWidth
		canvas.setAttribute('width', w)
		canvas.setAttribute('height', w*3/4)
		offset.x = g.width()/2
		offset.y = g.height()/2
	}

	function poorMansHSL(hue, sat, lit){
		function component(v){
			return lit*(1-sat + sat*sq(Math.cos(6.283*v)/2 + 0.5))
		}
		return {
			r: component(hue),
			g: component(hue-1/3),
			b: component(hue+1/3)
		}
	}

	function zoom(wheelEvent){
		repeat(function(strength){
			var f = 1 - 0.03*sq(strength)
			scale.x *= wheelEvent.deltaY > 0 ? f : 1/f
			scale.y *= wheelEvent.deltaY > 0 ? f : 1/f
		})
	}

	function Entity(){
		var r = _.random(20,30)
		return {
			x: _.random(-100, 100),
			y: _.random(-100, 100),
			fx: 0,
			fy: 0,
			r: r,
			charge: poorMansHSL(Math.random(), 1, 1)
		}
	}

	function onMouseUp(pos){
		var e = pickEntity(pos)
		if (e){
			clusterColor = e.charge
		}
	}

	function repeat(action, repetitions){
		var r = repetitions || 10
		for(var i=r; i>0; i--)
			setTimeout(function (){ action(1-i/r) }, 20*i)
	}

	function pulse(action, delay){
		function tick(){
			action()
			setTimeout(tick, delay)
		}
		setTimeout(tick, delay)
	}

	function sq(x){ return x*x }
	function dist(x,y,a,b){
		return arguments.length === 4 ? Math.sqrt(sq(x-a) + sq(y-b)) : dist(x.x, x.y, y.x, y.y)
	}
	function diff(a,b){ return { x: a.x - b.x, y: a.y - b.y } }
	function normalize(v){
		var d = Math.sqrt(sq(v.x) + sq(v.y))
		return { x: v.x/d, y: v.y/d }
	}

	function eachRelation(list, action){
		for(var i=0, len=list.length; i<len; i++)
			for(var j=0; j<len; j++)
				if (i !== j)
					action(list[i], list[j])
	}

	function eachPair(list, action){
		for(var i=0, len=list.length; i<len; i++)
			for(var j=i; j<len; j++)
				if (i !== j)
					action(list[i], list[j])
	}

	function simulate(){
		var dampening = 0.8
		_.each(entities, function (e){
			e.x += e.fx
			e.y += e.fy
			e.fx *= dampening
			e.fy *= dampening
		})

		var populationWeight = 20/entities.length
		var surfaceRepulsion = 0.014
		var springiness = 0.00005 * populationWeight
		var repulsion = 50
		var naturalSeparation = 50 * populationWeight
		eachRelation(entities, function (e, f){
			var d = dist(e, f)
			var springForce = springiness*(d - naturalSeparation)*sq(chargeAttraction(e, f)/3)
			var repulsForce = repulsion/(1+sq(d))
			var surfacForce = (d > e.r + f.r + 30) ? 0 : (surfaceRepulsion*(e.r + f.r + 30 - d))
			e.fx += (e.x - f.x)*(surfacForce + repulsForce - springForce)
			e.fy += (e.y - f.y)*(surfacForce + repulsForce - springForce)
		})

		var universalConstant = -0.95
		_.each(entities, function (e){
			var clusterBias = 1 + 3*(e.charge.r * clusterColor.r + e.charge.g * clusterColor.g + e.charge.b * clusterColor.b)
			var d = Math.max(300, Math.sqrt(sq(e.x) + sq(e.y)))
			e.fx += universalConstant * e.x * clusterBias / d
			e.fy += universalConstant * e.y * clusterBias / d
		})
	}

	function drawEntities(){
		g.ctx.lineWidth = 10
		g.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
		_.each(entities, function (e){
			g.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
			g.circle(e.x, e.y, e.r+10).fill()
			g.ctx.fillStyle = g.colorNorm(e.charge.r, e.charge.g, e.charge.b, 0.5)
			g.circle(e.x, e.y, e.r).fill()
		})
	}

	function chargeAttraction(e1, e2){
		var modifiers = [Math.sqrt, _.identity, sq]
		var modifier = modifiers[tight]
		return (modifier(e1.charge.r * e2.charge.r) * clusterColor.r + 
				modifier(e1.charge.g * e2.charge.g) * clusterColor.g + 
				modifier(e1.charge.b * e2.charge.b) * clusterColor.b)
	}

	function drawConnections(){
		var margin = 10
		eachPair(entities, function (e1, e2){
			var match = chargeAttraction(e1, e2)
			if (match > 0.35){
				g.ctx.lineWidth = 5*match
				g.ctx.strokeStyle = 'rgba(255, 255, 255, '+match+')'
				var v = normalize(diff(e1, e2))
				var p1 = [e1.x - v.x*(e1.r+margin), e1.y - v.y*(e1.r+margin)]
				var p2 = [e2.x + v.x*(e2.r+margin), e2.y + v.y*(e2.r+margin)]
				g.path([p1, p2]).stroke()
			}
		})
	}

	function withPickedEntity(pos, action){
		var e = pickEntity(pos)
		if (e)
			action(e)
	}

	function pickEntity(pos){
		var mx = (pos.x - offset.x)/scale.x
		var my = (pos.y - offset.y)/scale.y
		var e = _.min(entities, function (e){ return dist(e.x, e.y, mx, my) })
		return (dist(e.x, e.y, mx, my) < e.r + 10) ? e : undefined
	}

	var swe = [[104,496],[80,494],[75,471],[80,461],[55,418],[55,389],[61,382],[69,356],[75,340],
	[70,323],[80,311],[67,294],[67,245],[81,214],[101,218],[102,201],[94,198],[108,138],[120,132],
	[133,86],[156,53],[159,60],[166,37],[194,43],[201,12],[258,61],[264,151],[232,153],[213,190],
	[223,206],[207,229],[162,264],[150,303],[154,337],[181,354],[178,366],[163,393],[143,403],
	[143,448],[129,475],[108,477],[104,496]]

	function draw(){
		simulate()

		g.background(150, 150, 150)

		g.ctx.save()
		g.ctx.translate(offset.x, offset.y)
		g.ctx.scale(scale.x, scale.y)
		drawConnections()
		drawEntities()
		withPickedEntity(g.mousePos(), function (e){
			g.ctx.fillStyle = "#000"
			g.ctx.textAlign = 'center'
			g.ctx.fillText('click', e.x, e.y+3)

			g.ctx.strokeStyle = g.color255(0,0,0,0.5)
			g.ctx.fillStyle = g.color255(0,0,0,0.25)
			//g.path(swe, e.x - 100, e.y - 100, 0.3).stroke().fill()
			e.fx *= 0.25
			e.fy *= 0.25
		})
		g.ctx.restore()
	}

	return {
		clusterBy: function (r, g, b){
			clusterColor = { r: r, g: g, b: b }
		},
		setTightness: function (t){
			tight = t
		}
	}
}