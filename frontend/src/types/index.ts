import { Options } from 'highcharts'; // Añade esta línea

export interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  showChart?: boolean;
  chartOptions?: Options; // Añadido
  attachment?: FileAttachment; // Agregamos attachment como opcional
  canvasCode?: string;  
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
  content: string[][]; // O el tipo que corresponda
  preview: string[][]; // O el tipo que corresponda
}