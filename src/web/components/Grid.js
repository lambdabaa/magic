let GridDeck = require('./GridDeck');
let {connect} = require('react-redux');
let filter = require('../../filter');
let {update} = require('../state');

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
  }

  render() {
    let {decks, format} = this.props;
    let past3Months = pastMonths(3);
    let pct = {
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
      let recent = group.decks.filter(past3Months).length;
      pct[format][name] = recent;
      sum[format] += recent;
      return recent >= 3;
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
                             count={pct[format][name]}
                             freq={pct[format][name] / sum[format]} />;
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
