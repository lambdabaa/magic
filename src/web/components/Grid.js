let GridDeck = require('./GridDeck');
let {connect} = require('react-redux');
let filter = require('../../filter');
let flatten = require('lodash/array/flatten');
let stringifyMonth = require('../stringifyMonth');
let {update} = require('../state');
let values = require('lodash/object/values');

class Grid extends React.Component {
  constructor(props) {
    super(props);

    this._setFormat = this._setFormat.bind(this);
  }

  componentDidMount() {
    this._componentDidRender();
  }

  componentDidUpdate() {
    this._componentDidRender();
  }

  _componentDidRender() {
    document.title = 'MTG Results';
    this._doUpdateMetagameGraph();
  }

  _doUpdateMetagameGraph() {
    let {decks, format} = this.props;
    let metagame = decks[format];
    let past3Months = pastMonths(3);
    let top = {};
    let all = {};
    for (let key in metagame) {
      all[key] = metagame[key].decks;
      if (metagame[key].decks.filter(past3Months).length >= 3) {
        top[key] = metagame[key].decks;
      }
    }

    let deckNames = Object.keys(top);
    if (!deckNames.length) {
      return;
    }

    let data = [['Month'].concat(deckNames)];
    let monthToMetagame = {};
    for (let name in all) {
      let list = all[name];
      for (let key in list) {
        let deck = list[key];
        let date = new Date(deck.date);
        let month = 12 * date.getFullYear() + date.getMonth();
        if (!monthToMetagame[month]) {
          monthToMetagame[month] = {};
        }

        if (!monthToMetagame[month][name]) {
          monthToMetagame[month][name] = [];
        }

        monthToMetagame[month][name].push(deck);
      }
    }

    let today = new Date();
    let threshold = 12 * today.getFullYear() + today.getMonth() - 18;
    Object
      .keys(monthToMetagame)
      .map(month => +month)
      .sort()
      .forEach(month => {
        if (month < threshold) {
          return;
        }

        let meta = monthToMetagame[month];
        let total = flatten(values(meta)).length;
        data.push([stringifyMonth(month)].concat(
          deckNames.map(name => {
            return meta[name] ? meta[name].length / total : 0;
          })
        ));
      });


    let chart = new google.visualization.LineChart(
      document.querySelector('.metagame-graph')
    );

    chart.draw(google.visualization.arrayToDataTable(data), {
      title: `${format} Meta`,
      curveType: 'function',
      vAxis: {
        format: '#%',
        viewWindow: {min: 0, max: 0.3}
      }
    });
  }

  render() {
    let {decks, format} = this.props;
    let past3Months = pastMonths(3);

    let total = {
      Legacy: {},
      Modern: {},
      Standard: {}
    };

    let recent = {
      Legacy: {},
      Modern: {},
      Standard: {}
    };

    let sum = {
      Legacy: 0,
      Modern: 0,
      Standard: 0
    };

    let top = filter(decks[format], (group, name) => {
      let {decks} = group;
      let period = decks.filter(past3Months).length;
      total[format][name] = decks.length;
      recent[format][name] = period;
      sum[format] += period;
      return period >= 3;
    });

    return <div className="content grid">
      <div className="grid-tabs">
        {
          ['Standard', 'Modern', 'Legacy'].map(aFormat => {
            let style = {};
            if (aFormat === format) {
              style.fontWeight = 'bold';
              style.textDecoration = 'underline';
            }

            return <div className="grid-tab"
                        key={aFormat}
                        style={style}
                        onClick={() => this._setFormat(aFormat)}>
              {aFormat}
            </div>;
          })
        }
      </div>
      <div className="metagame-graph"></div>
      {
        Object
          .keys(top)
          .sort((a, b) => {
            a = top[a].decks.filter(past3Months);
            b = top[b].decks.filter(past3Months);
            return a.length > b.length ? -1 : 1;
          })
          .map(name => {
            return <GridDeck key={name}
                             format={format}
                             name={name}
                             group={top[name]}
                             count={total[format][name]}
                             freq={recent[format][name] / sum[format]} />;
          })
      }
    </div>
  }

  _setFormat(format) {
    update({format});
  }
}

function mapStateToProps(state) {
  return {
    format: state.format,
    decks: state.decks
  };
}

function pastMonths(n) {
  let cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - n);
  return function(deck) {
    return deck.date > cutoff.getTime();
  };
}

module.exports = connect(mapStateToProps)(Grid);
