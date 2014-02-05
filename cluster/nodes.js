var natsep = 200
var rep = 25
var springF = 2
var dampening = 0.95

function initNodes(canvasId, _options){
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
	var scale = { x: 0.3, y: 0.3 }
	var selectedEntity = undefined
	var clickedEntity = undefined
	var mouseDownPos = undefined
	var mouseDownOffset = offset

	var entities = _.times(80, Entity)
	var relations = fillTree(Relation, 3, entities.length)
	relations.each = function (action){
		_.each(relations, function (r){
			action(entities[r.start], entities[r.end])
			action(entities[r.end], entities[r.start])
		})
	}

	_.times(0, function (){
		var n = entities.length-1
		relations.push(Relation(_.random(20, n), _.random(20, n)))
	})

	_.times(150, simulate)
	pulse(draw, 1000/options.fps)

	function fillTree(factory, branches, max){
		var accumulator = []
		var pointer = 1
		for(var index=0; pointer<max; index++){
			var b = _.random(2, branches)
			for(var i=0; i<b && pointer<max-i; i++)
				accumulator.push(factory(index, pointer+i))
			pointer+=b
		}
		return accumulator
	}

	function Relation(i, j){
		return {
			start: i,
			end: j,
			properties: {}
		}
	}

	function randomName(){
		var vowel = 'aaeeiioouuy'
		var conso = 'bcddfghhkllmnnprrsstttv'
		function syllable(){ return _.sample(vowel) + _.sample(conso) }
		return _.sample(conso).toUpperCase() + _.times(_.random(2,4), syllable).join('')
	}

	function Entity(i, x, y){
		var r = _.random(20,30)
		return {
			id: i,
			name: randomName(),
			x: x || _.random(-100, 100),
			y: y || _.random(-100, 100),
			fx: 0,
			fy: 0,
			r: r,
			properties: {},
			charge: g.colorObjHSL(Math.random(), 1, 1)
		}
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
			}
			else
				relations.push(Relation(clickedEntity.id, e.id))
		}
		
		if (_.isEqual(mouseDownPos, pos)){
			options.deselectEntity()
			selectedEntity = undefined
		}
		mouseDownPos = undefined
		clickedEntity = undefined
	}

	function repeat(action, repetitions){
		var r = repetitions || 10
		for(var i=r; i>0; i--)
			setTimeout(function (){ action(1-i/r) }, 20*i)
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

	function sq(x){ return x*x }
	function dist(a,b){ return mag(diff(a,b)) }
	function add(a,b){ return { x: a.x + b.x, y: a.y + b.y } }
	function diff(a,b){ return { x: a.x - b.x, y: a.y - b.y } }
	function mult(v,factor){ return { x: factor*v.x, y: factor*v.y } }
	function mag(v){ return Math.sqrt(sq(v.x) + sq(v.y)) }
	function normalize(v){ return mult(v, 1/mag(v)) }
	function transform(pos){
		return { x: (pos.x - offset.x)/scale.x, y: (pos.y - offset.y)/scale.y }
	}
	function untransform(pos){
		return { x: scale.x*pos.x + offset.x, y: scale.y*pos.y + offset.y }
	}

	function eachPairTwice(list, action){
		for(var i=0, len=list.length; i<len; i++)
			for(var j=0; j<len; j++)
				if (i !== j)
					action(list[i], list[j])
	}

	function simulate(){
		_.each(entities, function (e){
			e.x += e.fx
			e.y += e.fy
			e.fx *= dampening
			e.fy *= dampening
		})

		var populationWeight = 20/entities.length
		var surfaceRepulsion = 0.014
		var repulsion = rep
		eachPairTwice(entities, function (e, f){
			var d = dist(e, f)
			var repulsForce = repulsion/(0.1 + sq(d))
			var surfacForce = surfaceRepulsion * Math.max(0, e.r + f.r - d)
			e.fx += (e.x - f.x)*(surfacForce + repulsForce)
			e.fy += (e.y - f.y)*(surfacForce + repulsForce)
		})

		var springiness = springF
		var springLength = natsep
		relations.each(function (e, f){
			var d = dist(e, f)
			var springForce = springiness * (d - springLength) / 10000
			e.fx += (e.x - f.x)*(-springForce)
			e.fy += (e.y - f.y)*(-springForce)
		})
	}

	function drawEntities(){
		g.ctx.lineWidth = 10
		_.each(entities, function (e){
			g.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
			g.circle(e.x, e.y, e.r+10).fill()
			g.ctx.fillStyle = g.colorNorm(e.charge.r, e.charge.g, e.charge.b, 0.5)
			g.circle(e.x, e.y, e.r).fill()
		})
	}

	function drawRelations(){
		var margin = 10
		g.ctx.lineWidth = 5
		g.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
		relations.each(function (e1, e2){
			var v = normalize(diff(e1, e2))
			var p1 = [e1.x - v.x*(e1.r+margin), e1.y - v.y*(e1.r+margin)]
			var p2 = [e2.x + v.x*(e2.r+margin), e2.y + v.y*(e2.r+margin)]
			g.path([p1, p2]).stroke()
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
		simulate()

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
					return [
						clickedEntity.x + i*v.x*10 + 10*v.y*Math.cos(i+tick/2),
						clickedEntity.y + i*v.y*10 - 10*v.x*Math.cos(i+tick/2)
					]
				})
				//g.path([[clickedEntity.x, clickedEntity.y], [mx, my]]).stroke()
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
			var sidebarEdge = transform({x:g.width()-200, y:0})
			g.path([[e.x + e.r + 5/scale.x, e.y], [sidebarEdge.x, e.y]]).stroke()
		}

		g.ctx.restore()
	}

	return {
		unstabilize: function (t){
			natsep = _.random(150, 250)
		},
		zoom: function(direction){
			repeat(function(strength){
				var f = 1 - 0.03*sq(strength)
				scale.x *= direction > 0 ? f : 1/f
				scale.y *= direction > 0 ? f : 1/f
			})
		},
		fillScreen: function(){
			var w = canvas.parentElement.offsetWidth
			canvas.setAttribute('width', w)
			canvas.setAttribute('height', w*3/4)
			offset.x = g.width()/2
			offset.y = g.height()/2
		}
	}
}