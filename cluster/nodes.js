function repeat(action, repetitions, interval){
	var r = repetitions || 10
	_.times(r, function (i){
		setTimeout(function (){ action(i/(r-1)) }, (interval || 50)*i)
	})
}

function Nodes(_entities, _relations){
	var dampening = 0
	var changeSubscribers = []
	var entities = _.map(_entities, Entity)
	var entitiesById = _.object(_.map(entities, function (e){ return [e.id, e] }))
	var relations = _.map(_relations, function (r){
		return Relation(entitiesById[r.start.id], entitiesById[r.end.id], r)
	})

	function Relation(a, b, _fields){
		return _.extend(_.clone(_fields), {
			start: a,
			end: b,
			strength: 1
		})
	}

	function Entity(_fields){
		return _.extend(_.clone(_fields), {
			x: _fields.x || _.random(-100, 100),
			y: _fields.y || _.random(-100, 100),
			fx: 0,
			fy: 0
		})
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
		var springLength = 150
		_.each(relations, function (r){
			var delta = diff(r.start, r.end)
			var factor = springiness * r.strength * (mag(delta) - springLength)
			addForce(r.start, mult(delta, -factor))
			addForce(r.end, mult(delta, factor))
		})
	}

	function addRelation(a, b, type, desc){
		var existing = _.find(relations, function (r){
			return _.isEqual(_.sortBy([r.start.id, r.end.id]), _.sortBy([a.id, b.id]))
		})
		if (existing){
			existing.type = type
			return
		}
		var r = Relation(a, b, { type: type, description: desc })
		r.strength = 0
		repeat(function (v){ r.strength = v }, 20)
		repeat(function (v){ dampening = 0.95*(1-sq(v)) }, 80)
		relations.push(r)
		_.each(changeSubscribers, function (c){ c() })
	}

	function removeRelation(r){
		relations.splice(relations.indexOf(r), 1)
		_.each(changeSubscribers, function (c){ c() })
	}

	function addEntity(fields){
		var id = _.max(_.pluck(entities, 'id')) + 1
		var freshman = Entity(_.extend(_.clone(fields), { id:id }))
		entities.push(freshman)
		_.each(changeSubscribers, function (c){ c() })
		return freshman
	}

	function removeEntity(e){
		var marked = _.filter(relations, function (r){ return (r.start === e || r.end === e) })
		_.each(marked, removeRelation)
		entities.splice(entities.indexOf(e), 1)
		_.each(changeSubscribers, function (c){ c() })
	}

	function runFor(millis){
		repeat(function (v){ dampening = 0.95*(1-sq(sq(v))) }, millis/200, 200)
	}

	return {
		runFor: runFor,
		simulate: simulate,
		entities: entities,
		relations: relations,
		addRelation: addRelation,
		addEntity: addEntity,
		removeRelation: removeRelation,
		removeEntity: removeEntity,
		setDampening: function (d){ dampening = d },
		onChange: function(callback){ changeSubscribers.push(callback) },
		dispose: function (){ changeSubscribers.length = 0 }
	}
}