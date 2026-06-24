export type HoleStatus = 'PENDING' | 'DRILLED' | 'INJECTED' | 'COMPLETED';

export interface Hole {
  seq: string;
  id: string;
  name?: string;
  depth: number; // planned depth
  drilledDepth?: number; // executed depth
  cement: number; // planned cement
  injectedCement?: number; // executed cement
  location: string;
  block: string;
  status: HoleStatus;
  drilledAt?: string;
  injectedAt?: string;
  completedAt?: string;
  drillingStartDate?: string;
  drillingEndDate?: string;
  injectionStartDate?: string;
  injectionEndDate?: string;
}
