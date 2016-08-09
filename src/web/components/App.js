let Topbar = require('./Topbar');

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <div className="app">
      <Topbar />
      {this.props.children}
    </div>;
  }
}

module.exports = App;
