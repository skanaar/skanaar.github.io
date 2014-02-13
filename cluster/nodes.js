var rep = 25
var springF = 2
var dampening = 0.95
var filterProperty = ''
var filterFactor = 0

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
		setTimeout(function (){ action(i/(r-1)) }, 50*i)
	})
}

function randomName(syllables){
	var vowel = 'aaeeiioouuy'
	var conso = 'bcddfghhkllmnnprrsstttv'
	function syllable(){ return _.sample(vowel) + _.sample(conso) }
	return _.sample(conso).toUpperCase() + _.times(syllables || _.random(2,4), syllable).join('')
}

function Nodes(count, _entities, _relations){

	var entities = _.map(_entities, function (e){ return Entity(e.id, e)})
	var entitiesById = _.object(_.map(entities, function (e){ return [e.id, e] }))
	var relations = _.map(_relations, function (r){
		return Relation(entitiesById[r.start.id], entitiesById[r.end.id], r.type)
	})
	relations.each = function (action){
		_.each(relations, function (r){
			action(r.start, r.end, r)
			action(r.end, r.start, r)
		})
	}

	_.times(300, simulate)
	dampening = 0

	function Relation(a, b, type){
		return {
			start: a,
			end: b,
			strength: 0.5 + Math.random(),
			length: _.random(50,150),
			type: type || {}
		}
	}

	function Entity(i, _fields){
		var fields = _fields || {}
		return {
			id: i,
			name: fields.name || randomName(),
			description: fields.description || randomName() + ' ' + _.times(15, randomName).join(' ').toLowerCase(),
			x: fields.x || _.random(-100, 100),
			y: fields.y || _.random(-100, 100),
			fx: 0,
			fy: 0,
			properties: fields.properties || {}
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

	function forceScaling(e, f){
		if (arguments.length === 2) return Math.min(forceScaling(e), forceScaling(f))
		if (filterProperty){
			var a = filterProperty ? e.properties[filterProperty] : 1
			return filterFactor * a + (1-filterFactor)
		}
		return 1
	}

	function simulate(){
		if (dampening === 0) return

		_.each(entities, function (e){
			e.fx *= dampening
			e.fy *= dampening
			e.x += e.fx
			e.y += e.fy
		})

		var populationWeight = 20/entities.length
		var surfaceRepulsion = 0.014
		var repulsion = rep
		eachPairTwice(entities, function (e, f){
			var d = dist(e, f)
			if (d > 400) return
			var repulsForce = forceScaling(e, f) * repulsion/(0.1 + sq(d))
			e.fx += (e.x - f.x) * repulsForce
			e.fy += (e.y - f.y) * repulsForce
		})

		var springiness = springF
		relations.each(function (e, f, relation){
			var d = dist(e, f)
			var springForce = (d - relation.length) / 10000
			e.fx += (e.x - f.x) * (-springForce) * springiness * relation.strength
			e.fy += (e.y - f.y) * (-springForce) * springiness * relation.strength
		})
	}

	var changeSubscribers = []

	return {
		simulate: simulate,
		entities: entities,
		relations: relations,
		nudge: nudge,
		forceScaling: forceScaling,
		onChange: function(callback){
			changeSubscribers.push(callback)
		},
		addRelation: function (a, b){
			var r = Relation(a, b, 'core')
			r.strength = 0
			repeat(function (v){ r.strength = v }, 20)
			repeat(function (v){ dampening = 0.95*(1-sq(v)) }, 40)
			relations.push(r)
			_.each(changeSubscribers, function (c){ c() })
		}
	}
}