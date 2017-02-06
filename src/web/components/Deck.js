let client = require('../client');
let {connect} = require('react-redux');
let filterResults = require('../filterResults');
let forEach = require('lodash/collection/forEach');
let groupBy = require('lodash/collection/groupBy');
let moment = require('moment');
let sortBy = require('lodash/collection/sortBy');
let stringifyMonth = require('../stringifyMonth');

class Deck extends React.Component {
  constructor(props) {
    super(props);
    this._openDeck = this._openDeck.bind(this);
  }

  componentWillMount() {
    let {format, name} = this.props;
    client.syncResults(format, name);
  }

  componentDidMount() {
    this._componentDidRender();
  }

  componentDidUpdate() {
    this._componentDidRender();
  }

  _componentDidRender() {
    let {name, format} = this.props;
    document.title = `MTG Results | ${format} ${name}`;
    this._doUpdateGraphs();
  }

  _doUpdateGraphs() {
    this._doUpdatePopularityGraph();
    this._doUpdateMatchupsGraph();
  }

  _doUpdatePopularityGraph() {
    let{decks, format, name} = this.props;
    let list = decks[format][name].decks;
    let groups = groupBy(
      list.filter(deck => {
        let {date} = deck;
        return typeof date === 'number' && date > 0;
      }),
      deck => {
        let date = new Date(deck.date);
        return 12 * date.getFullYear() + date.getMonth();
      }
    );

    let data = [['Month', 'Frequency']];
    forEach(groups, (group, key) => {
      data.push([stringifyMonth(key), group.length]);
    });

    let chart = new google.visualization.LineChart(
      document.querySelector('.deck-popularity')
    );

    chart.draw(google.visualization.arrayToDataTable(data), {
      title: 'Popularity',
      curveType: 'function',
      legend: {position: 'none'},
      vAxis: {viewWindow: {min: 0}}
    });
  }

  _doUpdateMatchupsGraph() {
    let {results, format, name} = this.props;
    let data = filterResults(results[format], name);
    if (!Object.keys(data).length) {
      return;
    }

    let table = new google.visualization.DataTable();
    table.addColumn('number', 'Observations');
    table.addColumn('number', 'Win Pct');
    table.addColumn({type: 'string', role: 'tooltip'});

    for (let key in data) {
      let matches = data[key];
      let mwp = getMatchupWinPercentage(name, matches);
      table.addRows([[matches.length, mwp, `${key} - ${mwp}`]]);
    }

    let chart = new google.visualization.ScatterChart(
      document.querySelector('.deck-matchups')
    );

    chart.draw(table, {
      title: 'Matchup Win Percentage',
      hAxis: {title: 'Observations'},
      vAxis: {
        format: '#%',
        title: 'Win Pct',
        viewWindow: {min: 0, max: 1}
      },
    });
  }

  render() {
    let {decks, format, name} = this.props;
    let list = decks[format][name].decks;

    return <div className="content">
      <div className="deck-header">
        <h1>[{format}] {name}</h1>
        <div className="grid-deck-image"
             style={{backgroundImage: `url("/images/${format}/${name}.jpeg.png")`}}>
        </div>
      </div>
      <div className="deck-popularity"></div>
      <div className="deck-matchups"></div>
      <h2>Decklists</h2>
      <table className="deck-data">
        <thead>
          <tr>
            <th>Date</th>
            <th>Player</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {
            sortBy(list, 'date')
              .reverse()
              .map(deck => {
                return <tr onClick={() => this._openDeck(deck)}>
                  <td>{moment(deck.date).format('M/D/Y')}</td>
                  <td>{deck.player}</td>
                  <td>{deck.location}</td>
                </tr>;
              })
          }
        </tbody>
      </table>
    </div>
  }

  _openDeck(deck) {
    window.open(deck.link, '_blank');
  }
}

function getMatchupWinPercentage(name, group) {
  let wins = group.reduce((count, match) => {
    let {p1, p2, winner} = match;
    if ((winner === 1 && p1 === name) ||
        (winner === 2 && p2 === name)) {
      return count + 1;
    }

    return count;
  }, 0);

  return wins / group.length;
}

function mapStateToProps(state) {
  let {pathname} = state.routing.locationBeforeTransitions;
  let parts = pathname.split('/');
  let name = parts[parts.length - 1];

  return {
    format: state.format,
    decks: state.decks,
    results: state.results,
    name
  };
}

module.exports = connect(mapStateToProps)(Deck);
