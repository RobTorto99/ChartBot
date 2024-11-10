import { Options } from 'highcharts'; // Añade esta línea

export interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  //attachment?: FileAttachment;
  showChart?: boolean;
  chartOptions?: Options; // Añadido
}


export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export interface FileAttachment {
  name: string;
  type: string;
  content?: string; // Cambia content a opcional
  preview?: string;
}