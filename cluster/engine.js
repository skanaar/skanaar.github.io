var gFilter = { status: null, type: null }

function Engine(canvasId, _nodes, _options){
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
	var paused = false
	var offset = { x: 0, y: 0 }
	var targetOffset = { x: 0, y: 0 }
	var scale = { x: 1, y: 1 }
	var selectedEntity = undefined
	var clickedEntity = undefined
	var mouseDownPos = undefined
	var mouseDownOffset = offset

	var nodes, visibleSubset, entities, relations, peers

	setNodes(_nodes)
	pulse(tick, 1000/options.fps)

	function setNodes(_nodes){
		if (nodes) nodes.dispose()
		nodes = _nodes
		visibleSubset = nodes
		entities = nodes.entities
		relations = nodes.relations
		peers = calculatePeers(nodes.relations)
		nodes.onChange(function (){
			peers = calculatePeers(nodes.relations)
			select(selectedEntity)
		})
	}

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

	function filteredEntities(status, type){
		var filtered = _.filter(entities, function (e){
			var matchesStatus = (!status) || e.properties.status === status
			var matchesType = (!type) || e.properties.type === type
			return matchesType && matchesStatus
		})
		var entById = _.indexBy(filtered, 'id')
		var rels = _.filter(relations, function (r){
			return entById[r.start.id] && entById[r.end.id]
		})
		return { entities: filtered, relations: rels }
	}

	function filteredEntities_0(source, generations){
		var accumulator = []
		function collect(a, generations){
			_.each(peers[a.id], function (sibling){
				accumulator[a.id] = a
				if (accumulator[sibling.id] === undefined && generations)
					collect(sibling, generations-1)
			})
		}
		collect(source, generations)
		var rels = _.filter(relations, function (r){
			return accumulator[r.start.id] && accumulator[r.end.id]
		})
		return { entities: _.values(accumulator), relations: rels }
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
		if (mouseDownPos){
			offset = diff(mouseDownOffset, mult(diff(pos, mouseDownPos), 1/scale.x))
			targetOffset = offset
		}
	}

	function onMouseUp(pos){
		var e = pickEntity(pos)
		if (clickedEntity && e){
			if (clickedEntity === e){
				select(e)
				options.selectEntity(e)
			}
			else
				nodes.addRelation(clickedEntity, e)
		}
		
		if (_.isEqual(mouseDownPos, pos)){
			options.deselectEntity()
			select(undefined)
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
		var w = g.width()/2
		var h = g.height()/2
		return { x: (pos.x - w)/scale.x + offset.x, y: (pos.y - h)/scale.y + offset.y }
	}
	function untransform(pos){
		var w = g.width()/2
		var h = g.height()/2
		return { x: (pos.x - offset.x)*scale.x + w, y: (pos.y - offset.y)*scale.y + h }
	}

	function withPickedEntity(pos, action){
		var e = pickEntity(pos)
		if (e)
			action(e)
	}

	function pickEntity(pos){
		var p = transform(pos)
		var e = _.min(visibleSubset.entities, function (e){ return dist(e, p) })
		return (dist(e, p) < radiusOf(e) + 10) ? e : undefined
	}

	function easeOffsetTowardsTarget(){
		var v = diff(targetOffset, offset)
		var d = mag(v)
		if (d > 1) v = add( mult(v, 1/d), mult(v, 0.1) )
		offset = add(offset, v)
	}

	function tick(tickCounter){
		if (paused) return

		nodes.simulate()
		easeOffsetTowardsTarget()

		var interactions = {
			hoveredEntity: pickEntity(g.mousePos()),
			clickedEntity: clickedEntity,
			selectedEntity: selectedEntity
		}
		var coords = { transform: transform, untransform: untransform }
		Visualizer().draw(g, visibleSubset, interactions, scale, offset, tickCounter, coords)
	}

	function radiusOf(entity){ return 30 + (selectedEntity === entity ? 30 : 0) }

	function select(entity){
		selectedEntity = entity
	}

	function centerSelected(){
		if (selectedEntity){
			targetOffset.x = selectedEntity.x
			targetOffset.y = selectedEntity.y
		}
	}

	return {
		setNodes: setNodes,
		togglePause: function (){
			paused = !paused
		},
		select: function (id){
			var e = _.find(entities, function (x){ return x.id == id })
			options.selectEntity(e)
			select(e)
			scale.y /= scale.x
			scale.x = 1
		},
		zoom: function(direction){
			repeat(function(strength){
				var s = 1 - 0.1*strength
				var f = direction > 0 ? s : 1/s
				scale.x *= f
				scale.y *= f
			}, 5)
		},
		fillScreen: function(){
			var w = canvas.parentElement.offsetWidth
			canvas.setAttribute('width', w)
			canvas.setAttribute('height', w*3/4)
		},
		centerSelected: centerSelected,
		filter: function(status, type){
			visibleSubset = filteredEntities(status, type)

			//$('.filter-option').toggleClass('active', false)
			//if (component === filterProperty){
			//	filterProperty = ''
			//} else {
			//	$('.filter-'+component).toggleClass('active', true)
			//	filterProperty = component
			//	filterFactor = 0
			//	repeat(function (v){ filterFactor = v })
			//}
		}
	}
}