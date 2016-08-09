let {Link} = require('react-router');

function Topbar() {
  return <div className="topbar">
    <Link className="topbar-brand" to="/">MTG Results</Link>
  </div>
}

module.exports = Topbar;
