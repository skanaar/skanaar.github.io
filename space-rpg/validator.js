window.validator = (function (){

  function isInvalidColor(c) { return (c.length!=3) || !!c.match(/[^a-fA-F0-9]/) }

  function undefItem(world, items, error, msg) {
    var definedItems = world.items.map(e => e.name)
    _.uniq(_.difference(items, definedItems)).forEach(e => error(msg || 'undefined item', e))
  }

  function validateQuest(world, quest, error) {
    if (!quest.name) {
      error('quest', '', 'missing or empty name')
      return
    }
    var dom = (new DOMParser()).parseFromString('<quest>'+quest.xml+'</quest>', 'application/xml')
    var parseError = dom.getElementsByTagName('parsererror')[0]
    if (parseError)
      error('invalid xml', parseError.getElementsByTagName('div')[0].innerText)
    function inXmlTags(xml, pattern) {
      return _.flatten((xml.match(pattern) || []).map(e => e.substring(1)))
    }
    function inXml(xml, pattern) {
      return _.flatten((xml.match(pattern) || []).map(e => e.split('="')[1].split(';')))
    }
    function undefErrors(pattern, defined, msg) {
      _.uniq(_.difference(inXml(quest.xml, pattern), defined)).forEach(e => error(msg, e))
    }
    undefErrors(/state="[^"]+/gm, ['space', 'surface'], 'state should be either "space" or "surface"')
    undefErrors(/item="[^"]+/gm, world.items.map(e => e.name), 'undefined item')
    undefErrors(/model="[^"]+/gm, world.models.map(e => e.name), 'undefined model')
    undefErrors(/loot="[^"]+/gm, world.items.map(e => e.name), 'undefined loot item')
    undefErrors(/dest="[^"]+/gm, world.destinations.map(e => e.name), 'undefined destination')
    undefErrors(/enemy="[^"]+/gm, world.enemies.map(e => e.name), 'undefined enemy')
    undefErrors(/ship="[^"]+/gm, world.ships.map(e => e.name), 'undefined ship')
    undefErrors(/icon="[^"]+/gm, ['enter', 'exit', 'arrow', 'rhomb', 'chevrons', 'square', 'drop'], 'undefined icon')
    inXml(quest.xml, /color="[^"]+/gm).filter(isInvalidColor).forEach(e => error('invalid color', e))
    inXml(quest.xml, /credits="[^"]+/gm).filter(e => isNaN(+e)).forEach(e => error('credits must be a number', e))
    inXml(quest.xml, /jump="[^"]+/gm).filter(e => isNaN(+e)).forEach(e => error('jump must be a number', e))
    var steps = [
      'condition', 'place-item', 'place-inventory', 'place-enemy', 'add-to-quest-list', 'dialog',
      'give', 'take', 'mark-on-map', 'remove-map-marker', 'change-ship', 'travel', 'goto', 'hint'
    ]
    _.uniq(_.difference(inXmlTags(quest.xml, /<[a-z-]+/gm), steps)).forEach(e => error('unknown step', e))
  }

  function validateShip(world, ship, error) {
    if (!world.models.some(e => e.name == ship.visual))
      error('undefined model', ship.visual)
  }

  function validateEnemy(world, ship, error) {
    validateShip(world, ship, error)
    undefItem(world, ship.inventory, error)
  }

  function validateCelestial(world, celestial, error) {
      celestial.celestial.color.filter(isInvalidColor).forEach(e => error('invalid color', e))
      if (celestial.surface)
        celestial.surface.spectrum.filter(isInvalidColor).forEach(e => error('invalid color', e))

      if (celestial.type == 'anomaly') {
        var referredModel = celestial.model
        if (!world.models.some(e => e.name == referredModel))
          error('undefined model', referredModel)
      }
  }

  function validateDestination(world, dest, error) {
    if (world.celestials.every(e => e.id != dest.style))
      error('undefined celestial', dest.style)    
    if (dest.enemy) {
      undefItem(world, dest.enemy.loot, error, 'undefined loot item')
      if (world.enemies.every(e => e.name != dest.enemy.type))
        error('undefined enemy', dest.enemy.type)
    }
    undefItem(world, dest.treasures, error, 'undefined treasure items')
    if (dest.trader) {
      undefItem(world, dest.trader.inventory, error, 'undefined trader item')
      if (dest.trader.buy < dest.trader.sell)
        error('trader must be profitable', dest.trader.buy + ' < ' + dest.trader.sell)
    }
    if (dest.shipyard) {
      var definedShips = world.ships.map(e => e.name)
      _.uniq(_.difference(dest.shipyard, definedShips)).forEach(e => error('undefined ship', e))
    }
  }

  function errorCollector(type, func) {
    return function (world, entity) {
      var errors = []
      var collect = (msg, arg) => errors.push({ type: type, name: entity.name || entity.id, msg: msg, arg: arg})
      func(world, entity, collect)
      return errors
    }
  }

  var self = {
    quest: errorCollector('quest', validateQuest),
    celestial: errorCollector('celestial', validateCelestial),
    destination: errorCollector('destination', validateDestination),
    ship: errorCollector('ship', validateShip),
    enemy: errorCollector('enemy', validateEnemy),
    world: function (world) {
      return _.flatten([
        world.quests.map(e => self.quest(world, e)),
        world.celestials.map(e => self.celestial(world, e)),
        world.destinations.map(e => self.destination(world, e)),
        world.ships.map(e => self.ship(world, e)),
        world.enemies.map(e => self.enemy(world, e)),
      ])
    }
  }
 
  return self
})()
