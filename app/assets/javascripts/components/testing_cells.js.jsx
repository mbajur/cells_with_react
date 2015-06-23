var TestingCells = React.createClass({
  propTypes: {
    param1: React.PropTypes.string,
    param2: React.PropTypes.string
  },

  render: function() {
    return (
      <div>
        <div>Param1: {this.props.param1}</div>
        <div>Param2: {this.props.param2}</div>
      </div>
    );
  }
});
