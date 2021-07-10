import './App.css';
import React from 'react';
import Autocomplete from 'react-autocomplete';
import LineChart from './chart';



class App extends React.Component {
  timeout = 250;

  constructor(props) {
    super(props);
    this.symbols = ['GOOG','FB','BLKB','JKHY','TXN', 'APPL'];
    this.state = { quote: {}, ws: null, symbol: '', searchResults: [], companyProfile: {}, chartData: [] };
  }

  connect = () => {
    var ws = new WebSocket("wss://ws.finnhub.io?token=c3k6e62ad3i8d96rted0");

    ws.onopen = () => {
        console.log("connected websocket main component");
        this.setState({ ws: ws });
    };

    ws.onmessage = evt => {
      const message = JSON.parse(evt.data)
      if(message.type === 'trade') {
        const data = [...this.state.chartData, message.data.filter(trade => trade.s.toUpperCase() === this.state.symbol.toUpperCase())];
        this.setState({chartData: data});
      } else {
        console.log(message);
      }
      this.setState({dataFromServer: message})
      
    }

    ws.onclose = e => {
        console.log('Socket is closed.', e.reason);
    };

    ws.onerror = err => {
        console.error(
            "Socket encountered error: ",
            err.message,
            "Closing socket"
        );
        ws.close();
    };
  };

  componentDidMount = () => {
    this.connect();
  }

  prevValue = '';
  acceptIteration = 0;

  fetchSymbol = (value) => {
    this.setState({symbol: value});
      if(value.length >= 3 && value !== this.prevValue) {
        this.prevValue = value;
        const currentIteration = this.acceptIteration + 1;
        this.acceptIteration = this.acceptIteration + 1;
        fetch('https://finnhub.io/api/v1/search?token=sandbox_c3k6e62ad3i8d96rtedg&q='+value)
          .then(response => {
            if(response.ok) {
              return response.json()
            }
          })
          .then(data => {
            if(this.acceptIteration === currentIteration) {
              this.setState({searchResults: data.result});
              this.acceptIteration = 0;
            }
          })
          .catch();
      }
  }

  clearSearchResults = () => {
    this.setState({searchResults: []});
  }

  selectSymbol = (value) => {
    if(this.state.symbol) {
      this.state.ws.send(JSON.stringify({type: 'unsusbscribe', symbol: this.state.symbol}));
    }
    this.setState({chartData: []});
    fetch('https://finnhub.io/api/v1/stock/profile2?token=c3k6e62ad3i8d96rted0&symbol=' + value)
      .then(response => {
        if(response.ok) {
          return response.json();
        }
      })
      .then(data => this.setState({companyProfile: data}));
    fetch('https://finnhub.io/api/v1/quote?token=sandbox_c3k6e62ad3i8d96rtedg&symbol=' + value)
      .then(response => {
        if(response.ok) {
          return response.json();
        }
      })
      .then(data => this.setState({quote: data}));
    this.state.ws.send(JSON.stringify({type: 'susbscribe', symbol: value}));
    this.setState({symbol: value});
  }

  renderQuoteInfo = () => {
    if((this.state.companyProfile && this.state.companyProfile.name) || (this.state.quote && this.state.quote.p)) {
      return (
        <div className="quote-info">
          <LineChart data={this.state.chartData}></LineChart>
          <div className="pane">
            <img src={this.state.companyProfile.logo} alt={this.state.companyProfile.name}/>
            <span>Company Name: {this.state.companyProfile.name}</span>
            <span>Industry: {this.state.companyProfile.finnhubIndustry}</span>
          </div>
          <div className="pane">
            <span>Exchange Name: {this.state.companyProfile.exchange}</span>
            <span>Currency: {this.state.companyProfile.currency}</span>
            <span>Closing Price: {this.state.quote.c}</span>
            <span>High Price: {this.state.quote.h}</span>
            <span>Low Price: {this.state.quote.l}</span>
            <span>Open Price: {this.state.quote.o}</span>
          </div>
        </div>
      );
    }
  }

  render() {
      return (
        <div className="App">
          <header className="App-header">            
            <Autocomplete
              getItemValue={(item) => item.symbol}
              items={this.state.searchResults}
              renderItem={(item, isHighlighted) =>
                <div style={{ background: isHighlighted ? 'lightgray' : 'white', textAlign: 'left', color: 'black', fontSize: '13px', cursor: 'pointer' }}>
                  {[item.description, item.displaySymbol, item.symbol].join('  ')}
                </div>
              }
              value={this.state.symbol}
              onChange={(e) => this.fetchSymbol(e.target.value)}
              onSelect={(val) => this.selectSymbol(val)}
            />
            {this.renderQuoteInfo()}
          </header>
        </div>
      );
    }
}

export default App;
