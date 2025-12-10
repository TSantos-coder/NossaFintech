
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Proposal, User, ProposalStatus, ProposalHistory, ProposalType } from '../types';
import { MOCK_CSV_DATA, INITIAL_USERS } from '../constants';

interface DataContextType {
  proposals: Proposal[];
  users: User[];
  lastCSVUpdate: string;
  updateProposalStatus: (id: string, status: ProposalStatus) => void;
  updateProposalObservation: (id: string, observation: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  resetUserPassword: (id: string) => void;
  resetData: () => void;
  importProposalsFromCSV: (csvContent: string) => { success: boolean; count: number; message: string };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to parse BR Date DD/MM/YYYY HH:MM to ISO
const parseBRDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString();
  try {
    const [datePart, timePart] = dateStr.trim().split(' ');
    const [day, month, year] = datePart.split('/');
    
    let hours = '00';
    let minutes = '00';
    
    if (timePart) {
      [hours, minutes] = timePart.split(':');
    }

    // Create date object (Month is 0-indexed)
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
};

// Helper to map CSV status
const mapStatus = (csvStatus: string): ProposalStatus => {
  const upper = csvStatus?.toUpperCase() || '';
  if (upper.includes('CANCELADO')) return 'Cancelada';
  if (upper.includes('DESEMBOLSADO')) return 'Pago';
  if (upper.includes('AGUARDANDO IN100')) return 'Aguardando IN100';
  if (upper.includes('EM ANÁLISE') || upper.includes('MESA')) return 'Em Análise';
  if (upper.includes('APROVADA')) return 'Aprovada';
  return 'Pendente';
};

// Helper to map CSV Type
const mapType = (csvType: string): ProposalType => {
  const upper = csvType?.toUpperCase() || '';
  if (upper.includes('PORTABILIDADE')) return 'Portabilidade';
  if (upper.includes('REFINANCIAMENTO')) return 'Refinanciamento';
  if (upper.includes('CARTÃO')) return 'Cartão';
  return 'Novo'; 
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [lastCSVUpdate, setLastCSVUpdate] = useState<string>('');

  // Initialize data
  useEffect(() => {
    const storedProposals = localStorage.getItem('gf_proposals_v10');
    const storedUsers = localStorage.getItem('gf_users_v10');
    const storedDate = localStorage.getItem('gf_last_update_v10');

    if (storedProposals) {
      setProposals(JSON.parse(storedProposals));
    } else {
      setProposals(MOCK_CSV_DATA);
      localStorage.setItem('gf_proposals_v10', JSON.stringify(MOCK_CSV_DATA));
    }

    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      setUsers(INITIAL_USERS);
      localStorage.setItem('gf_users_v10', JSON.stringify(INITIAL_USERS));
    }

    if (storedDate) {
      setLastCSVUpdate(storedDate);
    } else {
      const now = new Date().toISOString();
      setLastCSVUpdate(now);
      localStorage.setItem('gf_last_update_v10', now);
    }
  }, []);

  const saveProposals = (newProposals: Proposal[]) => {
    setProposals(newProposals);
    localStorage.setItem('gf_proposals_v10', JSON.stringify(newProposals));
  };

  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('gf_users_v10', JSON.stringify(newUsers));
  };

  const updateProposalStatus = (id: string, status: ProposalStatus) => {
    const updated = proposals.map(p => {
      if (p.id === id) {
        const now = new Date().toISOString();
        const newHistoryItem: ProposalHistory = { status: status, date: now };
        const history = p.history ? [...p.history, newHistoryItem] : [newHistoryItem];
        return { ...p, status, history, lastUpdated: now };
      }
      return p;
    });
    saveProposals(updated);
  };

  const updateProposalObservation = (id: string, observation: string) => {
    const updated = proposals.map(p => 
      p.id === id ? { ...p, observation, lastUpdated: new Date().toISOString() } : p
    );
    saveProposals(updated);
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
  };

  const updateUser = (id: string, data: Partial<User>) => {
    const updated = users.map(u => (u.id === id ? { ...u, ...data } : u));
    saveUsers(updated);
  };

  const deleteUser = (id: string) => {
    const updated = users.filter(u => u.id !== id);
    saveUsers(updated);
  };

  const resetUserPassword = (id: string) => {
    const updated = users.map(u => 
      u.id === id ? { ...u, passwordHash: 'e10adc3949ba59abbe56e057f20f883e' } : u
    );
    saveUsers(updated);
  };

  const resetData = () => {
    setProposals(MOCK_CSV_DATA);
    setUsers(INITIAL_USERS);
    setLastCSVUpdate(new Date().toISOString());
    localStorage.setItem('gf_proposals_v10', JSON.stringify(MOCK_CSV_DATA));
    localStorage.setItem('gf_users_v10', JSON.stringify(INITIAL_USERS));
    localStorage.setItem('gf_last_update_v10', new Date().toISOString());
  };

  const importProposalsFromCSV = (csvContent: string) => {
    try {
      const lines = csvContent.split(/\r?\n/);
      if (lines.length < 2) {
        return { success: false, count: 0, message: 'Arquivo CSV vazio ou inválido.' };
      }

      // Headers (assuming based on provided CSV structure or mapping by index if strict)
      // The provided CSV had headers: debt_key;historico_id;assistance_type...
      // We will identify columns by name to be robust
      const headerLine = lines[0].toLowerCase();
      const headers = headerLine.split(';');
      
      const getIndex = (name: string) => headers.findIndex(h => h.trim() === name);

      const idxId = getIndex('debt_key');
      const idxDate = getIndex('created_at'); // or 'Data'
      const idxClient = getIndex('nom_cliente');
      const idxSales = getIndex('nic_ctr_usuario');
      const idxValue = getIndex('val_liquido');
      const idxRawStatus = getIndex('dsc_situicao_emprestimo');
      const idxType = getIndex('dsc_tipo_proposta_emprestimo');
      const idxBank = getIndex('bank_name');
      const idxContract = getIndex('num_contrato');

      if (idxId === -1 || idxValue === -1) {
        return { success: false, count: 0, message: 'Colunas obrigatórias (debt_key, val_liquido) não encontradas.' };
      }

      const newProposals: Proposal[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(';');
        
        // Helper to get value safely
        const val = (idx: number) => idx !== -1 && cols[idx] ? cols[idx].trim() : '';
        
        // Parse Value (remove dots, replace comma with dot)
        const rawValue = val(idxValue);
        // Ex: "22.349,90" -> "22349.90"
        const cleanValue = rawValue.replace(/\./g, '').replace(',', '.');
        const numValue = parseFloat(cleanValue) || 0;

        // Parse Date
        const dateStr = val(idxDate);
        const isoDate = parseBRDate(dateStr);

        const rawStatus = val(idxRawStatus);

        const proposal: Proposal = {
          id: val(idxId),
          date: isoDate,
          client: val(idxClient) || 'Cliente Desconhecido',
          salesperson: val(idxSales) || 'Vendedor Desconhecido',
          value: numValue,
          csvStatus: rawStatus,
          status: mapStatus(rawStatus),
          type: mapType(val(idxType)),
          bank: val(idxBank),
          contractNumber: val(idxContract),
          observation: '',
          lastUpdated: new Date().toISOString(),
          history: [] // New import resets history in this simple version
        };

        newProposals.push(proposal);
      }

      saveProposals(newProposals);
      const now = new Date().toISOString();
      setLastCSVUpdate(now);
      localStorage.setItem('gf_last_update_v10', now);

      return { success: true, count: newProposals.length, message: 'Importação concluída com sucesso!' };

    } catch (error) {
      console.error(error);
      return { success: false, count: 0, message: 'Erro ao processar o arquivo CSV.' };
    }
  };

  return (
    <DataContext.Provider value={{
      proposals,
      users,
      lastCSVUpdate,
      updateProposalStatus,
      updateProposalObservation,
      addUser,
      updateUser,
      deleteUser,
      resetUserPassword,
      resetData,
      importProposalsFromCSV
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
