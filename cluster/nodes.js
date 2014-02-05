var rep = 25
var springF = 2
var dampening = 0.95

function sq(x){ return x*x }
function dist(a,b){ return mag(diff(a,b)) }
function add(a,b){ return { x: a.x + b.x, y: a.y + b.y } }
function diff(a,b){ return { x: a.x - b.x, y: a.y - b.y } }
function mult(v,factor){ return { x: factor*v.x, y: factor*v.y } }
function mag(v){ return Math.sqrt(sq(v.x) + sq(v.y)) }
function normalize(v){ return mult(v, 1/mag(v)) }

function repeat(action, repetitions){
	var r = repetitions || 10
	_.times(r, function (i){
		setTimeout(function (){ action(i/r) }, 50*i)
	})
}

function Nodes(count){
	var entities = _.times(count, Entity)
	var relations = fillTree(Relation, 3, entities.length)
	relations.each = function (action){
		_.each(relations, function (r){
			action(entities[r.start], entities[r.end], r)
			action(entities[r.end], entities[r.start], r)
		})
	}

	_.times(0, function (){
		var n = entities.length-1
		relations.push(Relation(_.random(20, n), _.random(20, n)))
	})

	_.times(150, simulate)

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
			strength: 0.5 + Math.random(),
			length: _.random(100,250),
			properties: {}
		}
	}

	function Entity(i, x, y){
		var r = _.random(20,30)
		return {
			id: i,
			name: randomName(),
			description: randomName() + ' ' + _.times(15, randomName).join(' ').toLowerCase(),
			x: x || _.random(-100, 100),
			y: y || _.random(-100, 100),
			fx: 0,
			fy: 0,
			r: r,
			properties: {},
			charge: colorObject(Math.random(), 1, 1)
		}
	}

	function randomName(){
		var vowel = 'aaeeiioouuy'
		var conso = 'bcddfghhkllmnnprrsstttv'
		function syllable(){ return _.sample(vowel) + _.sample(conso) }
		return _.sample(conso).toUpperCase() + _.times(_.random(2,4), syllable).join('')
	}

	function colorObject(hue, sat, lit){
		function component(v){
			var x = Math.cos(6.283*v)/2 + 0.5
			return lit*(1-sat + sat*x*x)
		}
		return {
			r: component(hue),
			g: component(hue-1/3),
			b: component(hue+1/3)
		}
	}

	function nudge(x,y){
		_.each(entities, function(e){
			e.x += x
			e.y += y
		})
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
		relations.each(function (e, f, relation){
			var d = dist(e, f)
			var springForce = relation.strength * springiness * (d - relation.length) / 10000
			e.fx += (e.x - f.x)*(-springForce)
			e.fy += (e.y - f.y)*(-springForce)
		})
	}

	return {
		simulate: simulate,
		entities: entities,
		relations: relations,
		nudge: nudge,
		addRelation: function (a, b){
			var r = Relation(a.id, b.id)
			r.strength = 0
			repeat(function (v){ r.strength = v }, 20)
			relations.push(r)
		}
	}
}