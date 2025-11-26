import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Agendas() {
  const [agendas, setAgendas] = useState([]);
  const [instrutores, setInstrutores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState(null);
  const [formData, setFormData] = useState({
    data: '',
    hora_inicio: '',
    hora_fim: '',
    disponivel: true,
    instrutor_id_instrutor: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [agendasRes, instrutoresRes] = await Promise.all([
        axios.get(`${API}/agendas`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/instrutores`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAgendas(agendasRes.data);
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
        await axios.put(`${API}/agendas/${editingAgenda.id_agenda}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Agenda atualizada com sucesso!');
      } else {
        await axios.post(`${API}/agendas`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Agenda criada com sucesso!');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar agenda');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar esta agenda?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/agendas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agenda deletada com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao deletar agenda');
    }
  };

  const handleEdit = (agenda) => {
    setEditingAgenda(agenda);
    setFormData({
      data: agenda.data,
      hora_inicio: agenda.hora_inicio,
      hora_fim: agenda.hora_fim,
      disponivel: agenda.disponivel,
      instrutor_id_instrutor: agenda.instrutor_id_instrutor
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      data: '',
      hora_inicio: '',
      hora_fim: '',
      disponivel: true,
      instrutor_id_instrutor: ''
    });
    setEditingAgenda(null);
  };

  return (
    <div className="fade-in" data-testid="agendas-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Agendas</h1>
          <p className="text-gray-600">Gerencie os horários dos instrutores</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700" data-testid="add-agenda-button">
              <Plus className="w-4 h-4 mr-2" />
              Nova Agenda
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAgenda ? 'Editar Agenda' : 'Nova Agenda'}</DialogTitle>
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
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                  data-testid="agenda-data-input"
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

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="agendas-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Instrutor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Horário</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agendas.map((agenda) => (
                  <tr key={agenda.id_agenda} className="hover:bg-gray-50" data-testid="agenda-row">
                    <td className="px-6 py-4 text-sm text-gray-900">{agenda.instrutor_nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(agenda.data).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{agenda.hora_inicio} - {agenda.hora_fim}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {agenda.disponivel ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Disponível</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-600 font-medium">Indisponível</span>
                          </>
                        )}
                      </div>
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
            {agendas.length === 0 && (
              <div className="text-center py-12" data-testid="no-agendas-message">
                <p className="text-gray-500">Nenhuma agenda encontrada</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}