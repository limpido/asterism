import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export type Sentiment = 'recommended' | 'neutral' | 'critiqued';

export interface Node extends SimulationNodeDatum {
  id: number;
  title: string;
  author: string;
  genre: string;
  year?: number;
  coverUrl?: string;
  connectionCount?: number;
  inDegreeCount?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Link extends SimulationLinkDatum<Node> {
  id: number;
  source: number | Node;
  target: number | Node;
  quote: string;
  sentiment: Sentiment;
  isSameAuthor: boolean;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface GraphInteractionEvent {
  type: 'node' | 'link' | 'background';
  data?: Node | Link;
  x?: number;
  y?: number;
}