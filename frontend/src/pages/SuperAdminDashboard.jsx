import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' o 'teachers'
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Estado para creación de Admin o Profesor
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'room_admin' // Por defecto para administradores
  });

  // Estado para edición
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    // Determinar el rol según la pestaña activa
    const currentRole = activeTab === 'admins' ? 'room_admin' : 'teacher';
    const dataToSend = { ...formData, role: currentRole };

    try {
      if (editingUser) {
        // Actualizar usuario existente
        await api.put(`/users/${editingUser.id}`, dataToSend);
        setMessage({ text: 'Usuario actualizado con éxito', type: 'success' });
        setEditingUser(null);
      } else {
        // CREAR NUEVO USUARIO: 
        // Si es admin usa '/auth/admin/create', si es profesor usa '/auth/register'
        const endpoint = currentRole === 'room_admin' ? '/auth/admin/create' : '/auth/register';
        
        await api.post(endpoint, dataToSend);
        setMessage({ text: `${currentRole === 'room_admin' ? 'Administrador' : 'Profesor'} creado con éxito`, type: 'success' });
      }

      setFormData({ name: '', email: '', password: '', phone: '', role: currentRole });
      fetchUsers();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Error al procesar la solicitud', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await api.delete(`/users/${id}`);
      setMessage({ text: 'Usuario eliminado con éxito', type: 'success' });
      fetchUsers();
    } catch (err) {
      setMessage({ text: 'Error al eliminar el usuario', type: 'error' });
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Se deja en blanco al editar si no se quiere cambiar
      phone: user.phone || '',
      role: user.role
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', phone: '', role: activeTab === 'admins' ? 'room_admin' : 'teacher' });
  };

  // Filtrar según la pestaña activa
  const filteredUsers = users.filter(u => activeTab === 'admins' ? u.role === 'room_admin' : u.role === 'teacher');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Navegación por pestañas */}
      <div className="flex space-x-4 border-b pb-2">
        <button
          type="button"
          onClick={() => { 
            setActiveTab('admins'); 
            setFormData(prev => ({ ...prev, role: 'room_admin' })); 
            cancelEdit(); 
          }}
          className={`px-4 py-2 font-semibold rounded-t-lg transition ${activeTab === 'admins' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
        >
          Gestionar Administradores
        </button>
        <button
          type="button"
          onClick={() => { 
            setActiveTab('teachers'); 
            setFormData(prev => ({ ...prev, role: 'teacher' })); 
            cancelEdit(); 
          }}
          className={`px-4 py-2 font-semibold rounded-t-lg transition ${activeTab === 'teachers' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
        >
          Gestionar Profesores
        </button>
      </div>

      {message.text && (
        <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Formulario de Creación / Edición */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          {editingUser ? `Editando a ${editingUser.name}` : (activeTab === 'admins' ? 'Crear Administrador de Sala' : 'Crear Profesor')}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nombre Completo</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full p-2 border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Correo Electrónico</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 w-full p-2 border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Contraseña {editingUser && '(Opcional)'}</label>
            <input
              type="password"
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 w-full p-2 border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Teléfono / Contacto</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 w-full p-2 border border-slate-300 rounded"
            />
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded transition">
              {editingUser ? 'Guardar Cambios' : (activeTab === 'admins' ? 'Registrar Administrador' : 'Registrar Profesor')}
            </button>
            {editingUser && (
              <button type="button" onClick={cancelEdit} className="bg-slate-400 hover:bg-slate-500 text-white font-semibold px-4 py-2 rounded transition">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          {activeTab === 'admins' ? 'Lista de Administradores Registrados' : 'Lista de Profesores Registrados'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-slate-400">No hay registros en esta categoría.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b">
                    <td className="p-3 font-medium text-slate-800">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.phone || 'N/A'}</td>
                    <td className="p-3 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(user)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs transition"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};