export interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  showChart?: boolean;
  chartOptions?: Highcharts.Options;
  attachment?: File;
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
  preview: string[][];
}
