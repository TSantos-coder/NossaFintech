
import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { UploadCloud, AlertTriangle, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ImportData: React.FC = () => {
  const { importProposalsFromCSV } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({
    type: 'idle',
    message: ''
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setStatus({ type: 'error', message: 'Por favor, envie apenas arquivos CSV.' });
      return;
    }
    setFile(file);
    setStatus({ type: 'idle', message: '' });
  };

  const handleUpload = () => {
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        // Process the CSV
        try {
          const result = await importProposalsFromCSV(text);
          if (result.success) {
            setStatus({ type: 'success', message: `${result.message} (${result.count} registros)` });
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            setStatus({ type: 'error', message: result.message });
          }
        } catch (error: any) {
           setStatus({ type: 'error', message: error.message || 'Erro desconhecido na importação' });
        }
      }
      setLoading(false);
    };

    reader.onerror = () => {
      setStatus({ type: 'error', message: 'Erro ao ler o arquivo.' });
      setLoading(false);
    };

    reader.readAsText(file, 'utf-8'); // Assuming UTF-8, change if needed
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold text-gray-900">Importação de Dados</h2>
        <p className="text-gray-500 text-sm">Atualize a base de propostas via arquivo CSV.</p>
      </div>

      <div className="max-w-3xl mx-auto">
        
        {/* Warning Card */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-yellow-800 text-sm">Atenção ao importar</h4>
            <p className="text-yellow-700 text-xs mt-1">
              A importação substituirá a base atual. Certifique-se de que o arquivo CSV segue o padrão (separado por ponto e vírgula <strong>;</strong>) e contém as colunas obrigatórias: 
              <span className="font-mono ml-1">debt_key, val_liquido, created_at, nom_cliente</span>.
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div 
          className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'}
            ${loading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".csv" 
            className="hidden" 
            onChange={handleChange}
          />
          
          <div className={`p-4 rounded-full bg-gray-100 mb-4 transition-transform ${dragActive ? 'scale-110' : ''}`}>
             <UploadCloud size={40} className="text-primary" />
          </div>

          <h3 className="text-lg font-bold text-gray-700">
            {file ? file.name : 'Arraste seu CSV aqui'}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {file ? `${(file.size / 1024).toFixed(2)} KB` : 'ou clique para selecionar do computador'}
          </p>
        </div>

        {/* Actions / Status */}
        <div className="mt-6 flex flex-col items-center space-y-4">
          
          {status.type === 'error' && (
            <div className="flex items-center text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm border border-red-100 animate-fade-in">
              <AlertCircle size={18} className="mr-2" />
              {status.message}
            </div>
          )}

          {status.type === 'success' && (
            <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-lg text-sm border border-green-100 animate-fade-in">
              <CheckCircle2 size={18} className="mr-2" />
              {status.message}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading || status.type === 'success'}
            className={`
              w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white shadow-md transition-all
              ${!file || loading || status.type === 'success'
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-primary hover:bg-primary-hover hover:scale-105 active:scale-95'
              }
            `}
          >
            {loading ? (
               <span className="flex items-center">
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Processando...
               </span>
            ) : 'Importar CSV'}
          </button>
        </div>

        {/* Example Template Help */}
        <div className="mt-12 border-t border-gray-100 pt-8">
           <h4 className="text-gray-900 font-semibold mb-3 flex items-center">
             <FileSpreadsheet size={18} className="mr-2 text-brand" />
             Estrutura Esperada
           </h4>
           <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto text-xs text-gray-300 font-mono">
             debt_key;created_at;nom_cliente;val_liquido;dsc_situicao_emprestimo;...<br/>
             123-abc;08/12/2025 08:00;João Silva;1.500,00;Desembolsado;...
           </div>
        </div>

      </div>
    </div>
  );
};

export default ImportData;
