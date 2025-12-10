
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ProposalStatus, Proposal } from '../types';
import { Search, Filter, Edit2, Check, X, Download, Calendar, ChevronDown, ChevronRight, User, Tag, Clock, History, Building2, FileText, Square, CheckSquare, ListFilter, Trash2 } from 'lucide-react';

const Proposals: React.FC = () => {
  const { proposals, updateProposalObservation } = useData();
  
  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<ProposalStatus[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Batch Search States
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [batchKeys, setBatchKeys] = useState<string[]>([]);

  // UI States
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  
  // Interaction States
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // List of all available statuses
  const allStatuses: ProposalStatus[] = [
    'Pendente',
    'Em Análise',
    'Aguardando IN100',
    'Aprovada',
    'Pago',
    'Reprovada',
    'Cancelada'
  ];

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

  // Status Description Helper for Tooltip
  const getStatusDescription = (status: ProposalStatus) => {
    switch (status) {
      case 'Pago': return 'O valor foi desembolsado e creditado na conta do cliente.';
      case 'Aguardando IN100': return 'Aguardando retorno da Dataprev/INSS (IN100) para averbação.';
      case 'Em Análise': return 'Proposta em análise pela mesa de crédito ou prevenção a fraudes.';
      case 'Cancelada': return 'Proposta cancelada manualmente ou por decurso de prazo.';
      case 'Aprovada': return 'Crédito aprovado, aguardando próximas etapas (assinatura/averbação).';
      case 'Reprovada': return 'Crédito reprovado por política interna ou restrição.';
      case 'Pendente': return 'Proposta digitada aguardando início do processamento.';
      default: return 'Status atual da proposta no fluxo de esteira.';
    }
  };

  // Process Batch Search Input
  const handleBatchSearch = () => {
    if (!batchInput.trim()) {
      setBatchKeys([]);
      setIsBatchModalOpen(false);
      return;
    }
    // Split by new line, comma, semicolon or space
    const keys = batchInput
      .split(/[\n,;\s]+/)
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    setBatchKeys(keys);
    setIsBatchModalOpen(false);
  };

  const clearBatchSearch = () => {
    setBatchKeys([]);
    setBatchInput('');
  };

  // Filter Logic
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      // 1. Search Logic (Batch OR Text)
      let matchesSearch = true;

      if (batchKeys.length > 0) {
        // If Batch is active, check strictly against list (ID or Contract)
        // Check exact match or inclusion if keys are short? Usually batch is specific.
        // We'll normalize to lowercase for comparison.
        const pContract = p.contractNumber?.toLowerCase() || '';
        const pId = p.id.toLowerCase();
        
        matchesSearch = batchKeys.some(key => {
          const k = key.toLowerCase();
          return pContract.includes(k) || pId.includes(k);
        });
      } else {
        // Standard Text Search
        matchesSearch = 
          p.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.salesperson.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.contractNumber && p.contractNumber.includes(searchTerm)) ||
          p.id.includes(searchTerm);
      }
      
      // 2. Status Filter
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(p.status);

      // 3. Date Range Filter
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
  }, [proposals, searchTerm, selectedStatuses, startDate, endDate, batchKeys]);

  // Handlers
  const toggleStatusSelection = (status: ProposalStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

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
    const headers = ['ID,Data,Cliente,Vendedor,Banco,Contrato,Valor,Status,Tipo,Observação'];
    const rows = filteredProposals.map(p => {
      const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      const dateStr = new Date(p.date).toLocaleDateString('pt-BR');
      const valueStr = p.value.toFixed(2);
      return `${p.id},${dateStr},${escape(p.client)},${escape(p.salesperson)},${escape(p.bank || '')},${escape(p.contractNumber || '')},${valueStr},${escape(p.csvStatus || p.status)},${p.type},${escape(p.observation)}`;
    });
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
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
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Propostas</h2>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 z-20 relative">
        
        {/* Search Group (Text + Batch) */}
        <div className="flex-1 w-full min-w-[200px] flex gap-2">
           <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente, vendedor..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={batchKeys.length > 0}
            />
          </div>
          <button 
            onClick={() => setIsBatchModalOpen(true)}
            className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${batchKeys.length > 0 ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            title="Busca em lote (múltiplos contratos)"
          >
            <ListFilter size={18} />
            <span className="hidden sm:inline text-sm font-medium">Lote</span>
          </button>
        </div>

        {/* Filters Group */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto overflow-visible">
          
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

          {/* Multi-Select Status Filter */}
          <div className="relative min-w-[200px]" ref={statusDropdownRef}>
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="w-full flex items-center justify-between py-2 px-3 border border-gray-200 rounded-lg hover:border-gray-300 bg-white text-sm text-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Filter size={16} className="text-gray-400 shrink-0" />
                <span className="truncate">
                  {selectedStatuses.length === 0 
                    ? 'Todos os Status' 
                    : `${selectedStatuses.length} selecionado(s)`}
                </span>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {isStatusDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in w-56">
                <div className="px-3 pb-2 border-b border-gray-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase">Filtrar Status</span>
                  {selectedStatuses.length > 0 && (
                    <button 
                      onClick={() => setSelectedStatuses([])}
                      className="text-xs text-primary hover:text-primary-hover"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto pt-1">
                  {allStatuses.map((status) => {
                    const isSelected = selectedStatuses.includes(status);
                    return (
                      <div 
                        key={status}
                        onClick={() => toggleStatusSelection(status)}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer group"
                      >
                        <div className={`mr-3 ${isSelected ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'}`}>
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                        <span className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

      {/* Batch Search Active Indicator */}
      {batchKeys.length > 0 && (
         <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="bg-primary text-brand p-1 rounded">
                <ListFilter size={16} />
              </div>
              <span className="font-semibold">Filtro por lote ativo:</span>
              <span>Buscando <span className="font-bold">{batchKeys.length}</span> contratos/IDs.</span>
            </div>
            <button 
              onClick={clearBatchSearch}
              className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
              Limpar Filtro
            </button>
         </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden pb-20">
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
                        {/* Tooltip Wrapper */}
                        <div className="relative group inline-block">
                          <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border cursor-help ${getStatusStyle(item.status)}`}>
                            {item.csvStatus || item.status}
                          </span>
                          
                          {/* Tooltip Content */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                            <div className="font-bold mb-1 border-b border-gray-700 pb-1">{item.csvStatus || item.status}</div>
                            <p className="text-gray-300">{getStatusDescription(item.status)}</p>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
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

      {/* Batch Search Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Busca em Lote</h3>
              <button 
                onClick={() => setIsBatchModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-3">
                Cole a lista de contratos ou IDs que deseja pesquisar. <br/>
                O sistema aceita separação por vírgula, ponto e vírgula ou quebra de linha.
              </p>
              
              <textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder={"123456789\n987654321\nabc-123\n..."}
                className="w-full h-48 border border-gray-200 rounded-xl p-4 text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none bg-gray-50"
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBatchSearch}
                  className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover shadow-md transition-all active:scale-95"
                >
                  Filtrar Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proposals;