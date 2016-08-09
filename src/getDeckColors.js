let clanColors = {
  Black: ['black'],
  Blue: ['blue'],
  Green: ['green'],
  Red: ['red'],
  White: ['khaki'],

  Azorius: ['blue', 'khaki'],
  Boros: ['red', 'khaki'],
  Dimir: ['black', 'blue'],
  Golgari: ['black', 'green'],
  Gruul: ['green', 'red'],
  Izzet: ['blue', 'red'],
  Orzhov: ['black', 'khaki'],
  Rakdos: ['black', 'red'],
  Selesnya: ['green', 'khaki'],
  Simic: ['blue', 'green'],

  Esper: ['blue', 'khaki', 'black'],
  Bant: ['blue', 'khaki', 'green'],
  Jeskai: ['blue', 'khaki', 'red'],
  Mardu: ['red', 'khaki', 'black'],
  Naya: ['red', 'khaki', 'green'],
  Sultai: ['black', 'blue', 'green'],
  Grixis: ['black', 'blue', 'red'],
  Jund: ['black', 'green', 'red'],
  Abzan: ['black', 'green', 'khaki'],
  Temur: ['green', 'red', 'blue']
};

function getDeckColors(deck) {
  for (let key in clanColors) {
    if (deck.includes(key)) {
      return clanColors[key];
    }
  }

  switch (deck) {
    case 'Affinity':
    case 'Eldrazi':
      return ['gray'];
    case 'Burn':
      return clanColors.Naya;
    case 'Death And Taxes':
      return ['khaki'];
    case 'Four Color Delver':
      return ['black', 'blue', 'green', 'red'];
    case 'Infect':
      return clanColors.Simic;
    case 'Merfolk':
      return ['blue'];
    case 'Miracles':
      return clanColors.Azorius;
    case 'Scapeshift':
      return clanColors.Temur;
    case 'Sneak And Show':
      return clanColors.Izzet;
    case 'Storm':
      return clanColors.Grixis;
  }

  return ['white'];
}

module.exports = getDeckColors;
