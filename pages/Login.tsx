import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Lock, Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { login } = useAuth();
  const { users } = useData();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const success = login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Credenciais inválidas. Tente admin@sistema.com / 123456');
        setLoading(false);
      }
    }, 800);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResetStatus('idle');

    setTimeout(() => {
      const userExists = users.find(u => u.email === resetEmail);
      if (userExists) {
        setResetStatus('success');
      } else {
        setResetStatus('error');
      }
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
        <div className="bg-brand p-8 text-center border-b border-primary/20">
          <div className="flex justify-center mb-4">
            {/* Logo Image */}
            <img src="logo.png" alt="Logo" className="h-16 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <h2 className="text-3xl font-bold text-white">
            Nossa<span className="text-primary">Fintech</span>
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            {isForgotPassword ? 'Recuperação de Senha' : 'Portal de Gestão'}
          </p>
        </div>

        {isForgotPassword ? (
           /* Forgot Password View */
          <div className="p-8 space-y-6">
            {resetStatus === 'success' ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle size={48} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Email enviado!</h3>
                <p className="text-gray-600 text-sm">
                  As instruções de recuperação foram enviadas para <strong>{resetEmail}</strong>.
                </p>
                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetStatus('idle');
                    setResetEmail('');
                  }}
                  className="mt-4 w-full py-2 px-4 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors"
                >
                  Voltar ao Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                <p className="text-sm text-gray-600 text-center">
                  Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
                </p>

                {resetStatus === 'error' && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center text-sm border border-red-100">
                    <AlertCircle size={16} className="mr-2" />
                    Email não encontrado.
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-colors outline-none"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 bg-primary hover:bg-primary-hover text-brand font-bold rounded-lg shadow-md transition-all ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Enviando...' : 'Enviar Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="w-full py-2 px-4 flex items-center justify-center text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Voltar
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Login View */
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center text-sm border border-red-100">
                <AlertCircle size={16} className="mr-2" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-colors outline-none"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-colors outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 bg-primary hover:bg-primary-hover text-brand font-bold rounded-lg shadow-md transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>

            <div className="text-center text-xs text-gray-400 mt-4">
              <p>Admin: admin@sistema.com | 123456</p>
              <p>User: vendedor@sistema.com | 123456</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;