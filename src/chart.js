import React from 'react'
import { Chart } from 'react-charts'

function LineChart(props) {
    const data = React.useMemo(
        () => [
            {
                label: 'Price/Time',
                data: props.data.map((value) => [value.p, `${new Date(value.t).getHours()}:${new Date(value.t).getMinutes()}`])
            }
        ], [props.data]
    );

    const axes = React.useMemo(
        () => [
          { primary: true, type: 'linear', position: 'bottom' },
          { type: 'linear', position: 'left' }
        ],
        []
      );

    if(props.data && props.data.length) {
        return (
            <div style={{width: '400px', height: '300px'}}>
              <Chart data={data} axes={axes} />
            </div>
          );
    } else {
        return (<div></div>)
    }
}

export default LineChart;
