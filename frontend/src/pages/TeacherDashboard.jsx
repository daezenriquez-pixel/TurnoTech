import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Monitor, Cpu, Sparkles, Clock, CalendarDays, DoorOpen, CalendarCheck,
  CheckCircle2, AlertCircle, Lock, Trash2, Loader2, BookOpenCheck, Check,
} from 'lucide-react';

// Salas de cómputo del colegio. El id debe existir en la tabla `rooms` del backend.
const ROOMS = [
  { id: '1', name: 'Sala 1', tag: 'Básica', icon: Monitor, desc: 'Equipos para clase regular' },
  { id: '2', name: 'Sala 2', tag: 'Avanzada', icon: Cpu, desc: 'Equipos para clase regular' },
];

// Debe coincidir exactamente con los valores que espera el backend.
const TIME_SLOTS = ['1ra hora', '2da hora', '3ra hora', '4ta hora', '5ta hora', '6ma hora'];

const STATUS_META = {
  approved: { label: 'Aprobada', pill: 'bg-turquesa-100 text-turquesa-700 dark:bg-turquesa-500/15 dark:text-turquesa-300' },
  pending: { label: 'Pendiente', pill: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  rejected: { label: 'Rechazada', pill: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
};

const todayISO = () => new Date().toISOString().split('T')[0];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

const formatDatePretty = (isoDate) => {
  if (!isoDate) return '';
  const d = new Date(`${isoDate.split('T')[0]}T00:00:00`);
  const s = d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const roomMeta = (roomId) => ROOMS.find((r) => String(r.id) === String(roomId));

export const TeacherDashboard = () => {
  const { user } = useAuth();

  const [myActive, setMyActive] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [allActive, setAllActive] = useState([]); // ocupación de todas las salas (todos los docentes)
  const [activeTab, setActiveTab] = useState('active');
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    room_id: ROOMS[0].id,
    date: '',
    time_slot: '',
    grade: '',
    purpose: '',
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  const today = useMemo(() => todayISO(), []);

  const fetchTeacherData = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        api.get(`/reservations/teacher/active/${user.id}`),
        api.get(`/reservations/teacher/history/${user.id}`),
      ]);
      setMyActive(activeRes.data || []);
      setMyHistory(historyRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, [user]);

  const fetchOccupancy = useCallback(async () => {
    try {
      const res = await api.get('/reservations/active');
      setAllActive(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchTeacherData(); }, [fetchTeacherData]);
  useEffect(() => { fetchOccupancy(); }, [fetchOccupancy]);

  // --- Estadísticas rápidas ---
  const roomsApprovedToday = useMemo(() => {
    const set = new Set();
    allActive.forEach((r) => {
      if (r.date?.split('T')[0] === today && r.status === 'approved') set.add(String(r.room_id));
    });
    return set;
  }, [allActive, today]);
  const salasDisponiblesHoy = ROOMS.length - roomsApprovedToday.size;
  const misReservasActivas = myActive.length;

  // --- Disponibilidad de horarios para la sala/fecha elegidas en el formulario ---
  const slotState = useCallback((slot) => {
    if (!formData.date) return 'idle';
    const isPast = formData.date === today && TIME_SLOTS.indexOf(slot) < 0; // reservado para futuras reglas horarias
    const match = allActive.find(
      (r) =>
        String(r.room_id) === String(formData.room_id) &&
        r.date?.split('T')[0] === formData.date &&
        r.time_slot === slot &&
        r.status !== 'rejected'
    );
    if (!match) return isPast ? 'idle' : 'free';
    return match.status === 'approved' ? 'occupied' : 'pending';
  }, [allActive, formData.date, formData.room_id, today]);

  const handleSelectSlot = (slot) => {
    if (slotState(slot) === 'occupied') return;
    setFormData((f) => ({ ...f, time_slot: slot }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!formData.date || !formData.time_slot) {
      setMessage({ text: 'Selecciona una fecha y un bloque de hora disponible.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reservations', {
        user_id: user.id,
        room_id: formData.room_id,
        date: formData.date,
        time_slot: formData.time_slot,
        grade: formData.grade,
        purpose: formData.purpose,
      });
      setMessage({ text: '¡Reserva solicitada con éxito! Queda pendiente de aprobación.', type: 'success' });
      setFormData((f) => ({ ...f, time_slot: '', grade: '', purpose: '' }));
      fetchTeacherData();
      fetchOccupancy();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Error al realizar la reserva.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (reservationId) => {
    if (!window.confirm('¿Cancelar esta reserva?')) return;
    try {
      await api.delete(`/reservations/${reservationId}`, {
        data: { user_id: user.id, user_role: user.role },
      });
      fetchTeacherData();
      fetchOccupancy();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cancelar la reserva.');
    }
  };

  const listedReservations = activeTab === 'active' ? myActive : myHistory;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden rounded-3xl bg-institucional-700 dark:bg-institucional-950
                           shadow-soft-lg px-6 sm:px-10 py-10 sm:py-12">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-turquesa-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-institucional-400/20 blur-3xl" />

        <div className="relative grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase
                             text-turquesa-200 bg-white/10 px-3 py-1 rounded-full">
              <BookOpenCheck className="w-3.5 h-3.5" /> Panel del docente
            </span>
            <h1 className="mt-4 text-2xl sm:text-3xl font-display font-bold text-white leading-tight">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'docente'}.
            </h1>
            <p className="mt-2 text-institucional-100/90 max-w-md">
              Reserva una sala de cómputo para tu próxima clase en pocos pasos: elige la sala,
              la fecha y un bloque de hora disponible.
            </p>
          </div>

          {/* Mockup del "monitor" con una mini rejilla de disponibilidad, animado */}
          <div className="relative flex justify-center md:justify-end animate-float">
            <div className="w-full max-w-xs">
              <div className="rounded-2xl bg-institucional-900/80 dark:bg-black/40 border border-white/10 shadow-soft-lg overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-white/5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-turquesa-300/80" />
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-1.5">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-5 rounded-md ${
                          [2, 5, 9, 13].includes(i)
                            ? 'bg-turquesa-400/90 animate-pulse-soft'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-4 h-2 w-2/3 rounded-full bg-white/15" />
                  <div className="mt-2 h-2 w-1/2 rounded-full bg-white/10" />
                </div>
              </div>
              {/* Base del monitor */}
              <div className="mx-auto mt-1 h-3 w-24 rounded-b-xl bg-institucional-900/70 dark:bg-black/30" />
              <div className="mx-auto h-1.5 w-36 rounded-full bg-institucional-950/60 dark:bg-black/40" />

              {/* Insignia flotante */}
              <div className="absolute -top-3 -left-3 flex items-center gap-1.5 bg-white text-institucional-800
                              text-xs font-semibold px-3 py-1.5 rounded-full shadow-soft-lg">
                <Check className="w-3.5 h-3.5 text-turquesa-600" /> Sala disponible
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- ESTADÍSTICAS RÁPIDAS ---------- */}
      <section className="grid sm:grid-cols-2 gap-4 -mt-2">
        <div className="rounded-2xl bg-white dark:bg-institucional-800 shadow-soft p-5 flex items-center gap-4
                        border border-slate-100 dark:border-white/5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-2xl bg-turquesa-50 dark:bg-turquesa-500/10 flex items-center justify-center shrink-0">
            <DoorOpen className="w-6 h-6 text-turquesa-600 dark:text-turquesa-300" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-slate-800 dark:text-white leading-none">
              {salasDisponiblesHoy}/{ROOMS.length}
            </p>
            <p className="text-sm text-slate-500 dark:text-institucional-200 mt-1">Salas disponibles hoy</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-institucional-800 shadow-soft p-5 flex items-center gap-4
                        border border-slate-100 dark:border-white/5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-2xl bg-institucional-50 dark:bg-institucional-500/10 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6 text-institucional-600 dark:text-institucional-200" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-slate-800 dark:text-white leading-none">
              {misReservasActivas}
            </p>
            <p className="text-sm text-slate-500 dark:text-institucional-200 mt-1">Mis reservas activas</p>
          </div>
        </div>
      </section>

      {/* ---------- FORMULARIO DE RESERVA ---------- */}
      <section className="rounded-3xl bg-white dark:bg-institucional-800 shadow-soft p-5 sm:p-8
                          border border-slate-100 dark:border-white/5">
        <h2 className="text-lg font-display font-bold text-slate-800 dark:text-white">
          Reservar sala de cómputo
        </h2>
        <p className="text-sm text-slate-500 dark:text-institucional-300 mt-1">
          Elige la sala, la fecha y un bloque de hora libre para tu clase.
        </p>

        {message.text && (
          <div
            className={`mt-4 flex items-start gap-2 p-3 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-turquesa-50 text-turquesa-700 dark:bg-turquesa-500/10 dark:text-turquesa-300'
                : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleBooking} className="mt-5 space-y-6">
          {/* Selector de sala */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-institucional-100 mb-2">
              Sala
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              {ROOMS.map((room) => {
                const RoomIcon = room.icon;
                const selected = String(formData.room_id) === String(room.id);
                const isDisabled = !!room.disabled;
                return (
                  <button
                    type="button"
                    key={room.id}
                    disabled={isDisabled}
                    aria-disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return;
                      setFormData((f) => ({ ...f, room_id: room.id, time_slot: '' }));
                    }}
                    className={`sm:flex-1 text-left p-4 rounded-2xl border-2 transition-all duration-200
                                ${isDisabled
                                  ? 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 opacity-60 cursor-not-allowed'
                                  : selected
                                  ? 'border-turquesa-500 bg-turquesa-50 dark:bg-turquesa-500/10 hover:scale-[1.02]'
                                  : 'border-slate-200 dark:border-white/10 hover:border-institucional-300 hover:scale-[1.02]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                                      ${isDisabled ? 'bg-slate-100 dark:bg-white/10 text-slate-300 dark:text-white/20' : selected ? 'bg-turquesa-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-institucional-600 dark:text-institucional-200'}`}>
                        {isDisabled ? <Lock className="w-4 h-4" /> : <RoomIcon className="w-4.5 h-4.5" />}
                      </div>
                      {selected && !isDisabled && <CheckCircle2 className="w-4 h-4 text-turquesa-600 dark:text-turquesa-300" />}
                    </div>
                    <p className={`mt-3 font-semibold text-sm ${isDisabled ? 'text-slate-400 dark:text-white/30' : 'text-slate-800 dark:text-white'}`}>
                      {room.name} <span className="font-normal text-slate-400 dark:text-institucional-300">· {room.tag}</span>
                    </p>
                    <p className={`text-xs mt-1 ${isDisabled ? 'text-slate-400 dark:text-white/30' : 'text-slate-500 dark:text-institucional-300'}`}>{room.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Fecha */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-institucional-100 mb-2">
                <CalendarDays className="w-4 h-4" /> Fecha
              </label>
              <input
                type="date"
                required
                min={today}
                value={formData.date}
                onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value, time_slot: '' }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10
                          bg-white dark:bg-institucional-900 text-slate-800 dark:text-white
                          focus-visible:ring-2 focus-visible:ring-turquesa-400 transition-shadow"
              />
            </div>

            {/* Grado */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-institucional-100 mb-2">
                Grado / curso
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 10-3"
                value={formData.grade}
                onChange={(e) => setFormData((f) => ({ ...f, grade: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10
                          bg-white dark:bg-institucional-900 text-slate-800 dark:text-white
                          focus-visible:ring-2 focus-visible:ring-turquesa-400 transition-shadow"
              />
            </div>
          </div>

          {/* Bloques de hora */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-institucional-100 mb-2">
              <Clock className="w-4 h-4" /> Horario
            </label>

            {!formData.date ? (
              <p className="text-sm text-slate-400 dark:text-institucional-300 italic">
                Selecciona una fecha para ver los bloques disponibles.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {TIME_SLOTS.map((slot) => {
                  const state = slotState(slot);
                  const selected = formData.time_slot === slot;
                  const occupied = state === 'occupied';
                  const pending = state === 'pending';
                  return (
                    <button
                      type="button"
                      key={slot}
                      disabled={occupied}
                      onClick={() => handleSelectSlot(slot)}
                      className={`relative flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs font-semibold
                                  border-2 transition-all duration-200
                                  ${occupied
                                    ? 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-white/20 cursor-not-allowed'
                                    : selected
                                    ? 'border-turquesa-500 bg-turquesa-500 text-white hover:scale-105'
                                    : pending
                                    ? 'border-amber-300 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:scale-105'
                                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-institucional-100 hover:border-turquesa-400 hover:scale-105'}`}
                    >
                      {occupied ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            selected ? 'bg-white' : pending ? 'bg-amber-500' : 'bg-turquesa-500 animate-pulse-soft'
                          }`}
                        />
                      )}
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500 dark:text-institucional-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-turquesa-500" /> Libre</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Solicitada (pendiente)</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Ocupada</span>
            </div>
          </div>

          {/* Propósito de la clase */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-institucional-100 mb-2">
              Propósito o tema de la clase
            </label>
            <textarea
              required
              rows={2}
              placeholder="Ej: Taller de hoja de cálculo — funciones básicas"
              value={formData.purpose}
              onChange={(e) => setFormData((f) => ({ ...f, purpose: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10
                        bg-white dark:bg-institucional-900 text-slate-800 dark:text-white resize-none
                        focus-visible:ring-2 focus-visible:ring-turquesa-400 transition-shadow"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-institucional-600 hover:bg-institucional-700
                      disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3
                      rounded-xl shadow-soft transition-all duration-200 hover:scale-[1.02]"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Solicitar reserva
          </button>
        </form>
      </section>

      {/* ---------- LISTADO DE RESERVAS ---------- */}
      <section className="rounded-3xl bg-white dark:bg-institucional-800 shadow-soft p-5 sm:p-8
                          border border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
          {[
            { key: 'active', label: 'Mis reservas vigentes' },
            { key: 'history', label: 'Historial' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors duration-200
                          ${activeTab === tab.key
                            ? 'bg-institucional-600 text-white'
                            : 'text-slate-500 dark:text-institucional-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {loadingList ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Cargando reservas…
            </div>
          ) : listedReservations.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="w-8 h-8 text-slate-300 dark:text-white/20 mx-auto mb-2" />
              <p className="text-sm text-slate-400 dark:text-institucional-300">
                {activeTab === 'active' ? 'No tienes reservas vigentes todavía.' : 'Aún no hay historial de reservas.'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listedReservations.map((r) => {
                const room = roomMeta(r.room_id);
                const RoomIcon = room?.icon || Monitor;
                const status = STATUS_META[r.status] || STATUS_META.pending;
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-slate-100 dark:border-white/10 p-4
                              hover:shadow-soft transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-institucional-50 dark:bg-white/10 flex items-center justify-center">
                          <RoomIcon className="w-4.5 h-4.5 text-institucional-600 dark:text-institucional-200" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">
                            {r.room_name || room?.name || `Sala ${r.room_id}`}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-institucional-300">{formatDatePretty(r.date)}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${status.pill}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-600 dark:text-institucional-100">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {r.time_slot}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-institucional-300 mt-1">Grado: {r.grade}</p>

                    {activeTab === 'active' && r.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleCancel(r.id)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400
                                  hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Cancelar
                      </button>
                    )}
                    {activeTab === 'active' && r.status === 'approved' && (
                      <p className="mt-3 text-[11px] text-slate-400 dark:text-institucional-300 italic">
                        Aprobada — contacta al administrador para cambios.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
