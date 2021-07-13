import './App.css';
import React from 'react';
import Autocomplete from 'react-autocomplete';
import LineChart from './chart';
import Loader from "react-loader-spinner";



class App extends React.Component {
  timeout = 250;

  constructor(props) {
    super(props);
    this.symbols = ['GOOG','FB','BLKB','JKHY','TXN', 'APPL'];
    this.state = { quote: {}, ws: null, symbol: '', searchResults: [], companyProfile: {}, chartData: [], historicalData: {}, intraDayData: {}, isLoading: true };
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
    this.setState({isLoading: false});
  }

  prevValue = '';
  acceptIteration = 0;

  fetchSymbol = (value) => {
    this.setState({symbol: value});
      if(value !== this.prevValue) {
        this.prevValue = value;
        const currentIteration = this.acceptIteration + 1;
        this.acceptIteration = this.acceptIteration + 1;
        this.setState({isLoading: true});
        fetch('https://finnhub.io/api/v1/search?token=sandbox_c3k6e62ad3i8d96rtedg&q='+value)
          .then(response => {
            this.setState({isLoading: false});
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
    this.setState({chartData: [], companyProfile: {}});
    let firstL = true;
    let secL = true;
    let thL = true;
    let frL = true;
    let fvL = false;
    this.setState({isLoading: firstL || secL || thL || frL || fvL});
    fetch('https://finnhub.io/api/v1/stock/profile2?token=c3k6e62ad3i8d96rted0&symbol=' + value)
      .then(response => {
        firstL = false;
        this.setState({isLoading: firstL || secL || thL || frL || fvL});
        if(response.ok) {
          return response.json();
        }
      })
      .then(data => this.setState({companyProfile: data}))
      .catch();
    fetch('https://finnhub.io/api/v1/quote?token=c3k6e62ad3i8d96rted0&symbol=' + value)
      .then(response => {
        secL = false;
        this.setState({isLoading: firstL || secL || thL || frL || fvL});
        if(response.ok) {
          return response.json();
        }
      })
      .then(data => this.setState({quote: data}))
      .catch();
      fetch('https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&apikey=SLA6RKOKBU1CLU3G&symbol=' + value)
        .then(response => {
          thL = false;
          this.setState({isLoading: firstL || secL || thL || frL || fvL});
          if(response.ok) {
            return response.json();
          }
        })
        .then(data => {
          if(data && data['Time Series (Daily)']) {
            const historicalData = Object.keys(data['Time Series (Daily)'])
            .map(key => {return (
                {'p': data['Time Series (Daily)'][key]['5. adjusted close'], 't': key})});
            this.setState({historicalData: historicalData})} else {
              this.setState({historicalData: []})
            }
          })
          .catch();
        fetch('https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&interval=5min&adjusted=false&apikey=SLA6RKOKBU1CLU3G&outputsize=compact&symbol=' + value)
        .then(response => {
          frL = false;
          this.setState({isLoading: firstL || secL || thL || frL || fvL});
          if(response.ok) {
            return response.json();
          }
        })
        .then(data => {
          if(data && data['Time Series (5min)']) {
            const intraDayData = Object.keys(data['Time Series (5min)'])
            .map(key => {return (
                {'p': data['Time Series (5min)'][key]['4. close'], 't': key})});
            this.setState({intraDayData: intraDayData});
          }  else {
            this.setState({intraDayData: []})
          }  
        })
        .catch();
    this.state.ws.send(JSON.stringify({type: 'susbscribe', symbol: value}));
    this.setState({symbol: value});
  }

  showLoader = () => {
    if(this.state.isLoading) {
      return (
      <div className="loading">
      <Loader
                type="Puff"
                color="#00BFFF"
                height={100}
                width={100}
                timeout={30000} 
              /></div>);
    }
  }

  renderCharts = () => {  
    if(this.state.historicalData.length || this.state.intraDayData.length) {
          return (<div className="quote-info quote-info-chart" style={{height: '400px'}}>
          {this.state.historicalData.length ? <LineChart data={this.state.historicalData}><div style={{color: 'black', textAlign: 'center', fontSize: '14px'}}>Last 3 months price graph(daily close)</div></LineChart> : null}
          {this.state.intraDayData.length ? <LineChart data={this.state.intraDayData}><div style={{color: 'black', textAlign: 'center', fontSize: '14px'}}>Last 8 hours price graph(5 min interval)</div></LineChart> : null}
        </div>
        );
      } else if(this.state.historicalData.length === 0 && this.state.intraDayData.length === 0) {
        return (
          <div className="quote-info" style={{height: '100px', color: 'black', 'fontSize': '14px'}}>
            Error while fetch graph information, please try with another symbol
          </div>
        );
      }
  }

  renderQuoteInfo = () => {
    if((this.state.companyProfile && this.state.companyProfile.name) || (this.state.quote && this.state.quote.p)) {
      return (
        <div className="quote-info">
          <div className="pane">
            <img src={this.state.companyProfile.logo} alt={this.state.companyProfile.name}/>
            <span>Company Name: {this.state.companyProfile.name}</span>
            <span>Industry: {this.state.companyProfile.finnhubIndustry}</span>
          </div>
          <div className="pane">
            <span>Exchange Name: {this.state.companyProfile.exchange}</span>
            <span>Currency: {this.state.companyProfile.currency}</span>
            <span>Closing Price: {this.state.quote ? this.state.quote.c : '--'}</span>
            <span>High Price: {this.state.quote ? this.state.quote.h : '--'}</span>
            <span>Low Price: {this.state.quote ? this.state.quote.l : '--'}</span>
            <span>Open Price: {this.state.quote ? this.state.quote.o : '--'}</span>
          </div>
        </div>
      );
    }
  }

  render() {
      return (
        <div className="App">
          <header className="App-header">
            {this.showLoader()}
            <div style={{zIndex:1001}}>
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
            </div>
            {this.renderCharts()}
            {this.renderQuoteInfo()}
          </header>
        </div>
      );
    }
}

export default App;
