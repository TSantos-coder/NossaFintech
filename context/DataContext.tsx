
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Proposal, User, ProposalStatus, ProposalHistory, ProposalType } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { MOCK_CSV_DATA, INITIAL_USERS } from '../constants';

interface DataContextType {
  proposals: Proposal[];
  users: User[];
  lastCSVUpdate: string;
  updateProposalStatus: (id: string, status: ProposalStatus) => void;
  updateProposalObservation: (id: string, observation: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>, password?: string) => Promise<boolean>;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  resetUserPassword: (id: string) => void;
  resetData: () => void;
  importProposalsFromCSV: (csvContent: string) => Promise<{ success: boolean; count: number; message: string }>;
  fetchData: () => Promise<void>;
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

    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
};

const mapStatus = (csvStatus: string): ProposalStatus => {
  const upper = csvStatus?.toUpperCase() || '';
  if (upper.includes('CANCELADO')) return 'Cancelada';
  if (upper.includes('DESEMBOLSADO')) return 'Pago';
  if (upper.includes('AGUARDANDO IN100')) return 'Aguardando IN100';
  if (upper.includes('EM ANÁLISE') || upper.includes('MESA')) return 'Em Análise';
  if (upper.includes('APROVADA')) return 'Aprovada';
  if (upper.includes('REPROVADA') || upper.includes('RECUSADA')) return 'Reprovada';
  return 'Pendente';
};

const mapType = (csvType: string): ProposalType => {
  const upper = csvType?.toUpperCase() || '';
  if (upper.includes('PORTABILIDADE')) return 'Portabilidade';
  if (upper.includes('REFINANCIAMENTO')) return 'Refinanciamento';
  if (upper.includes('CARTÃO')) return 'Cartão';
  return 'Novo'; 
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [lastCSVUpdate, setLastCSVUpdate] = useState<string>('');

  const loadMockData = () => {
    console.log('Carregando dados simulados (Mock)...');
    setProposals(MOCK_CSV_DATA);
    setUsers(INITIAL_USERS);
    setLastCSVUpdate(new Date().toISOString());
  };

  const fetchData = async () => {
    if (!isAuthenticated) return;

    try {
      // ESTRATÉGIA BLINDADA: Queries Separadas (Sem JOIN)
      // Isso evita o erro "Database error querying schema" se a Foreign Key não existir ou estiver errada.

      // 1. Busca Propostas
      const { data: proposalsData, error: propError } = await supabase
        .from('proposals')
        .select('*') // Select simples, sem joins
        .order('date', { ascending: false });

      // Se a tabela 'proposals' não existir, erro crítico -> Mock
      if (propError) {
        console.warn('Erro ao buscar tabela proposals. Usando Mock.', propError.message);
        loadMockData();
        return;
      }

      // 2. Busca Histórico (Try/Catch separado para não quebrar o fluxo se a tabela faltar)
      let historyData: any[] = [];
      try {
        const { data: hData, error: hError } = await supabase
          .from('proposal_history')
          .select('*');
        
        if (!hError && hData) {
          historyData = hData;
        }
      } catch (e) {
        console.warn('Tabela de histórico inacessível, ignorando histórico.');
      }

      // 3. Unir os dados via Javascript (Manual Join)
      if (proposalsData) {
        const mappedProposals: Proposal[] = proposalsData.map((p: any) => {
          // Filtra o histórico correspondente em memória
          const itemHistory = historyData.filter((h: any) => h.proposal_id === p.id);
          
          return {
            id: p.id,
            date: p.date,
            client: p.client,
            salesperson: p.salesperson,
            value: p.value,
            status: p.status as ProposalStatus,
            csvStatus: p.csv_status,
            type: p.type as ProposalType,
            observation: p.observation,
            lastUpdated: p.last_updated,
            bank: p.bank,
            contractNumber: p.contract_number,
            history: itemHistory
          };
        });
        setProposals(mappedProposals);
      } else {
        setProposals([]);
      }

      // 4. Busca Perfis
      const { data: profilesData } = await supabase.from('profiles').select('*');
      
      if (profilesData) {
        const mappedUsers: User[] = profilesData.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          passwordHash: '', 
          createdAt: new Date().toISOString()
        }));
        setUsers(mappedUsers);
      } else {
         setUsers(INITIAL_USERS);
      }

    } catch (err) {
      console.error('Erro crítico no DataContext. Usando Mock.', err);
      loadMockData();
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const updateProposalStatus = async (id: string, status: ProposalStatus) => {
    const now = new Date().toISOString();
    
    // Optimistic Update
    setProposals(prev => prev.map(p => 
      p.id === id ? { ...p, status, lastUpdated: now } : p
    ));

    // Update in DB
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ status: status, last_updated: now })
      .eq('id', id);

    if (!updateError) {
      // Try Insert History
      await supabase.from('proposal_history').insert({
        proposal_id: id,
        status: status,
        date: now,
        note: 'Status atualizado manualmente'
      }).then(({ error }) => {
          if (error) console.warn('Erro histórico:', error.message);
      });
      
      fetchData(); 
    }
  };

  const updateProposalObservation = async (id: string, observation: string) => {
    const now = new Date().toISOString();
    setProposals(prev => prev.map(p => 
      p.id === id ? { ...p, observation, lastUpdated: now } : p
    ));

    await supabase
      .from('proposals')
      .update({ observation, last_updated: now })
      .eq('id', id);
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>, password?: string): Promise<boolean> => {
    if (!password) return false;
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: password,
      options: {
        data: {
          name: userData.name,
          role: userData.role
        }
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return false;
    }
    setTimeout(fetchData, 1000);
    return true;
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    await supabase.from('profiles').update({
      name: data.name,
      role: data.role
    }).eq('id', id);
    fetchData();
  };

  const deleteUser = async (id: string) => {
    alert("Para excluir o acesso (Auth), utilize o painel do Supabase. Excluindo perfil local.");
    await supabase.from('profiles').delete().eq('id', id);
    fetchData();
  };

  const resetUserPassword = async (id: string) => {
    alert("O reset de senha deve ser feito via 'Esqueci minha senha' ou painel administrativo do Supabase.");
  };

  const resetData = async () => {
    if(confirm("Isso apagará todas as propostas do banco de dados. Confirmar?")) {
       await supabase.from('proposals').delete().neq('id', '0'); // Delete all
       fetchData();
    }
  };

  const importProposalsFromCSV = async (csvContent: string) => {
    try {
      const lines = csvContent.split(/\r?\n/);
      if (lines.length < 2) {
        return { success: false, count: 0, message: 'Arquivo CSV vazio ou inválido.' };
      }

      const headerLine = lines[0].toLowerCase();
      const headers = headerLine.split(';');
      const getIndex = (name: string) => headers.findIndex(h => h.trim() === name);

      const idxId = getIndex('debt_key');
      let idxDate = getIndex('created_at'); 
      if (idxDate === -1) idxDate = getIndex('data');

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

      const proposalsToUpsert = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(';');
        const val = (idx: number) => idx !== -1 && cols[idx] ? cols[idx].trim() : '';

        const rawValue = val(idxValue);
        const cleanValue = rawValue.replace(/\./g, '').replace(',', '.');
        const numValue = parseFloat(cleanValue) || 0;
        const dateStr = val(idxDate);
        const isoDate = parseBRDate(dateStr);
        const rawStatus = val(idxRawStatus);
        
        proposalsToUpsert.push({
          id: val(idxId),
          date: isoDate,
          client: val(idxClient) || 'Cliente Desconhecido',
          salesperson: val(idxSales) || 'Vendedor Desconhecido',
          value: numValue,
          csv_status: rawStatus,
          status: mapStatus(rawStatus),
          type: mapType(val(idxType)),
          bank: val(idxBank),
          contract_number: val(idxContract),
          observation: '',
          last_updated: new Date().toISOString()
        });
      }

      const { error } = await supabase
        .from('proposals')
        .upsert(proposalsToUpsert, { onConflict: 'id' });

      if (error) {
         if (error.code === '42P01') {
           throw new Error('A tabela "proposals" não foi criada no Supabase.');
         }
         throw error;
      }

      await fetchData();
      return { success: true, count: proposalsToUpsert.length, message: 'Importação para Supabase concluída!' };

    } catch (error: any) {
      console.error(error);
      return { success: false, count: 0, message: `Erro: ${error.message}` };
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
      importProposalsFromCSV,
      fetchData
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