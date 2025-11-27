import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Clock, Calendar, Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Agendas() {
  const [agendasFixas, setAgendasFixas] = useState([]);
  const [treinosPersonalizados, setTreinosPersonalizados] = useState([]);
  const [instrutores, setInstrutores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState(null);
  const [searchInstrutor, setSearchInstrutor] = useState('');
  const [formData, setFormData] = useState({
    instrutor_id_instrutor: '',
    dias_semana: '',
    hora_inicio: '',
    hora_fim: '',
    disponivel: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [agendasRes, treinosRes, instrutoresRes] = await Promise.all([
        axios.get(`${API}/agendas-fixas`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/treinos`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/instrutores`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAgendasFixas(agendasRes.data);
      setTreinosPersonalizados(treinosRes.data.filter(t => t.tipo_treino === 'Personalizado' && t.data));
      setInstrutores(instrutoresRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (editingAgenda) {
        await axios.put(`${API}/agendas-fixas/${editingAgenda.id_agenda}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Horário fixo atualizado com sucesso!');
      } else {
        await axios.post(`${API}/agendas-fixas`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Horário fixo criado com sucesso!');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar horário fixo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este horário fixo?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/agendas-fixas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Horário fixo deletado com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao deletar horário fixo');
    }
  };

  const handleEdit = (agenda) => {
    setEditingAgenda(agenda);
    setFormData({
      instrutor_id_instrutor: agenda.instrutor_id_instrutor,
      dias_semana: agenda.dias_semana,
      hora_inicio: agenda.hora_inicio,
      hora_fim: agenda.hora_fim,
      disponivel: agenda.disponivel
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      instrutor_id_instrutor: '',
      dias_semana: '',
      hora_inicio: '',
      hora_fim: '',
      disponivel: true
    });
    setEditingAgenda(null);
  };

  const filteredAgendas = agendasFixas.filter(agenda =>
    agenda.instrutor_nome.toLowerCase().includes(searchInstrutor.toLowerCase())
  );

  const filteredTreinos = treinosPersonalizados.filter(treino =>
    searchInstrutor === '' || treino.instrutor_nome?.toLowerCase().includes(searchInstrutor.toLowerCase())
  );

  const handleToggleConcluido = async (id_treino) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/treinos/${id_treino}/toggle-concluido`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTreinosPersonalizados(prev =>
        prev.map(t =>
          t.id_treino === id_treino
            ? { ...t, concluido: !t.concluido }
            : t
        )
      );
      toast.success('Status atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="fade-in" data-testid="agendas-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Agendas</h1>
          <p className="text-gray-600">Horários fixos dos instrutores e treinos agendados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700" data-testid="add-agenda-button">
              <Plus className="w-4 h-4 mr-2" />
              Novo Horário Fixo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAgenda ? 'Editar Horário Fixo' : 'Novo Horário Fixo'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="agenda-form">
              <div>
                <Label htmlFor="instrutor">Instrutor *</Label>
                <Select
                  value={formData.instrutor_id_instrutor}
                  onValueChange={(value) => setFormData({ ...formData, instrutor_id_instrutor: value })}
                  required
                >
                  <SelectTrigger data-testid="agenda-instrutor-select">
                    <SelectValue placeholder="Selecione um instrutor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instrutores.map((instrutor) => (
                      <SelectItem key={instrutor.id_instrutor} value={instrutor.id_instrutor}>
                        {instrutor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dias_semana">Dias da Semana *</Label>
                <Input
                  id="dias_semana"
                  placeholder="Ex: Seg-Sex, Seg/Qua/Sex"
                  value={formData.dias_semana}
                  onChange={(e) => setFormData({ ...formData, dias_semana: e.target.value })}
                  required
                  data-testid="agenda-dias-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hora_inicio">Hora Início *</Label>
                  <Input
                    id="hora_inicio"
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                    required
                    data-testid="agenda-hora-inicio-input"
                  />
                </div>
                <div>
                  <Label htmlFor="hora_fim">Hora Fim *</Label>
                  <Input
                    id="hora_fim"
                    type="time"
                    value={formData.hora_fim}
                    onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                    required
                    data-testid="agenda-hora-fim-input"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="disponivel">Disponível</Label>
                <Switch
                  id="disponivel"
                  checked={formData.disponivel}
                  onCheckedChange={(checked) => setFormData({ ...formData, disponivel: checked })}
                  data-testid="agenda-disponivel-switch"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="agenda-submit-button">
                {editingAgenda ? 'Atualizar' : 'Criar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar por instrutor..."
            value={searchInstrutor}
            onChange={(e) => setSearchInstrutor(e.target.value)}
            className="pl-10"
            data-testid="search-instrutor-input"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="horarios" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="horarios">Horários Fixos</TabsTrigger>
          <TabsTrigger value="treinos">Treinos Agendados</TabsTrigger>
        </TabsList>

        {/* Tab: Horários Fixos */}
        <TabsContent value="horarios">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="agendas-table">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Instrutor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dias da Semana</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Horário</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAgendas.map((agenda) => (
                    <tr key={agenda.id_agenda} className="hover:bg-gray-50" data-testid="agenda-row">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{agenda.instrutor_nome}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {agenda.dias_semana}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {agenda.hora_inicio} - {agenda.hora_fim}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {agenda.disponivel ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Disponível</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-600 font-medium">Indisponível</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(agenda)}
                            data-testid="edit-agenda-button"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(agenda.id_agenda)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid="delete-agenda-button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAgendas.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhum horário fixo encontrado</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Treinos Agendados */}
        <TabsContent value="treinos">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="treinos-agendados-table">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Aluno</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Treino</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Instrutor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Horário</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTreinos.map((treino) => (
                    <tr
                      key={treino.id_treino}
                      className={`hover:bg-gray-50 ${treino.concluido ? 'bg-green-50/30' : ''}`}
                      data-testid="treino-agendado-row"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{treino.aluno_nome}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{treino.nome_treino}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{treino.instrutor_nome || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {treino.data ? new Date(treino.data).toLocaleDateString('pt-BR') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {treino.hora_inicio && treino.hora_fim ? `${treino.hora_inicio} - ${treino.hora_fim}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleConcluido(treino.id_treino)}
                            className={`h-9 px-3 rounded-full font-medium transition-all ${
                              treino.concluido
                                ? 'bg-green-100 hover:bg-green-200 text-green-700'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                            data-testid="toggle-concluido-button"
                          >
                            {treino.concluido ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Concluído
                              </>
                            ) : (
                              'Pendente'
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTreinos.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhum treino agendado encontrado</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}