
export type UserRole = 'MASTER' | 'STANDARD';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Simulated hash
  role: UserRole;
  createdAt: string;
}

export type ProposalStatus = 
  | 'Pendente' 
  | 'Em Análise' 
  | 'Aprovada' 
  | 'Reprovada' 
  | 'Cancelada' 
  | 'Aguardando IN100'
  | 'Pago'; 

export type ProposalType = 'Novo' | 'Portabilidade' | 'Refinanciamento' | 'Cartão' | 'NOVO';

export interface ProposalHistory {
  status: string; // Allow generic string for CSV history
  date: string;
  note?: string;
}

export interface Proposal {
  id: string;
  date: string;
  client: string;
  salesperson: string;
  value: number;
  status: ProposalStatus; // Normalized status for System Logic (Colors, KPIs)
  csvStatus?: string;     // Raw status from CSV column dsc_situicao_emprestimo
  type: ProposalType;
  observation: string;
  lastUpdated: string;
  bank?: string;
  contractNumber?: string;
  history?: ProposalHistory[];
}

export interface KPI {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  totalValue: number;
}