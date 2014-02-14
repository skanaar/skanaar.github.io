function repeat(action, repetitions, interval){
	var r = repetitions || 10
	_.times(r, function (i){
		setTimeout(function (){ action(i/(r-1)) }, (interval || 50)*i)
	})
}

function Nodes(_entities, _relations){
	var dampening = 0
	var changeSubscribers = []
	var entities = _.map(_entities, function (e){ return Entity(e.id, e)})
	var entitiesById = _.object(_.map(entities, function (e){ return [e.id, e] }))
	var relations = _.map(_relations, function (r){
		return Relation(entitiesById[r.start.id], entitiesById[r.end.id], r.type)
	})


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
			name: fields.name,
			description: fields.description,
			x: fields.x || _.random(-100, 100),
			y: fields.y || _.random(-100, 100),
			fx: 0,
			fy: 0,
			properties: fields.properties || {}
		}
	}

	function eachPairTwice(list, action){
		for(var i=0, len=list.length; i<len; i++)
			for(var j=0; j<len; j++)
				if (i !== j)
					action(list[i], list[j])
	}

	function simulate(){
		if (dampening === 0) return

		function addForce(entity, f){
			entity.fx += f.x
			entity.fy += f.y
		}

		_.each(entities, function (e){
			e.fx *= dampening
			e.fy *= dampening
			e.x += e.fx
			e.y += e.fy
		})

		var repulsion = 25
		var forceThreshold = 400
		eachPairTwice(entities, function (e, f){
			var squareDist = sq(e.x-f.x) + sq(e.y-f.y)
			if (squareDist < sq(forceThreshold))
				addForce(e, mult(diff(e, f), repulsion/(0.1 + squareDist)))
		})

		var springiness = 0.0002
		_.each(relations, function (r){
			var delta = diff(r.start, r.end)
			var factor = springiness * r.strength * (mag(delta) - r.length)
			addForce(r.start, mult(delta, -factor))
			addForce(r.end, mult(delta, factor))
		})
	}

	function addRelation(a, b){
		var r = Relation(a, b, 'participant')
		r.strength = 0
		repeat(function (v){ r.strength = v }, 20)
		repeat(function (v){ dampening = 0.95*(1-sq(v)) }, 40)
		relations.push(r)
		_.each(changeSubscribers, function (c){ c() })
	}

	return {
		simulate: simulate,
		entities: entities,
		relations: relations,
		addRelation: addRelation,
		setDampening: function (d){ dampening = d },
		onChange: function(callback){ changeSubscribers.push(callback) },
		dispose: function (){ changeSubscribers.length = 0 }
	}
}