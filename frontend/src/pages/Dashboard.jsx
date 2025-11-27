import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCircle, CalendarDays, ClipboardList, CalendarCheck, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [instrutoresHorarios, setInstrutoresHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingToggle, setLoadingToggle] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, instrutoresRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/dashboard/instrutores-horarios`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setStats(statsRes.data);
      setInstrutoresHorarios(instrutoresRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDisponibilidade = async (id_instrutor) => {
    setLoadingToggle(prev => ({ ...prev, [id_instrutor]: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/instrutores/${id_instrutor}/toggle-disponibilidade`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInstrutoresHorarios(prev =>
        prev.map(inst =>
          inst.id_instrutor === id_instrutor
            ? { ...inst, disponivel: !inst.disponivel }
            : inst
        )
      );
      toast.success('Disponibilidade atualizada!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar disponibilidade');
    } finally {
      setLoadingToggle(prev => ({ ...prev, [id_instrutor]: false }));
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
      title: 'Horários Fixos',
      value: stats?.total_agendas || 0,
      icon: CalendarDays,
      color: 'bg-green-500',
      testid: 'stat-agendas'
    },
    {
      title: 'Instrutores Ativos',
      value: stats?.agendas_disponiveis || 0,
      icon: CalendarCheck,
      color: 'bg-teal-500',
      testid: 'stat-disponiveis'
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
        <p className="text-gray-600">Visão geral e gestão de instrutores</p>
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

      {/* Instrutores com Horários Fixos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <h2 className="text-xl font-bold text-gray-900">Instrutores - Horários Fixos</h2>
          <p className="text-sm text-gray-600 mt-1">Gerencie a disponibilidade dos instrutores</p>
        </div>

        {instrutoresHorarios.length === 0 ? (
          <div className="text-center py-16" data-testid="no-instrutores-message">
            <UserCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">Nenhum instrutor cadastrado</p>
            <p className="text-gray-400 text-sm">Cadastre instrutores e defina seus horários fixos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="instrutores-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Idade</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Dias da Semana</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Horário</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Disponibilidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {instrutoresHorarios.map((instrutor) => (
                  <tr
                    key={instrutor.id_instrutor}
                    className={`hover:bg-gray-50 transition-colors ${
                      instrutor.disponivel ? '' : 'bg-red-50/30'
                    }`}
                    data-testid="instrutor-row"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          instrutor.disponivel ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          <UserCircle className={`w-5 h-5 ${
                            instrutor.disponivel ? 'text-purple-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{instrutor.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{instrutor.idade} anos</span>
                    </td>
                    <td className="px-6 py-4">
                      {instrutor.dias_semana ? (
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {instrutor.dias_semana}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Não definido</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {instrutor.horario ? (
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{instrutor.horario}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Não definido</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        {instrutor.horario ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleDisponibilidade(instrutor.id_instrutor)}
                            disabled={loadingToggle[instrutor.id_instrutor]}
                            className={`h-9 px-4 rounded-full font-medium transition-all ${
                              instrutor.disponivel
                                ? 'bg-green-100 hover:bg-green-200 text-green-700'
                                : 'bg-red-100 hover:bg-red-200 text-red-700'
                            }`}
                            data-testid="toggle-disponibilidade-button"
                          >
                            {loadingToggle[instrutor.id_instrutor] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <>
                                {instrutor.disponivel ? (
                                  <>
                                    <Power className="w-4 h-4 mr-2" />
                                    Ativo
                                  </>
                                ) : (
                                  <>
                                    <PowerOff className="w-4 h-4 mr-2" />
                                    Inativo
                                  </>
                                )}
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">Sem horário fixo</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Como funciona</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">1.</span>
            <span>Cadastre instrutores na seção <strong>Instrutores</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">2.</span>
            <span>Defina horários fixos de trabalho em <strong>Agendas</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">3.</span>
            <span>Crie treinos personalizados em <strong>Treinos</strong> - o sistema mostra apenas instrutores disponíveis</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">4.</span>
            <span>Use o botão de disponibilidade aqui para ativar/desativar instrutores temporariamente</span>
          </li>
        </ul>
      </div>
    </div>
  );
}