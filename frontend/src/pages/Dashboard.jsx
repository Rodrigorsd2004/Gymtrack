import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCircle, CalendarDays, ClipboardList, CalendarCheck, CheckCircle, Circle, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [treinosPersonalizados, setTreinosPersonalizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCheck, setLoadingCheck] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, treinosRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/dashboard/treinos-personalizados`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setStats(statsRes.data);
      setTreinosPersonalizados(treinosRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheck = async (id_treino) => {
    setLoadingCheck(prev => ({ ...prev, [id_treino]: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/treinos/${id_treino}/toggle-concluido`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setTreinosPersonalizados(prev => 
        prev.map(t => 
          t.id_treino === id_treino 
            ? { ...t, concluido: !t.concluido }
            : t
        )
      );
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    } finally {
      setLoadingCheck(prev => ({ ...prev, [id_treino]: false }));
    }
  };

  const statCards = [
    {
      title: 'Total de Alunos',
      value: stats?.total_alunos || 0,
      icon: Users,
      color: 'bg-blue-500',
      testid: 'stat-alunos'
    },
    {
      title: 'Total de Instrutores',
      value: stats?.total_instrutores || 0,
      icon: UserCircle,
      color: 'bg-purple-500',
      testid: 'stat-instrutores'
    },
    {
      title: 'Total de Agendas',
      value: stats?.total_agendas || 0,
      icon: CalendarDays,
      color: 'bg-green-500',
      testid: 'stat-agendas'
    },
    {
      title: 'Agendas Disponíveis',
      value: stats?.agendas_disponiveis || 0,
      icon: CalendarCheck,
      color: 'bg-teal-500',
      testid: 'stat-agendas-disponiveis'
    },
    {
      title: 'Total de Treinos',
      value: stats?.total_treinos || 0,
      icon: ClipboardList,
      color: 'bg-orange-500',
      testid: 'stat-treinos'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="fade-in" data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Visão geral e gestão de treinos personalizados</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 border border-gray-200 card-hover"
            data-testid={stat.testid}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs font-medium mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Treinos Personalizados Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <h2 className="text-xl font-bold text-gray-900">Treinos Personalizados Agendados</h2>
          <p className="text-sm text-gray-600 mt-1">Acompanhe e gerencie os treinos personalizados dos alunos</p>
        </div>

        {treinosPersonalizados.length === 0 ? (
          <div className="text-center py-16" data-testid="no-treinos-message">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">Nenhum treino personalizado cadastrado</p>
            <p className="text-gray-400 text-sm">Crie treinos personalizados na seção de Treinos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="treinos-personalizados-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Aluno</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Treino</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Instrutor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nível</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Horário</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {treinosPersonalizados.map((treino) => (
                  <tr 
                    key={treino.id_treino} 
                    className={`hover:bg-gray-50 transition-colors ${
                      treino.concluido ? 'bg-green-50/30' : ''
                    }`}
                    data-testid="treino-personalizado-row"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{treino.aluno_nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 font-medium">{treino.nome_treino}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-700">{treino.instrutor_nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {treino.nivel && treino.nivel !== '-' ? (
                        <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                          {treino.nivel}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {treino.data !== '-' ? new Date(treino.data).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {treino.hora_inicio !== '-' ? `${treino.hora_inicio} - ${treino.hora_fim}` : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCheck(treino.id_treino)}
                          disabled={loadingCheck[treino.id_treino]}
                          className={`h-10 w-10 p-0 rounded-full transition-all ${
                            treino.concluido
                              ? 'bg-green-100 hover:bg-green-200 text-green-700'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                          }`}
                          data-testid="toggle-check-button"
                        >
                          {loadingCheck[treino.id_treino] ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                          ) : treino.concluido ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Treinos Concluídos</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">
            {treinosPersonalizados.filter(t => t.concluido).length}
          </p>
          <p className="text-sm text-gray-600 mt-1">de {treinosPersonalizados.length} treinos personalizados</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Treinos Pendentes</h3>
          </div>
          <p className="text-3xl font-bold text-orange-700">
            {treinosPersonalizados.filter(t => !t.concluido).length}
          </p>
          <p className="text-sm text-gray-600 mt-1">aguardando conclusão</p>
        </div>
      </div>
    </div>
  );
}