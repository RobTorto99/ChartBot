export interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  showChart?: boolean;
  chartOptions?: Highcharts.Options; // Añadido
  attachment?: File; // Agregamos attachment como opcional
  canvasCode?: string;  
}


export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export interface FileAttachment {
  file: File;
  name: string;
  type: string;
  //content: any; // O el tipo que corresponda
  preview: string[][]; // O el tipo que corresponda
}
