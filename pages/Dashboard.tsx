
import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  CheckCircle2, Clock, Wallet, 
  TrendingUp, Activity, RefreshCcw, Calendar, FileText, AlertCircle, XCircle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { proposals, lastCSVUpdate, resetData } = useData();

  // 1. STATS CALCULATION (Com Deduplicação Rigorosa)
  const stats = useMemo(() => {
    // Mapa para garantir unicidade pelo Número do Contrato
    const uniqueMap = new Map();

    // Passo 1: Deduplicação
    // Se houver múltiplas linhas para o mesmo contrato, mantemos a mais relevante
    proposals.forEach(p => {
      const key = p.contractNumber || p.id; // Chave primária é o contrato

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, p);
      } else {
        const existing = uniqueMap.get(key);
        // Prioridade: Pago > Cancelada > Outros
        if (existing.status !== 'Pago' && p.status === 'Pago') {
          uniqueMap.set(key, p);
        } else if (existing.status !== 'Cancelada' && existing.status !== 'Pago' && p.status === 'Cancelada') {
          uniqueMap.set(key, p);
        }
      }
    });

    // Convertemos o mapa de volta para array apenas com contratos únicos
    const uniqueProposals = Array.from(uniqueMap.values());

    let disbursedValue = 0;
    let disbursedCount = 0;
    let cancelledCount = 0;
    let inProgressCount = 0;
    let in100Count = 0;
    let in100Value = 0;

    // Passo 2: Cálculo dos KPIs baseado na lista única
    uniqueProposals.forEach((p: any) => {
      
      // KPI Desembolsado (Pago)
      if (p.status === 'Pago') {
        disbursedCount++;
        disbursedValue += p.value;
      } 
      // KPI Cancelada (Cancelado Permanentemente)
      else if (p.status === 'Cancelada') {
        cancelledCount++;
      } 
      // KPI Fluxo Ativo / Em Andamento
      // Regra: Diferente de Pago E Diferente de Cancelada
      // (Inclui Pendente, Em Análise, Aguardando IN100, etc.)
      else {
        inProgressCount++;
      }

      // KPI Específico IN100
      // Regra: Olhar explicitamente a coluna dsc_situicao_emprestimo (csvStatus) = 'Aguardando IN100'
      if (p.csvStatus === 'Aguardando IN100') {
        in100Count++;
        in100Value += p.value;
      }
    });

    return {
      disbursedValue,
      disbursedCount,
      cancelledCount,
      in100Count,
      in100Value,
      inProgressCount,
      totalCount: uniqueProposals.length,
      uniqueList: uniqueProposals
    };
  }, [proposals]);

  // 2. DAILY TYPING DATA (Bar Chart) - Dynamic Types
  const { dailyData, proposalTypes } = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {};
    const typesSet = new Set<string>();

    stats.uniqueList.forEach((p: any) => {
      const dateKey = new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      // Use the raw type from mapping or default to 'Outros'
      // Ideally relying on p.type which comes from dsc_tipo_proposta_emprestimo mapping
      const typeKey = p.type || 'Outros'; 
      typesSet.add(typeKey);

      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey as any }; // Cast to handle dynamic keys
      }

      // Initialize if undefined
      if (!grouped[dateKey][typeKey]) {
        grouped[dateKey][typeKey] = 0;
      }

      grouped[dateKey][typeKey] += 1;
    });

    // Ensure all days have all keys set to 0 if missing (optional for Recharts but good practice)
    const allTypes = Array.from(typesSet);
    const result = Object.values(grouped).map(dayObj => {
      allTypes.forEach(type => {
        if (!dayObj[type]) dayObj[type] = 0;
      });
      return dayObj;
    }).slice(-7); // Last 7 days

    return { dailyData: result, proposalTypes: allTypes };
  }, [stats.uniqueList]);

  // Generate colors for dynamic bars
  const getBarColor = (index: number) => {
    const colors = ['#00d3ff', '#000935', '#6366f1', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  };

  // 3. PIE CHART DATA
  const pieData = [
    { name: 'Efetivadas', value: stats.disbursedCount, color: '#00d3ff' }, // Cyan
    { name: 'Canceladas', value: stats.cancelledCount, color: '#ef4444' }  // Red
  ];

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-bold text-brand">Dashboard Gerencial</h2>
          <p className="text-gray-500 mt-1">Visão geral consolidada da operação</p>
          <div className="flex items-center space-x-2 text-xs font-medium text-gray-400 mt-3 bg-gray-50 w-fit px-3 py-1 rounded-full border border-gray-100">
             <Clock size={12} />
             <span>Dados atualizados em: {lastCSVUpdate ? new Date(lastCSVUpdate).toLocaleString('pt-BR') : 'N/A'}</span>
          </div>
        </div>
        <button 
          onClick={resetData} 
          className="flex items-center space-x-2 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:bg-white hover:text-primary hover:border-primary transition-all duration-300 shadow-sm font-semibold text-sm group"
        >
          <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        
        {/* KPI 1: Desembolsado */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand to-[#00154a] rounded-2xl p-6 shadow-lg text-white group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <Wallet size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <CheckCircle2 size={18} />
              <span className="font-semibold text-sm uppercase tracking-wider">Desembolsado</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{formatCurrency(stats.disbursedValue)}</h3>
            <p className="text-gray-300 text-sm font-medium">{stats.disbursedCount} contratos</p>
            <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-3/4 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* KPI 2: Em Andamento (Fluxo Ativo) */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group hover:border-primary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 text-primary opacity-5 group-hover:opacity-10 transition-all">
            <Activity size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
              <TrendingUp size={18} className="text-primary" />
              <span className="font-semibold text-sm uppercase tracking-wider">Fluxo Ativo</span>
            </div>
            <h3 className="text-3xl font-bold text-brand mb-1">{stats.inProgressCount}</h3>
            <p className="text-gray-400 text-sm">Contratos na esteira</p>
            <p className="text-xs text-primary mt-2 font-medium bg-primary/5 w-fit px-2 py-1 rounded">
              Pendentes / Em Análise
            </p>
          </div>
        </div>

        {/* KPI 3: Cancelados (NOVO) */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group hover:border-red-200 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 text-red-500 opacity-5 group-hover:opacity-10 transition-all">
            <XCircle size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
              <XCircle size={18} className="text-red-500" />
              <span className="font-semibold text-sm uppercase tracking-wider">Cancelados</span>
            </div>
            <h3 className="text-3xl font-bold text-brand mb-1">{stats.cancelledCount}</h3>
            <p className="text-gray-400 text-sm">Contratos encerrados</p>
            <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 w-fit px-2 py-1 rounded">
              Cancelado Permanentemente
            </p>
          </div>
        </div>

        {/* KPI 4: Aguardando IN100 */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group hover:border-orange-200 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 text-orange-500 opacity-5 group-hover:opacity-10 transition-all">
            <AlertCircle size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
              <Clock size={18} className="text-orange-500" />
              <span className="font-semibold text-sm uppercase tracking-wider">Aguardando IN100</span>
            </div>
            <h3 className="text-3xl font-bold text-brand mb-1">{stats.in100Count}</h3>
            <p className="text-gray-400 text-sm">Vol: {formatCurrency(stats.in100Value)}</p>
            <div className="mt-4 flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit">
              Pendência Operacional
            </div>
          </div>
        </div>

        {/* KPI 5: Total Geral */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group hover:border-purple-200 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 text-purple-500 opacity-5 group-hover:opacity-10 transition-all">
            <FileText size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
              <Calendar size={18} className="text-purple-500" />
              <span className="font-semibold text-sm uppercase tracking-wider">Total Geral</span>
            </div>
            <h3 className="text-3xl font-bold text-brand mb-1">{stats.totalCount}</h3>
            <p className="text-gray-400 text-sm">Base total única</p>
             <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-full rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Daily Production - Dynamic */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-brand">Produção Diária</h3>
              <p className="text-sm text-gray-400">Por Tipo de Proposta</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                {proposalTypes.map((type, index) => (
                  <Bar 
                    key={type} 
                    dataKey={type} 
                    name={type} 
                    fill={getBarColor(index)} 
                    radius={[6, 6, 0, 0]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Efficiency */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-brand">Efetividade</h3>
            <p className="text-sm text-gray-400">Efetivadas vs Canceladas</p>
          </div>
          <div className="flex-1 min-h-[300px] relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{paddingTop: '20px'}} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
               <span className="text-3xl font-bold text-brand">
                 {stats.disbursedCount + stats.cancelledCount > 0 
                  ? Math.round((stats.disbursedCount / (stats.disbursedCount + stats.cancelledCount)) * 100)
                  : 0}%
               </span>
               <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Aprovação</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;