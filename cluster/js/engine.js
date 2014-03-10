var gFilter = { status: null, type: null }

function Engine(canvasId, _nodes, _options){
	var options = {
		fps: _options.fps || 30,
		selectRelation: _options.selectRelation || function (){},
		selectEntity: _options.selectEntity || function (){}
	}
	var canvas = document.getElementById(canvasId)
	var g = skanaar.Canvas(canvas, {
		mousedown: onMouseDown, 
		mouseup: onMouseUp, 
		mousemove: onMouseMove
	})
	var newRelationType = 'participant'
	var paused = false
	var offset = { x: 0, y: 0 }
	var targetOffset = { x: 0, y: 0 }
	var scale = { x: 1, y: 1 }
	var filterArgs = undefined
	var centralEntityId = undefined
	var selectedEntity = undefined
	var clickedEntity = undefined
	var clickedRelation = undefined
	var selectedRelation = undefined
	var mouseDownPos = undefined
	var mouseDownOffset = offset

	var nodes, visibleSubset

	setNodes(_nodes)
	pulse(tick, 1000/options.fps)

	function setNodes(_nodes){
		if (nodes) nodes.dispose()
		nodes = _nodes
		visibleSubset = nodes
		peers = calculatePeers(nodes.relations)
		nodes.onChange(function (){
			select(selectedEntity)
			applyFilter()
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

	function filteredEntities(filterArgs){
		var filtered = _.filter(nodes.entities, function (e){
			return filterArgs[e.status] &&
				filterArgs[e.type] &&
				filterArgs.mobility <= e.mobility && 
				filterArgs.nutrition <= e.nutrition && 
				filterArgs.building <= e.building
		})
		var entById = _.indexBy(filtered, 'id')
		var rels = _.filter(nodes.relations, function (r){
			return (filterArgs.rel_participant && r.type == 'participant') ||
				(filterArgs.rel_provider && r.type == 'provider') ||
				(filterArgs.rel_catalyst && r.type == 'catalyst') ||
				(filterArgs.rel_potential && r.type == 'potential') ||
				(filterArgs.rel_alternative && r.type == 'alternative')
			return entById[r.start.id] && entById[r.end.id]
		})
		return { entities: filtered, relations: rels }
	}

	function relationsFor(entities){
		return _.flatten(_.map(entities, function (e){
			return _.filter(nodes.relations, function (r){
				return r.start === e || r.end === e
			})
		}))
	}

	function onMouseDown(pos){
		var e = pickEntity(pos)
		var r = pickRelation(pos)
		if (e){
			clickedEntity = e
		} else if (r){
			clickedRelation = r
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
		var r = pickRelation(pos)
		if (clickedEntity && e){
			if (clickedEntity === e){
				selectedRelation = undefined
				options.selectRelation(undefined)
				select(e)
				options.selectEntity(e)
			}
			else{
				var rel = nodes.addRelation(clickedEntity, e, newRelationType)
				rel.strength = 0
				repeat(function (v){ rel.strength = v }, 20)
				nodes.runFor(2000)
			}
		}

		if (clickedRelation && r && clickedRelation === r){
			selectedRelation = r
			select(undefined)
			options.selectEntity(undefined)
			options.selectRelation(r)
		}
		
		if (!e && !r && _.isEqual(mouseDownPos, pos)){
			options.selectEntity(undefined)
			options.selectRelation(undefined)
			select(undefined)
			selectedRelation = undefined
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

	function pickRelation(pos){
		var p = transform(pos)
		var measured = _.map(visibleSubset.relations, function (r){
			var middle = mult(add(r.start, r.end), 0.5)
			middle.y += 0.15 * dist(r.start, r.end)
			return { obj:r, dist: dist(middle, p) }
		})
		var o = _.min(measured, function (q){ return q.dist })
		return (o.dist < 20) ? o.obj : undefined
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
			selectedEntity: selectedEntity,
			centralEntityId: centralEntityId,
			selectedRelation: selectedRelation
		}
		var coords = { transform: transform, untransform: untransform }
		Visualizer().draw(g, visibleSubset, interactions, scale, offset, tickCounter, coords)
	}

	function radiusOf(entity){ return 30 + (centralEntityId === entity.id ? 30 : 0) }

	function select(entity){
		selectedEntity = entity
	}

	function centerSelected(){
		if (selectedEntity){
			targetOffset.x = selectedEntity.x
			targetOffset.y = selectedEntity.y
		}
	}

	function applyFilter(){
		visibleSubset = filteredEntities(filterArgs)
	}

	return {
		setNodes: setNodes,
		setNewRelationType: function (t){ newRelationType = t },
		runFor: function (millis){ nodes.runFor(millis) },
		pause: function (){ paused = true },
		togglePause: function (){ paused = !paused },
		select: function (id){
			var e = _.find(nodes.entities, function (x){ return x.id == id })
			options.selectEntity(e)
			select(e)
			scale.y = 1
			scale.x = 1
		},
		setCentralEntityId: function (id){
			centralEntityId = id
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
			var w = $(window).height() - 200
			canvas.setAttribute('height', w)
		},
		centerSelected: centerSelected,
		getVisibleSubset: function (){ return visibleSubset },
		setFilter: function (args){
			filterArgs = args
			applyFilter()
		},
		onSelectedEntityChanged: function (callback){
			options.selectEntity = callback
		},
		onSelectedRelationChanged: function (callback){
			options.selectRelation = callback
		}
	}
}
