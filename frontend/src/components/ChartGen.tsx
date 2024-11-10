// src/components/ChartGen.tsx
import React, { useState, useEffect } from 'react';
import HighchartsChart from './HighchartsChart';
import { Options } from 'highcharts';

interface ChartGenProps {
  prompt: string;
}

const ChartGen: React.FC<ChartGenProps> = ({ prompt }) => {
  const [chartOptions, setChartOptions] = useState<Options | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!prompt) return;

    // Reemplaza 'your-backend-api-url' con tu endpoint real de la API
    const apiUrl = 'https://your-backend-api-url/chart-data';

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`La solicitud a la API falló con el estado ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const { visualization_code, visualization_explanation } = data;

        if (!visualization_code) {
          throw new Error('La respuesta de la API no contiene visualization_code');
        }

        let options: Options;
        try {
          options = JSON.parse(visualization_code);
        } catch (err) {
          throw new Error('Error al parsear visualization_code: ' + err);
        }

        setChartOptions(options);
        setExplanation(visualization_explanation || null);
      })
      .catch((err) => {
        console.error('Error al obtener los datos del gráfico:', err);
        setError(err.message);
      });
  }, [prompt]);

  if (error) {
    return <div>Error al cargar los datos del gráfico: {error}</div>;
  }

  if (!chartOptions) {
    return <div>Cargando datos del gráfico...</div>;
  }

  return (
    <div>
      {explanation && <p>{explanation}</p>}
      <HighchartsChart options={chartOptions} />
    </div>
  );
};

export default ChartGen;
