import React from 'react'
import { Chart } from 'react-charts'

function LineChart(props) {
  let i = 0;
    const data = React.useMemo(
        () => [
            {
                label: 'Price/Time',
                data: props.data.map((value) => [new Date(value.t).getTime(), value.p])
            }
        ], [props.data]
    );

    const axes = React.useMemo(
        () => [
          { primary: true, type: 'time', position: 'bottom' },
          { type: 'linear', position: 'left' }
        ],
        []
      );

    if(props.data && props.data.length) {
        return (
            <div style={{width: '45%', height: '300px', margin: '16px'}}>
              {props.children}
              <Chart data={data} axes={axes} />
            </div>
          );
    } else {
        return (<div></div>)
    }
}

export default LineChart;
