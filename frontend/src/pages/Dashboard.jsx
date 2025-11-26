import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCircle, CalendarDays, ClipboardList, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
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
        <p className="text-gray-600">Visão geral do sistema GymTrack</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 border border-gray-200 card-hover"
            data-testid={stat.testid}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Bem-vindo ao GymTrack</h2>
        <p className="text-gray-600 leading-relaxed">
          Este é o painel administrativo do GymTrack, seu sistema completo de gestão de academia.
          Utilize o menu lateral para navegar entre as diferentes seções e gerenciar alunos,
          instrutores, agendas e treinos.
        </p>
      </div>
    </div>
  );
}