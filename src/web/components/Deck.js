let {connect} = require('react-redux');
let forEach = require('lodash/collection/forEach');
let groupBy = require('lodash/collection/groupBy');
let moment = require('moment');
let sortBy = require('lodash/collection/sortBy');

class Deck extends React.Component {
  constructor(props) {
    super(props);
    this._openDeck = this._openDeck.bind(this);
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
    this._doUpdateGraph();
  }

  _doUpdateGraph() {
    let {decks, format, name} = this.props;
    let list = decks[format][name].decks;
    let date = new Date().getTime();
    let dist = 30 * 24 * 60 * 60 * 1000;
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

    let options = {
      title: 'Popularity',
      curveType: 'function',
      legend: {position: 'none'},
      vAxis: {viewWindow: {min: 0}}
    };

    let chart = new google.visualization.LineChart(
      document.querySelector('.deck-popularity')
    );

    chart.draw(
      google.visualization.arrayToDataTable(data),
      options
    );
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
      <div className="deck-popularity">
      </div>
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

/*
function stringifyMonth(idx) {
  let year = Math.floor(idx / 12);
  let month = idx % 12;
  let name;
  switch (month) {
    case 0:
      name = 'Jan';
      break;
    case 1:
      name = 'Feb';
      break;
    case 2:
      name = 'Mar';
      break;
    case 3:
      name = 'Apr';
      break;
    case 4:
      name = 'May';
      break;
    case 5:
      name = 'Jun';
      break;
    case 6:
      name = 'Jul';
      break;
    case 7:
      name = 'Aug';
      break;
    case 8:
      name = 'Sep';
      break;
    case 9:
      name = 'Oct';
      break;
    case 10:
      name = 'Nov';
      break;
    case 11:
      name = 'Dec';
      break;
  }

  return `${name} '${year % 100}`;
}
*/

function stringifyMonth(idx) {
  let year = Math.floor(idx / 12);
  let month = idx % 12;
  return `${month + 1}/${year % 100}`;
}

function mapStateToProps(state) {
  let {pathname} = state.routing.locationBeforeTransitions;
  let parts = pathname.split('/');
  let name = parts[parts.length - 1];

  return {
    format: state.format,
    decks: state.decks,
    name
  };
}

module.exports = connect(mapStateToProps)(Deck);
