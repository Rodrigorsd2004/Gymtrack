import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Treinos() {
  const [treinos, setTreinos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTreino, setEditingTreino] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    tipo_treino: 'Simples',
    nome_treino: '',
    aluno_id_aluno: '',
    agenda_id_agenda: '',
    descricao: '',
    nivel: '',
    duracao: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [treinosRes, alunosRes, agendasRes] = await Promise.all([
        axios.get(`${API}/treinos`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/alunos`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/agendas`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTreinos(treinosRes.data);
      setAlunos(alunosRes.data);
      setAgendas(agendasRes.data.filter(a => a.disponivel));
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const payload = {
      tipo_treino: formData.tipo_treino,
      nome_treino: formData.nome_treino,
      aluno_id_aluno: formData.aluno_id_aluno,
      agenda_id_agenda: formData.agenda_id_agenda || null
    };

    if (formData.tipo_treino === 'Personalizado') {
      payload.descricao = formData.descricao;
      payload.nivel = formData.nivel;
      payload.duracao = formData.duracao;
    }

    try {
      if (editingTreino) {
        await axios.put(`${API}/treinos/${editingTreino.id_treino}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Treino atualizado com sucesso!');
      } else {
        await axios.post(`${API}/treinos`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Treino criado com sucesso!');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar treino');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este treino?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/treinos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Treino deletado com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao deletar treino');
    }
  };

  const handleEdit = (treino) => {
    setEditingTreino(treino);
    setFormData({
      tipo_treino: treino.tipo_treino,
      nome_treino: treino.nome_treino,
      aluno_id_aluno: treino.aluno_id_aluno,
      agenda_id_agenda: treino.agenda_id_agenda || '',
      descricao: treino.descricao || '',
      nivel: treino.nivel || '',
      duracao: treino.duracao || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      tipo_treino: 'Simples',
      nome_treino: '',
      aluno_id_aluno: '',
      agenda_id_agenda: '',
      descricao: '',
      nivel: '',
      duracao: ''
    });
    setEditingTreino(null);
  };

  const filteredTreinos = treinos.filter(treino =>
    treino.nome_treino.toLowerCase().includes(searchTerm.toLowerCase()) ||
    treino.aluno_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in" data-testid="treinos-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Treinos</h1>
          <p className="text-gray-600">Gerencie os treinos dos alunos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700" data-testid="add-treino-button">
              <Plus className="w-4 h-4 mr-2" />
              Novo Treino
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTreino ? 'Editar Treino' : 'Novo Treino'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="treino-form">
              <div>
                <Label htmlFor="tipo_treino">Tipo de Treino *</Label>
                <Select
                  value={formData.tipo_treino}
                  onValueChange={(value) => setFormData({ ...formData, tipo_treino: value })}
                  required
                >
                  <SelectTrigger data-testid="treino-tipo-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simples">Simples</SelectItem>
                    <SelectItem value="Personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nome_treino">Nome do Treino *</Label>
                <Input
                  id="nome_treino"
                  value={formData.nome_treino}
                  onChange={(e) => setFormData({ ...formData, nome_treino: e.target.value })}
                  required
                  data-testid="treino-nome-input"
                />
              </div>
              <div>
                <Label htmlFor="aluno">Aluno *</Label>
                <Select
                  value={formData.aluno_id_aluno}
                  onValueChange={(value) => setFormData({ ...formData, aluno_id_aluno: value })}
                  required
                >
                  <SelectTrigger data-testid="treino-aluno-select">
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos.map((aluno) => (
                      <SelectItem key={aluno.id_aluno} value={aluno.id_aluno}>
                        {aluno.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="agenda">Agenda (Opcional)</Label>
                <Select
                  value={formData.agenda_id_agenda}
                  onValueChange={(value) => setFormData({ ...formData, agenda_id_agenda: value })}
                >
                  <SelectTrigger data-testid="treino-agenda-select">
                    <SelectValue placeholder="Selecione uma agenda" />
                  </SelectTrigger>
                  <SelectContent>
                    {agendas.map((agenda) => (
                      <SelectItem key={agenda.id_agenda} value={agenda.id_agenda}>
                        {agenda.instrutor_nome} - {new Date(agenda.data).toLocaleDateString('pt-BR')} ({agenda.hora_inicio})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo_treino === 'Personalizado' && (
                <>
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      rows={3}
                      data-testid="treino-descricao-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nivel">Nível</Label>
                    <Input
                      id="nivel"
                      value={formData.nivel}
                      onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                      placeholder="Ex: Iniciante, Intermediário, Avançado"
                      data-testid="treino-nivel-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duracao">Duração</Label>
                    <Input
                      id="duracao"
                      type="time"
                      value={formData.duracao}
                      onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                      data-testid="treino-duracao-input"
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" data-testid="treino-submit-button">
                {editingTreino ? 'Atualizar' : 'Criar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar treino por nome ou aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-treino-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="treinos-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Aluno</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nível</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Duração</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTreinos.map((treino) => (
                  <tr key={treino.id_treino} className="hover:bg-gray-50" data-testid="treino-row">
                    <td className="px-6 py-4 text-sm text-gray-900">{treino.nome_treino}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        treino.tipo_treino === 'Personalizado'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {treino.tipo_treino}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{treino.aluno_nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{treino.nivel || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{treino.duracao || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(treino)}
                          data-testid="edit-treino-button"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(treino.id_treino)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid="delete-treino-button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTreinos.length === 0 && (
              <div className="text-center py-12" data-testid="no-treinos-message">
                <p className="text-gray-500">Nenhum treino encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}