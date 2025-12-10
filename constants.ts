
import { Proposal, User } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@sistema.com',
    passwordHash: 'e10adc3949ba59abbe56e057f20f883e', // "123456" in mock md5
    role: 'MASTER',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Vendedor Padrão',
    email: 'vendedor@sistema.com',
    passwordHash: 'e10adc3949ba59abbe56e057f20f883e',
    role: 'STANDARD',
    createdAt: new Date().toISOString()
  }
];

// Helper function to map CSV status to App Status (Normalized)
const mapStatus = (csvStatus: string): any => {
  const upper = csvStatus?.toUpperCase() || '';
  if (upper.includes('CANCELADO')) return 'Cancelada';
  if (upper.includes('DESEMBOLSADO')) return 'Pago'; // Maps Desembolsado to Pago
  if (upper.includes('AGUARDANDO IN100')) return 'Aguardando IN100';
  if (upper.includes('EM ANÁLISE') || upper.includes('MESA')) return 'Em Análise';
  if (upper.includes('APROVADA')) return 'Aprovada';
  if (upper.includes('REPROVADA') || upper.includes('RECUSADA')) return 'Reprovada'; // Add mapping for Reprovada
  return 'Pendente';
};

// Helper function to map CSV Type
const mapType = (csvType: string): any => {
  const upper = csvType?.toUpperCase() || '';
  if (upper.includes('PORTABILIDADE')) return 'Portabilidade';
  if (upper.includes('REFINANCIAMENTO')) return 'Refinanciamento';
  if (upper.includes('CARTÃO')) return 'Cartão';
  return 'Novo'; // Default to Novo (handles "NOVO")
};

// Data parsed from the provided CSV file with correct mappings
// Dates strictly correspond to 'created_at' column
export const MOCK_CSV_DATA: Proposal[] = [
  { 
    id: '0615fd72-63f7-4d79-a92d-758561228c30', 
    date: '2025-12-08T08:10:00Z', // Mapped from created_at "08/12/2025 08:10"
    client: 'Maria Helena da Silva', 
    salesperson: '07829815348_0001', 
    value: 22349.90, 
    status: mapStatus('Desembolsado'), 
    csvStatus: 'Desembolsado', 
    type: mapType('NOVO'), 
    bank: 'BCO DO BRASIL S.A.',
    contractNumber: '123456789/JDD',
    observation: 'Contrato pago com sucesso', 
    lastUpdated: '2025-12-08T08:47:00Z',
    history: [
      { status: 'Rascunho', date: '2025-12-08T08:10:00Z', note: 'Registro Criado com IN100' },
      { status: 'Operação Desembolsada (paga)', date: '2025-12-08T08:47:00Z', note: 'Contrato pago com sucesso' }
    ]
  },
  // DUPLICATE CONTRACT TEST CASE:
  { 
    id: '0615fd72-DUPLICATE-TEST', 
    date: '2025-12-08T08:00:00Z', 
    client: 'Maria Helena da Silva', 
    salesperson: '07829815348_0001', 
    value: 22349.90, 
    status: mapStatus('Desembolsado'),
    csvStatus: 'Desembolsado',
    type: mapType('NOVO'), 
    bank: 'BCO DO BRASIL S.A.',
    contractNumber: '123456789/JDD', 
    observation: 'Linha duplicada para teste', 
    lastUpdated: '2025-12-08T08:40:00Z'
  },
  { 
    id: 'ee559051-f249-4a03-b32d-85ddcba866ba', 
    date: '2025-12-08T08:00:00Z', // Mapped from created_at "08/12/2025 08:00"
    client: 'Antônio Carlos Souza', 
    salesperson: '05791773510_0001', 
    value: 5000.00, 
    status: mapStatus('Desembolsado'),
    csvStatus: 'Desembolsado',
    type: mapType('NOVO'),
    bank: 'CAIXA ECONOMICA FEDERAL',
    contractNumber: '987654321/MAD',
    observation: 'Contrato pago com sucesso', 
    lastUpdated: '2025-12-08T08:22:00Z',
    history: [
      { status: 'Rascunho', date: '2025-12-08T08:00:00Z', note: 'Registro Criado com IN100' },
      { status: 'Operação Desembolsada (paga)', date: '2025-12-08T08:22:00Z', note: 'Contrato pago com sucesso' }
    ]
  },
  { 
    id: 'f5bb3106-8203-40a0-b999-e8fd8b027d22', 
    date: '2025-12-08T07:55:00Z', // Mapped from created_at "08/12/2025 07:55"
    client: 'Josefa Ferreira dos Santos', 
    salesperson: '07030471598_0001', 
    value: 1663.73, 
    status: mapStatus('Cancelado Permanentemente'), 
    csvStatus: 'Cancelado Permanentemente',
    type: mapType('NOVO'),
    bank: 'BCO DO BRASIL S.A.',
    contractNumber: '123456789/MLS',
    observation: 'Operação cancelada pelo operador', 
    lastUpdated: '2025-12-08T08:49:00Z',
    history: [
      { status: 'Rascunho', date: '2025-12-08T07:55:00Z', note: 'Registro Criado sem IN100' },
      { status: 'Cancelado Permanentemente', date: '2025-12-08T08:49:00Z', note: 'Dívida cancelada manualmente' }
    ]
  },
  { 
    id: 'edfe8642-9a5a-4fac-97a9-f85b609811eb', 
    date: '2025-12-08T08:07:00Z', // Mapped from created_at "08/12/2025 08:07"
    client: 'Pedro Paulo da Rocha', 
    salesperson: '07030471598_0001', 
    value: 1663.73, 
    status: mapStatus('Cancelado Permanentemente'), 
    csvStatus: 'Cancelado Permanentemente',
    type: mapType('NOVO'),
    bank: 'BCO DO BRASIL S.A.',
    contractNumber: '987654321/MLS', 
    observation: 'Operação cancelada pelo operador', 
    lastUpdated: '2025-12-08T08:49:00Z',
    history: [
      { status: 'Rascunho', date: '2025-12-08T08:07:00Z', note: 'Registro Criado sem IN100' },
      { status: 'Cancelado Permanentemente', date: '2025-12-08T08:49:00Z', note: 'Dívida cancelada permanentemente' }
    ]
  },
  // IN100 TEST CASE
  { 
    id: 'TEST-IN100-001', 
    date: '2025-12-09T09:00:00Z', 
    client: 'Ana Maria Braga', 
    salesperson: '05791773510_0001', 
    value: 3500.00, 
    status: mapStatus('Aguardando IN100'), 
    csvStatus: 'Aguardando IN100', 
    type: mapType('PORTABILIDADE'), 
    bank: 'ITAÚ UNIBANCO',
    contractNumber: '555444333', 
    observation: 'Aguardando retorno da Dataprev', 
    lastUpdated: '2025-12-09T09:00:00Z'
  }
];