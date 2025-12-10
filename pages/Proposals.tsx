
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ProposalStatus, Proposal } from '../types';
import { Search, Filter, Edit2, Check, X, Download, Calendar, ChevronDown, ChevronRight, User, Tag, Clock, History, Building2, FileText } from 'lucide-react';

const Proposals: React.FC = () => {
  const { proposals, updateProposalObservation } = useData();
  
  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Interaction States
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Status Badge Helper
  const getStatusStyle = (status: ProposalStatus) => {
    switch (status) {
      case 'Aprovada': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pago': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Reprovada': return 'bg-red-100 text-red-800 border-red-200';
      case 'Em Análise': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cancelada': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Aguardando IN100': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Filter Logic
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      // Text Search
      const matchesSearch = 
        p.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.salesperson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.contractNumber && p.contractNumber.includes(searchTerm)) ||
        p.id.includes(searchTerm);
      
      // Status Filter
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

      // Date Range Filter
      let matchesDate = true;
      if (startDate || endDate) {
        const propDate = new Date(p.date).setHours(0, 0, 0, 0);
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null;

        if (start && propDate < start) matchesDate = false;
        if (end && propDate > end) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [proposals, searchTerm, statusFilter, startDate, endDate]);

  // Handlers
  const startEditingNote = (p: Proposal) => {
    setEditingNoteId(p.id);
    setTempNote(p.observation || '');
  };

  const saveNote = () => {
    if (editingNoteId) {
      updateProposalObservation(editingNoteId, tempNote);
      setEditingNoteId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleExportCSV = () => {
    // 1. Define Headers
    const headers = ['ID,Data,Cliente,Vendedor,Banco,Contrato,Valor,Status,Tipo,Observação'];

    // 2. Map Rows
    const rows = filteredProposals.map(p => {
      // Helper to escape quotes and wrap in quotes for CSV safety
      const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      
      const dateStr = new Date(p.date).toLocaleDateString('pt-BR');
      const valueStr = p.value.toFixed(2); // Keep number format simple for Excel

      // EXPORT Raw CSV Status
      return `${p.id},${dateStr},${escape(p.client)},${escape(p.salesperson)},${escape(p.bank || '')},${escape(p.contractNumber || '')},${valueStr},${escape(p.csvStatus || p.status)},${p.type},${escape(p.observation)}`;
    });

    // 3. Combine with BOM for Excel UTF-8 support
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');

    // 4. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `propostas_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Propostas</h2>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por cliente, vendedor, contrato ou ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto overflow-x-auto">
          
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="py-2 px-3 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm text-gray-600 w-36"
                title="Data Início"
              />
            </div>
            <span className="text-gray-400">-</span>
            <div className="relative">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="py-2 px-3 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm text-gray-600 w-36"
                title="Data Fim"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 min-w-[180px]">
            <Filter size={18} className="text-gray-400 hidden md:block" />
            <select 
              className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary outline-none bg-white text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Aguardando IN100">Aguardando IN100</option>
              <option value="Aprovada">Aprovada</option>
              <option value="Pago">Pago (Desembolsado)</option>
              <option value="Reprovada">Reprovada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
          
          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="whitespace-nowrap flex items-center justify-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            title="Exportar dados filtrados para CSV"
          >
            <Download size={18} />
            <span className="font-medium hidden md:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-4 w-10"></th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Cliente / Contrato</th>
                <th className="px-6 py-4 hidden lg:table-cell">Banco</th>
                <th className="px-6 py-4">Valor Líquido</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProposals.length > 0 ? (
                filteredProposals.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr 
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedId === item.id ? 'bg-gray-50' : ''}`}
                      onClick={() => toggleExpand(item.id)}
                    >
                      <td className="px-4 py-4 text-gray-400">
                        {expandedId === item.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">{item.client}</div>
                        <div className="text-xs text-gray-400 font-mono">{item.contractNumber || 'S/N'}</div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-gray-600">
                         {item.bank || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-semibold">
                        {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${getStatusStyle(item.status)}`}>
                          {item.csvStatus || item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs" onClick={(e) => e.stopPropagation()}>
                        {editingNoteId === item.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={tempNote}
                              onChange={(e) => setTempNote(e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:border-primary outline-none"
                              autoFocus
                            />
                            <button onClick={saveNote} className="text-green-500 hover:text-green-600"><Check size={16}/></button>
                            <button onClick={() => setEditingNoteId(null)} className="text-red-500 hover:text-red-600"><X size={16}/></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group cursor-pointer" onClick={() => startEditingNote(item)}>
                            <span className="text-gray-500 truncate mr-2 text-xs max-w-[150px]">
                              {item.observation || 'Adicionar nota...'}
                            </span>
                            <Edit2 size={12} className="text-gray-300 opacity-0 group-hover:opacity-100" />
                          </div>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {expandedId === item.id && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={7} className="px-4 py-4 sm:px-12 pb-6">
                          <div className="flex flex-col lg:flex-row gap-6">
                            
                            {/* Detail Cards */}
                            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                              <div className="flex items-start space-x-3">
                                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                  <Tag size={18} />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium uppercase">Tipo</p>
                                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.type}</p>
                                </div>
                              </div>

                              <div className="flex items-start space-x-3">
                                <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                                  <User size={18} />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium uppercase">Vendedor</p>
                                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.salesperson}</p>
                                </div>
                              </div>

                              <div className="flex items-start space-x-3">
                                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                  <Building2 size={18} />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium uppercase">Banco</p>
                                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.bank}</p>
                                </div>
                              </div>

                              <div className="flex items-start space-x-3">
                                <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                                  <Clock size={18} />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium uppercase">Última Atualização</p>
                                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                                    {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('pt-BR') : '-'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start space-x-3 sm:col-span-2 lg:col-span-4 mt-2 pt-2 border-t border-gray-50">
                                <div className="bg-gray-50 p-2 rounded-lg text-gray-600">
                                  <FileText size={18} />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 font-medium uppercase">ID Interno (Debt Key)</p>
                                  <p className="text-xs font-mono text-gray-600 mt-0.5 break-all">{item.id}</p>
                                </div>
                              </div>
                            </div>

                            {/* Status History */}
                            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm lg:w-1/3">
                              <div className="flex items-center space-x-2 mb-4">
                                <History size={16} className="text-gray-400" />
                                <h4 className="text-xs font-bold uppercase text-gray-500">Histórico Completo</h4>
                              </div>
                              <div className="relative border-l-2 border-gray-100 ml-2 pl-4 space-y-4 max-h-[250px] overflow-y-auto pr-2">
                                {item.history && item.history.length > 0 ? (
                                  item.history.map((hist, idx) => (
                                    <div key={idx} className="relative group">
                                      <div className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ${idx === item.history!.length - 1 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                                      <p className="text-sm font-medium text-gray-800">{hist.status}</p>
                                      {hist.note && <p className="text-xs text-gray-500 mt-0.5 italic">{hist.note}</p>}
                                      <p className="text-xs text-gray-400 mt-1">
                                        {new Date(hist.date).toLocaleString('pt-BR', {
                                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-gray-400 italic">Sem histórico registrado.</p>
                                )}
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Nenhuma proposta encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Proposals;