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

export default function Instrutores() {
  const [instrutores, setInstrutores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstrutor, setEditingInstrutor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    idade: '',
    email: '',
    telefone: ''
  });

  useEffect(() => {
    fetchInstrutores();
  }, []);

  const fetchInstrutores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/instrutores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInstrutores(response.data);
    } catch (error) {
      toast.error('Erro ao carregar instrutores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (editingInstrutor) {
        await axios.put(`${API}/instrutores/${editingInstrutor.id_instrutor}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Instrutor atualizado com sucesso!');
      } else {
        await axios.post(`${API}/instrutores`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Instrutor criado com sucesso!');
      }
      setDialogOpen(false);
      resetForm();
      fetchInstrutores();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar instrutor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este instrutor?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/instrutores/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Instrutor deletado com sucesso!');
      fetchInstrutores();
    } catch (error) {
      toast.error('Erro ao deletar instrutor');
    }
  };

  const handleEdit = (instrutor) => {
    setEditingInstrutor(instrutor);
    setFormData({
      nome: instrutor.nome,
      idade: instrutor.idade.toString(),
      email: instrutor.email || '',
      telefone: instrutor.telefone || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ nome: '', idade: '', email: '', telefone: '' });
    setEditingInstrutor(null);
  };

  const filteredInstrutores = instrutores.filter(instrutor =>
    instrutor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instrutor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in" data-testid="instrutores-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Instrutores</h1>
          <p className="text-gray-600">Gerencie os instrutores da academia</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700" data-testid="add-instrutor-button">
              <Plus className="w-4 h-4 mr-2" />
              Novo Instrutor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingInstrutor ? 'Editar Instrutor' : 'Novo Instrutor'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="instrutor-form">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  data-testid="instrutor-nome-input"
                />
              </div>
              <div>
                <Label htmlFor="idade">Idade *</Label>
                <Input
                  id="idade"
                  type="number"
                  min="18"
                  value={formData.idade}
                  onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                  required
                  data-testid="instrutor-idade-input"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="instrutor-email-input"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  data-testid="instrutor-telefone-input"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="instrutor-submit-button">
                {editingInstrutor ? 'Atualizar' : 'Criar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar instrutor por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-instrutor-input"
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
            <table className="w-full" data-testid="instrutores-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Idade</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Telefone</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInstrutores.map((instrutor) => (
                  <tr key={instrutor.id_instrutor} className="hover:bg-gray-50" data-testid="instrutor-row">
                    <td className="px-6 py-4 text-sm text-gray-900">{instrutor.nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{instrutor.idade}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{instrutor.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{instrutor.telefone || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(instrutor)}
                          data-testid="edit-instrutor-button"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(instrutor.id_instrutor)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid="delete-instrutor-button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredInstrutores.length === 0 && (
              <div className="text-center py-12" data-testid="no-instrutores-message">
                <p className="text-gray-500">Nenhum instrutor encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}