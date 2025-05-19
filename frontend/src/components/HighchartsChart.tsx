import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import exporting from 'highcharts/modules/exporting';

// Inicializa el módulo de exportación
if (typeof Highcharts === 'object') {
  exporting(Highcharts);
}

interface HighchartsChartProps {
  options: Highcharts.Options;
}

const HighchartsChart: React.FC<HighchartsChartProps> = ({ options }) => (
  <HighchartsReact
    highcharts={Highcharts}
    options={options}
    containerProps={{
      style: {
        width: '100%',
        height: '600px',
        backgroundColor: '#2a2a2b',
        padding: '20px',
        boxSizing: 'border-box',
      },
    }}
  />
);

export default HighchartsChart;
