let {Link} = require('react-router');
let getDeckColors = require('../../getDeckColors');
let times = require('lodash/utility/times');

function GridDeck(props) {
  let colors = getDeckColors(props.name);
  return <Link className="grid-deck"
               to={`/decks/${props.format}/${props.name}`}>
    <div className="grid-deck-background">
      {
        times(colors.length, i => {
          let style = {
            backgroundColor: colors[i % colors.length],
            width: (100 / colors.length) + '%'
          };

          return <div className="grid-deck-stripe" style={style}></div>;
        })
      }
    </div>
    <div className="grid-deck-container">
      <div className="grid-deck-image"
           style={{backgroundImage: `url("/images/${props.format}/${props.name}.jpeg.png")`}}>
      </div>
      <div className="grid-deck-text">
        <div className="grid-deck-name">
          {props.name}
        </div>
        <div className="grid-deck-stats">
          {props.count} decks | {fmtPercent(props.freq)}%
        </div>
      </div>
    </div>
  </Link>;
}

function fmtPercent(pct) {
  let whole = Math.floor(100 * pct);
  let decimal = Math.floor(10000 * pct) % 100;
  return whole + '.' + decimal;
}

module.exports = GridDeck;
