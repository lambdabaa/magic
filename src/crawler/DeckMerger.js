let Firebase = require('firebase');
let map = require('lodash/collection/map');
let normalize = require('../normalize');
let stream = require('stream');

let firebaseSecretToken = 'tTxh4X9b1gGIySp4XvSFvuTcf50Pt0XnSxoCYN49';
let ref = new Firebase('https://mtgstats.firebaseio.com/groups');

let colors = [
  'Black',
  'Blue',
  'Green',
  'Red',
  'White'
];

let colorPairs = pair(colors);
let colorTriplets = triple(colors);

let clans = invert(
  expandClans({
    Dimir: ['BU', 'UB'],
    Golgari: ['BG', 'GB'],
    Rakdos: ['BR', 'RB'],
    Orzhov: ['BW', 'WB'],
    Simic: ['UG', 'GU'],
    Izzet: ['UR', 'RU'],
    Azorius: ['UW', 'WU'],
    Gruul: ['GR', 'RG'],
    Selesnya: ['GW', 'WG'],
    Boros: ['RW', 'WR'],
    Sultai: ['BUG', 'BGU', 'UBG', 'UGB', 'GBU', 'GUB'],
    Grixis: ['BUR', 'BRU', 'UBR', 'URB', 'RBU', 'RUB'],
    Esper: ['BUW', 'BWU', 'UBW', 'UWB', 'WBU', 'WUB'],
    Jund: ['BGR', 'BRG', 'GBR', 'GRB', 'RBG', 'RGB'],
    Abzan: ['BGW', 'BWG', 'GBW', 'GWB', 'WBG', 'WGB', 'Junk'],
    Mardu: ['BRW', 'BWR', 'RBW', 'RWB', 'WBR', 'WRB'],
    Temur: ['RUG', 'RGU', 'URG', 'UGR', 'GRU', 'GUR'],
    Bant: ['WUG', 'WGU', 'UWG', 'UGW', 'GWU', 'GUW'],
    Jeskai: ['WUR', 'WRU', 'UWR', 'URW', 'RWU', 'RUW'],
    Naya: ['WGR', 'WRG', 'GWR', 'GRW', 'RWG', 'RGW']
  })
);

function pair(arr) {
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      result.push(arr[i] + ' ' + arr[j]);
      result.push(arr[j] + ' ' + arr[i]);
    }
  }

  return result;
}

function triple(arr) {
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      for (let k = j + 1; k < arr.length; k++) {
        result.push(arr[i] + ' ' + arr[j] + ' ' + arr[k]);
        result.push(arr[i] + ' ' + arr[k] + ' ' + arr[j]);
        result.push(arr[j] + ' ' + arr[i] + ' ' + arr[k]);
        result.push(arr[j] + ' ' + arr[k] + ' ' + arr[i]);
        result.push(arr[k] + ' ' + arr[i] + ' ' + arr[j]);
        result.push(arr[k] + ' ' + arr[j] + ' ' + arr[i]);
      }
    }
  }

  return result;
}

function invert(keyToArr) {
  let result = {};
  for (let key in keyToArr) {
    let arr = keyToArr[key];
    arr.forEach(element => {
      result[element] = key;
    });
  }

  return result;
}

function expandClans(obj) {
  function acrToColor(acr) {
    switch (acr) {
      case 'B':
        return 'Black';
      case 'G':
        return 'Green';
      case 'R':
        return 'Red';
      case 'U':
        return 'Blue';
      case 'W':
        return 'White';
    }
  }

  function slashColors(acr) {
    return acr.split('').map(acrToColor).join('/');
  }

  function hyphenColors(acr) {
    return acr.split('').map(acrToColor).join('-');
  }

  function spaceColors(acr) {
    return acr.split('').map(acrToColor).join(' ');
  }

  return Object.assign(...map(obj, (value, key) => {
    let hyphenated = value.map(hyphenColors);
    let spaced = value.map(spaceColors);
    return {[key]: value.concat(hyphenated).concat(spaced)};
  }));
}

class DeckMerger extends stream.Writable {
  constructor() {
    super({objectMode: true});
    this._bad = 0;
    this._decks = {
      Standard: {},
      Modern: {},
      Legacy: {}
    };
  }

  async _write(event, encoding, callback) {
    await Promise.all(
      event.decklists.map((deck, index) => {
        if (deck.name == null || !deck.name.length) {
          this._bad++;
          return Promise.resolve();
        }

        let {name, format} = deck;
        name = normalize(name);
        colorTriplets.concat(colorPairs).forEach(seq => {
          if (name.includes(seq)) {
            name = name.replace(seq, seq.split(' ').join('-'));
          }
        });

        let normalized = consolidateName(
          name
            .split(/\s+/)
            .map(normalizeToken)
            .filter(token => token != null && token.length)
            .join(' '),
          format
        );

        if (!this._decks[format][normalized]) {
          this._decks[format][normalized] = [];
        }

        let arr = this._decks[format][normalized];
        arr.push(deck);

        let loc = ref
          .child(format)
          .child(normalized);
        let decks = loc.child('decks');
        let count = loc.child('count');
        return loc.set({
          decks: arr,
          count: arr.length
        });
      })
    );

    callback();
  }
}

function normalizeToken(token) {
  let maybeColor = token.replace(/\//g, '');
  if (maybeColor.length <= 3) {
    maybeColor = maybeColor.toUpperCase();
  }

  if (maybeColor in clans) {
    return clans[maybeColor];
  }

  return token;
}

function consolidateName(name, format) {
  switch (format) {
    case 'Standard':
      return consolidateStandardName(name);
    case 'Modern':
      return consolidateModernName(name);
    case 'Legacy':
      return consolidateLegacyName(name);
  }
}

function consolidateStandardName(name) {
  switch (name) {
    case '4 Color Collected Company':
      return '4 Color Company';
    case '4c Cryptolith Rite':
    case '4c Cryptolith':
    case 'Golgari Cryptolith Rite':
      return 'Cryptolith Rite';
    case 'Abzan Aggromorph':
    case 'Abzan Megamorph Control':
      return 'Abzan Megamorph';
    case 'Abzan':
    case 'Abzan Control':
    case 'Abzan Midragne':
    case 'Abzan Unwritten':
    case 'Hangarback Abzan':
    case 'Rattleclaw Abzan':
      return 'Abzan Midrange';
    case 'Atarka Red':
    case 'Atarka Sligh':
    case 'Boss Sligh':
    case 'Mono Red':
    case 'Mono Red Aggro':
    case 'Mono Red Dragon Aggro':
    case 'Red Aggro':
      return 'Red Deck Wins';
    case 'Aabzan Aggro':
    case 'Azban Aggro':
      return 'Abzan Aggro';
    case 'Bant Collected Company':
      return 'Bant Company';
    case 'Azorius Aggro':
      return 'Azorius Heroic';
    case 'Azorius Auras':
    case 'Bant Hexproof':
    case 'Naya Hexproof':
      return 'Hexproof Auras';
    case 'Black Devotion':
      return 'Mono Black Devotion';
    case 'Boros':
    case 'Boros Beatdown':
    case 'Boros Humans':
      return 'Boros Aggro';
    case 'Mardu Tokens':
      return 'Mardu Aggro';
    case 'Mardu':
    case 'Mardu Planeswalkers':
      return 'Mardu Midrange';
    case 'Abzan Rally':
    case 'Coco Rally':
    case 'Elf Rally':
    case 'Elvish Rally':
    case 'Four Color Rally':
    case 'Four Color Rally The Ancestors':
    case 'Four Colorly Rally The Ancestors':
    case '4 Color Rally':
      return 'Rally The Ancestors';
    case 'Abzan Constellation':
    case 'Golgari Constellation':
    case 'Golgari Enchantress':
    case 'Selesnya Constellation':
      return 'Constellation';
    case 'Esper Enchantment Control':
      return 'Esper Control';
    case 'Aggro Green Devotion':
    case 'Golgari Devotion':
    case 'Green Devotion With Red':
    case 'Red-Green Devotion':
      return 'Green Devotion';
    case 'Dark Jeskai':
      return 'Jeskai Black';
    case 'Four Color Midrange':
      return '4 Color Midrange';
    case 'Gruul':
    case 'Gruul Aggro':
    case 'Gruul Beatdown':
    case 'Gruul Midrange':
    case 'Gruul Savagery':
      return 'Gruul Monsters';
    case 'Gruul Eldrazi Ramp':
      return 'Gruul Eldrazi';
    case 'Gruul Goggle Ramp':
      return 'Goggles Ramp';
    case 'Izzet Dragons':
      return 'Izzet Control';
    case 'Izzet Thing In The Ice':
      return 'Izzet Control';
    case 'Izzet Thopters':
      return 'Izzet Ensoul Artifact';
    case 'Jeskai':
    case 'Jeskai Midrange':
    case 'Jeskai Tempo':
    case 'Jeskai Wins':
      return 'Jeskai Aggro';
    case 'Jeskai Ascendancy Combo':
    case 'Jeskai Heroic Combo':
    case 'Jeskai Token Combo':
      return 'Jeskai Ascendancy';
    case 'Jeskai Some Dragons':
      return 'Jeskai Dragons';
    case 'Jund':
    case 'Jund Monsters':
    case 'Jund Planeswalkers':
      return 'Jund Midrange';
    case 'Green':
      return 'Mono-Green';
    case 'Mono Green Aggro':
      return 'Stompy';
    case 'Mono Red Rabble':
      return 'Rabble Red';
    case 'Atarka Goblins':
    case 'Mono Red Goblins':
    case 'Mono-Red Goblins':
      return 'Goblins';
    case 'Mono Red Devotion':
      return 'Big Red';
    case 'Naya':
    case 'Naya Control':
    case 'Naya Megamorph':
    case 'Naya Monsters':
    case 'Naya Planeswalkers':
    case 'Naya Walkers':
      return 'Naya Midrange';
    case 'Orzhov Humans':
    case 'Orzhov Tokens':
    case 'Orzhov Warriors':
      return 'Orzhov Aggro';
    case 'Red Cruise':
      return 'Izzet Burn';
    case 'Selesnya Collected Company':
      return 'Selesnya Company';
    case '4 Color Whip':
    case 'Sultai Delve':
      return 'Sidisi Whip';
    case 'Temur Ascendancy':
    case 'Temur Aggro':
    case 'Temur Flash':
    case 'Temur Midrange':
    case 'Temur Monsters':
      return 'Temur';
    case 'White Weenie Humans':
    case 'Humans':
    case 'White Humans':
      return 'Mono White Humans';
    default:
      return name;
  }
}

function consolidateModernName(name) {
  switch (name) {
    case 'Abzan Collected Company':
    case 'Abzan Chord':
      return 'Abzan Company';
    case 'Abzan Midrange':
      return 'Abzan';
    case 'Ad Nauseum':
      return 'Ad Nauseam';
    case 'Chord Combo':
      return 'Kiki Chord';
    case 'Golgari Elves':
    case 'Selesnya Elves':
      return 'Elves';
    case '4 Color Gifts':
    case 'Azorius Gifts':
    case 'Esper Gifts':
      return 'Gifts Ungiven';
    case 'Auras':
    case 'Bogles':
    case 'Hexproof':
    case 'Selesnya Hexproof Auras':
      return 'Selesnya Hexproof';
    case 'Boros Burn':
    case 'Jeskai Burn':
    case 'Mardu Burn':
    case 'Mono Red':
    case 'Mono Red Burn':
    case 'Izzet Burn':
    case 'Naya Burn':
    case 'Rakdos Burn':
      return 'Burn';
    case 'Dredgevine':
      return 'Dredge';
    case 'Hatebear':
    case 'Death And Taxes':
    case 'Mono White Aggro':
    case 'Selesnya Hate Bears':
      return 'Selesnya Hatebears';
    case 'Faeries':
      return 'Dimir Faeries';
    case 'Gruul Urzatron':
    case 'Tron':
      return 'Gruul Tron';
    case 'Goryos Vengeance':
    case 'Goyro\'s Vengeance':
    case 'Grixis Goryo':
    case 'Vengeance':
      return 'Goryo\'s Vengeance';
    case 'Griselbrand':
      return 'Grishoalbrand';
    case 'Hangarback Affinity':
      return 'Affinity';
    case 'Izzet Splinter Twin':
      return 'Izzet Twin';
    case 'Izzet Storm':
      return 'Storm';
    case 'Jeskai Geist':
    case 'Jeskai Midrange':
      return 'Jeskai Flash';
    case 'Jeskai':
    case 'Jeskai Harbinger':
      return 'Jeskai Control';
    case 'Jund Midrange':
      return 'Jund';
    case 'Lantern':
    case 'Lantern Mill':
    case 'Lantern Prison':
      return 'Lantern Control';
    case 'Mefolk':
      return 'Merfolk';
    case 'Rock':
      return 'Golgari Midrange';
    case '4 Color Zoo':
    case 'Bant Zoo':
    case 'Bushwhacker Zoo':
    case 'Gruul Aggro':
    case 'Naya Aggro':
    case 'Naya Blitz':
    case 'Naya Zoo':
    case 'Tribal Zoo':
      return 'Zoo';
    case 'Naya Collected Company':
    case 'Zoo Company':
      return 'Naya Company';
    case 'Pyromancer Ascension':
      return 'Storm';
    case 'Selesnya Auras':
      return 'Selesnya Hexproof';
    case 'Simic Infect':
      return 'Infect';
    case 'Splinter Twin':
      return 'Izzet Twin';
    case 'Tarmo Twin':
      return 'Temur Twin';
    case 'Temur Midrange':
    case 'Temur Control':
      return 'Temur';
    case 'Gruul Breach':
    case 'Titan Breach':
    case 'Titan Scapeshift':
    case 'Though The Breach Scapeshift':
    case 'Through The Breach':
    case 'Through The Breach Scapeshift':
      return 'Through The Breach';
    case 'Dark Scapeshift':
    case 'Scapeshft':
    case 'Temur Scapeshift':
    case 'Bring To Light Scapeshift':
      return 'Scapeshift';
    default:
      return name;
  }
}

function consolidateLegacyName(name) {
  if (name.includes('Punishing')) {
    return 'Punishing Fire';
  }

  if (name.includes('Pox')) {
    return 'Pox';
  }

  if (name.includes('Loam')) {
    return 'Life From The Loam';
  }

  if (name.includes('Reanimator')) {
    return 'Reanimator';
  }

  if (name.includes('Stiflenaught') || name.includes('Stiflenought')) {
    return 'Stiflenought';
  }

  if (name.includes('Deathblade')) {
    return 'Deathblade';
  }

  if (name.includes('Stoneblade')) {
    return 'Stoneblade';
  }

  switch (name) {
    case 'Belcher':
      return 'Charbelcher';
    case 'Izzet Standstill':
    case 'Jeskai Landstill':
      return 'Lands';
    case '4 Color Delver':
      return 'Four Color Delver';
    case 'Azorius Counterbalance':
    case 'Azorius Miracles':
    case 'Jeskai Miracles':
    case 'Four Color Miracles':
      return 'Miracles';
    case 'Ad Nauseam Tendrils':
      return 'Ad Nauseam';
    case 'Shardess Sultai':
      return 'Shardless Sultai';
    case 'Cloudpost':
    case 'Simic Cloudpost':
    case 'Twelvepost':
      return '12 Post';
    case 'Boros Death And Taxes':
    case 'Death & Taxes':
    case 'Mono White Aggro':
      return 'Death And Taxes';
    case 'Deathblade':
      return 'Esper Deathblade';
    case 'Grixis Pyro':
      return 'Grixis Pyromancer';
    case 'Manaless Dredge':
      return 'Dredge';
    case 'Metal Worker':
    case 'Metalworker':
      return 'Mud';
    case 'Mono Red':
    case 'Mono Red Burn':
      return 'Burn';
    case 'Grixis Painter':
    case 'Izzet Painter':
    case 'Painted Stone':
    case 'Painter':
      return 'Imperial Painter';
    case 'Abzan Maverick':
    case 'Selesnya Mavrick':
      return 'Maverick';
    case 'Eureka Tell':
    case 'Infi Tell':
      return 'Omni Tell';
    case 'Sneak And Omni Show':
    case 'Show And Tell':
    case 'Sneak N Show':
      return 'Sneak And Show';
    case 'Doomsday Storm':
    case 'The Epic Storm':
      return 'Storm';
    default:
      return name;
  }
}

/*
function sortObject(obj) {
  return Object
    .keys(obj)
    .sort((a, b) => obj[a] > obj[b] ? -1 : 1)
    .filter(key => obj[key] >= 10)
    .map(key => `${key} => ${obj[key]}`);
}
*/

module.exports = DeckMerger;
