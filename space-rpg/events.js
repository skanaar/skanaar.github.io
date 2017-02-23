if (!window.events) {
  window.events = {}
  riot.observable(window.events)
}

window.getWorld = function () {
  var nullWorld = { destinations: [], quests: '', items: [], ships: [], enemies: [] }
  try {
    var world = JSON.parse(localStorage['world'])
    if (!_.isArray(world.destinations)) throw new Error()
    if (!_.isString(world.quests)) throw new Error()
    if (!_.isArray(world.items)) throw new Error()
    if (!_.isArray(world.ships)) throw new Error()
    if (!_.isArray(world.enemies)) throw new Error()
    return world
  } catch(e) {
    alert('locally stored world was corrupt, press [Load default] to restore data from the server')
    return nullWorld
  }
}

window.saveWorld = function (world) {
  localStorage['world'] = _.stringify(world)
}