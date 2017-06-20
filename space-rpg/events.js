if (!window.events) {
  window.events = {}
  riot.observable(window.events)
}

window.nullWorld = function () {
  return {
    destinations: [],
    audioRegions: [],
    quests: '',
    items: [],
    ships: [],
    enemies: [],
    celestials: [],
    models: []
  }
}

window.constants = {
  celestialTypes: [
    'cloud',
    'star',
    'jovian',
    'planet',
    'asteroid',
    'structure',
    'anomaly'
  ],
  audios: [
    'light-years',
    'dark-sky'
  ],
  hasSurface: function (entity) {
    return ['planet', 'asteroid'].includes(entity.style.split('-')[0])
  },
  hasModel: function (entity) {
    return ['structure', 'anomaly'].includes(entity.style.split('-')[0])
  },
  isTravellable: function (entity) {
    return ['jovian', 'planet', 'asteroid', 'structure', 'anomaly'].includes(entity.style.split('-')[0])
  }
}

window.getWorld = function () {
  try {
    var world = JSON.parse(localStorage['world'])
    if (!_.isArray(world.destinations)) throw new Error()
    if (!_.isArray(world.audioRegions)) throw new Error()
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