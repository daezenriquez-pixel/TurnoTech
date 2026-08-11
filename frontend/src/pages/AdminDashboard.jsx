import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const AdminDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' o 'history'

  const fetchReservations = async () => {
    try {
      const endpoint = activeTab === 'active' ? '/reservations/active' : '/reservations/history';
      const res = await api.get(endpoint);
      setReservations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [activeTab]);

  const handleCancel = async (reservationId) => {
    const loggedInUser = JSON.parse(localStorage.getItem('user'));

    if (!loggedInUser) {
      alert('Sesión no encontrada. Por favor, vuelve a iniciar sesión.');
      return;
    }

    try {
      await api.delete(`/reservations/${reservationId}`, {
        data: {
          user_id: loggedInUser.id,
          user_role: loggedInUser.role
        }
      });
      alert('Reserva cancelada con éxito');
      fetchReservations();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al cancelar la reserva');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/reservations/${id}/status`, { status });
      fetchReservations();
    } catch (err) {
      alert('Error al actualizar el estado');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Pestañas de navegación */}
      <div className="flex space-x-4 border-b pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-semibold rounded-t-lg transition ${activeTab === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
        >
          Solicitudes Vigentes
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-semibold rounded-t-lg transition ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
        >
          Historial de Pasadas
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          {activeTab === 'active' ? 'Gestión de Solicitudes de Préstamo' : 'Historial de Préstamos Anteriores'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
              <tr>
                <th className="p-3">Docente</th>
                <th className="p-3">Sala</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Horario</th>
                <th className="p-3">Grado</th>
                <th className="p-3">Estado</th>
                {activeTab === 'active' && <th className="p-3">Acciones</th>}
                <th className="p-3">Gestión</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'active' ? '8' : '7'} className="p-4 text-center text-slate-400">
                    No hay registros en esta sección.
                  </td>
                </tr>
              ) : (
                reservations.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="p-3 font-medium text-slate-800">{r.teacher_name}</td>
                    <td className="p-3">{r.room_name}</td>
                    <td className="p-3">{r.date.split('T')[0]}</td>
                    <td className="p-3">{r.time_slot}</td>
                    <td className="p-3">{r.grade}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {r.status}
                      </span>
                    </td>
                    {activeTab === 'active' && (
                      <td className="p-3 space-x-2">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(r.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition"
                            >
                              Aceptar
                            </button>
                            <button
                              onClick={() => handleStatusChange(r.id, 'rejected')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                      </td>
                    )}
                    <td className="p-3">
                      <button
                        onClick={() => handleCancel(r.id)}
                        style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Cancelar
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