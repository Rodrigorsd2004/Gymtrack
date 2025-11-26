import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Alunos() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    idade: '',
    email: ''
  });

  useEffect(() => {
    fetchAlunos();
  }, []);

  const fetchAlunos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/alunos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlunos(response.data);
    } catch (error) {
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (editingAluno) {
        await axios.put(`${API}/alunos/${editingAluno.id_aluno}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Aluno atualizado com sucesso!');
      } else {
        await axios.post(`${API}/alunos`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Aluno criado com sucesso!');
      }
      setDialogOpen(false);
      resetForm();
      fetchAlunos();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar aluno');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este aluno?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/alunos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Aluno deletado com sucesso!');
      fetchAlunos();
    } catch (error) {
      toast.error('Erro ao deletar aluno');
    }
  };

  const handleEdit = (aluno) => {
    setEditingAluno(aluno);
    setFormData({
      nome: aluno.nome,
      endereco: aluno.endereco || '',
      idade: aluno.idade.toString(),
      email: aluno.email || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ nome: '', endereco: '', idade: '', email: '' });
    setEditingAluno(null);
  };

  const filteredAlunos = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in" data-testid="alunos-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Alunos</h1>
          <p className="text-gray-600">Gerencie os alunos da academia</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700" data-testid="add-aluno-button">
              <Plus className="w-4 h-4 mr-2" />
              Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAluno ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="aluno-form">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  data-testid="aluno-nome-input"
                />
              </div>
              <div>
                <Label htmlFor="idade">Idade *</Label>
                <Input
                  id="idade"
                  type="number"
                  min="7"
                  value={formData.idade}
                  onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                  required
                  data-testid="aluno-idade-input"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="aluno-email-input"
                />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  data-testid="aluno-endereco-input"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="aluno-submit-button">
                {editingAluno ? 'Atualizar' : 'Criar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar aluno por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-aluno-input"
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
            <table className="w-full" data-testid="alunos-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Idade</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Endereço</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAlunos.map((aluno) => (
                  <tr key={aluno.id_aluno} className="hover:bg-gray-50" data-testid="aluno-row">
                    <td className="px-6 py-4 text-sm text-gray-900">{aluno.nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{aluno.idade}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{aluno.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{aluno.endereco || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(aluno)}
                          data-testid="edit-aluno-button"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(aluno.id_aluno)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid="delete-aluno-button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAlunos.length === 0 && (
              <div className="text-center py-12" data-testid="no-alunos-message">
                <p className="text-gray-500">Nenhum aluno encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}