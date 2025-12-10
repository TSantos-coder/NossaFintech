
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { User, UserRole } from '../types';
import { Trash2, Plus, Shield, ShieldAlert, User as UserIcon, KeyRound } from 'lucide-react';

const Users: React.FC = () => {
  const { users, addUser, deleteUser, resetUserPassword } = useData();
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'STANDARD' as UserRole,
    password: '' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.password) {
      const success = await addUser(
        { 
          name: formData.name, 
          email: formData.email, 
          role: formData.role,
          passwordHash: '' 
        }, 
        formData.password
      );

      if (success) {
        setShowModal(false);
        setFormData({ name: '', email: '', role: 'STANDARD', password: '' });
      } else {
        alert("Erro ao criar usuário. Verifique se o email já existe ou a conexão.");
      }
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUser(id);
    }
  };

  const handleResetPassword = (id: string, name: string) => {
    resetUserPassword(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Usuários do Sistema</h2>
           <p className="text-gray-500 text-sm">Controle de acesso via Supabase.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium shadow-sm transition-all"
        >
          <Plus size={18} />
          <span>Novo Usuário</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full ${user.role === 'MASTER' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                  {user.role === 'MASTER' ? <Shield size={24} /> : <UserIcon size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => handleResetPassword(user.id, user.name)}
                  className="text-gray-300 hover:text-yellow-500 transition-colors p-1"
                  title="Resetar Senha (Info)"
                >
                  <KeyRound size={18} />
                </button>
                {users.length > 1 && (
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Excluir usuário"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                user.role === 'MASTER' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {user.role === 'MASTER' ? 'Administrador' : 'Vendedor Padrão'}
              </span>
              <span className="text-xs text-gray-400">
                Criado em {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Simple Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Adicionar Novo Usuário</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  required
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:border-primary"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  required
                  type="email"
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:border-primary"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha Inicial</label>
                <input
                  required
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:border-primary"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:border-primary bg-white"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                >
                  <option value="STANDARD">Padrão (Visualizar/Editar Propostas)</option>
                  <option value="MASTER">Master (Controle Total)</option>
                </select>
              </div>
              
              <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 flex items-start gap-2">
                <ShieldAlert size={14} className="mt-0.5" />
                <p>O usuário será criado no Supabase Auth. Dependendo da configuração, um email de confirmação pode ser enviado.</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
