if (!window.events) {
  window.events = {}
  riot.observable(window.events)
}

window.nullWorld = function () {
  return {
    destinations: [],
    quests: '',
    items: [],
    ships: [],
    enemies: [],
    celestialStyles: [],
    surfaces: []
  }
}

window.constants = {
  models: [
    'anomaly-thanatos',
    'anomaly-observatory',
    'anomaly-buoy',
    'monitor-drone',
    'soma',
    'devourer',
    'saucer',
    'battleship',
    'clipper',
    'bentus',
    'rogue',
    'vanguard',
    'thanatos',
    'interplan',
    'interplan-derelict',
    'sol-array',
    'rover'
  ],
  celestialTypes: [
    'cloud',
    'star',
    'jovian',
    'planet',
    'asteroid',
    'ring',
    'anomaly'
  ],
  hasSurface: function (entity) {
    return ['planet', 'asteroid'].includes(entity.style.split('-')[0])
  },
  hasModel: function (entity) {
    return 'anomaly' == entity.style.split('-')[0]
  }
}

window.getWorld = function () {
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
    return nullWorld()
  }
}

window.saveWorld = function (world) {
  localStorage['world'] = _.stringify(world)
}