import logo from './logo.svg';
import './App.css';
import React from 'react';



class App extends React.Component {
  constructor(props) {
    super(props);
    this.symbols = ['GOOG','FB','BLKB','JKHY','TXN', 'APPL'];
    this.state = { _data: {} };
  }

  componentDidMount = () => {
    fetch('api?symbols='  + this.symbols.join(',')).then(data => this.setState({_data: data}))
  }

  render() {
      return (
        <div className="App">
          <header className="App-header">
            <div className="marquee">
              <span>
                {
                  this.symbols.map(Symbol => {
                    return (Symbol + ':' + 
                              ( (this.state['_data'] && this.state['_data'][Symbol] &&this.state['_data'][Symbol].price.currencySymbol) || ' ') + 
                              ((this.state['_data'] && this.state['_data'][Symbol] && this.state['_data'][Symbol].price.regularMarketPrice) || 'Fetching Data '));
                  })
                }
              </span>
            </div>
          </header>
        </div>
      );
    }
}

export default App;
