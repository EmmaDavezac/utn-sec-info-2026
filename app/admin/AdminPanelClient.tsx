"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSession } from "next-auth/react";
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  provider: string;
  active: boolean;
};

const ROLES = ["Administrador", "Profesor", "Estudiante"];
const ROLE_FILTERS = ["Todos", ...ROLES];

export default function AdminPanelClient() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; email: string; role: string } | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "Estudiante" });
  const [newUserErrors, setNewUserErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [creating, setCreating] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const loadUsers = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo cargar la lista de usuarios.");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const isNotCurrentUser = user.id !== (session?.user as any)?.id;
      
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      
      const matchesRole = roleFilter === "Todos" || user.role === roleFilter;

      return isNotCurrentUser && matchesQuery && matchesRole;
    });
  }, [users, searchQuery, roleFilter, session]); 

  const startEditing = (user: User) => {
    setEditingUserId(user.id);
    setEditDraft({ name: user.name, email: user.email, role: user.role });
    
    // Scroll to edit form on mobile
    setTimeout(() => {
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditDraft(null);
  };

  const updateDraft = (field: 'name' | 'email' | 'role', value: string) => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, [field]: value });
  };

  const saveUser = async (id: string) => {
    if (!editDraft || editingUserId !== id) return;

    const original = users.find((user) => user.id === id);
    if (!original) return;
    if (!editDraft.name.trim() || !editDraft.email.trim()) {
      setError('Nombre y correo son obligatorios.');
      return;
    }

    const confirmed = window.confirm(
      `¿Confirmas guardar los cambios en el usuario ${original.name}?`
    );
    if (!confirmed) return;

    setSavingId(id);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editDraft.name.trim(), email: editDraft.email.trim(), role: editDraft.role.trim() }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'No se pudo guardar el usuario.');
      }

      await loadUsers();
      cancelEdit();
      setSuccessMessage('Usuario actualizado correctamente.');
    } catch (err) {
      setSuccessMessage(null);
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const toggleUserActive = async (id: string, active: boolean) => {
    const user = users.find((item) => item.id === id);
    if (!user) return;

    const actionLabel = active ? 'habilitar' : 'dar de baja';
    const confirmed = window.confirm(`¿Seguro quieres ${actionLabel} a ${user.name}?`);
    if (!confirmed) return;

    setSavingId(id);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'No se pudo actualizar el estado del usuario.');
      }

      await loadUsers();
      setSuccessMessage(active ? 'Usuario habilitado correctamente.' : 'Usuario inhabilitado correctamente.');
    } catch (err) {
      setSuccessMessage(null);
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const createNewUser = async () => {
    const errors: { name?: string; email?: string; password?: string } = {};
    const trimmedName = newUser.name.trim();
    const trimmedEmail = newUser.email.trim();

    if (!trimmedName) {
      errors.name = 'El nombre es obligatorio.';
    }

    if (!trimmedEmail) {
      errors.email = 'El correo es obligatorio.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      errors.email = 'El correo no es válido.';
    }

    if (!newUser.password.trim()) {
      errors.password = 'La contraseña es obligatoria.';
    }

    if (Object.keys(errors).length > 0) {
      setNewUserErrors(errors);
      setError('Corrige los campos marcados.');
      return;
    }

    setNewUserErrors({});

    const confirmRegister = window.confirm(
      `¿Confirmas registrar al usuario ${trimmedName} con correo ${trimmedEmail} y rol ${newUser.role}?`
    );
    if (!confirmRegister) return;

    setCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: newUser.password,
          role: newUser.role,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'No se pudo registrar el usuario.');
      }

      setNewUser({ name: '', email: '', password: '', role: 'Estudiante' });
      await loadUsers();
      setSuccessMessage('Usuario registrado correctamente.');
      setShowRegisterForm(false);
    } catch (err) {
      setSuccessMessage(null);
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-full bg-zinc-50 dark:bg-zinc-950 px-4 py-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Panel de Administración de Usuarios</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Consulta, edita, registra y da de baja usuarios. El cambio de rol requiere confirmación explícita.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            {successMessage}
          </div>
        )}

        {!editingUserId && (
          <>
            <section className="mb-8 grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setShowRegisterForm((prev) => !prev)}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-900 bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800 transition-colors"
                >
                  {showRegisterForm ? 'Volver al panel' : 'Registrar nuevo usuario'}
                </button>
              </div>

              {!showRegisterForm && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <label className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                  Buscar usuarios
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Nombre o correo"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </label>
                <label className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                  Filtrar por rol
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {ROLE_FILTERS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </section>

          {showRegisterForm && (
            <section className="mb-10 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Registrar nuevo usuario</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                Nombre
                <input
                  value={newUser.name}
                  onChange={(event) => {
                    setNewUser((prev) => ({ ...prev, name: event.target.value }));
                    setNewUserErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`w-full rounded-lg border px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 dark:bg-zinc-900 dark:text-zinc-100 transition-colors ${
                    newUserErrors.name 
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50 dark:bg-rose-950/20' 
                      : 'border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/20 bg-white dark:border-zinc-700'
                  }`}
                />
                {newUserErrors.name && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{newUserErrors.name}</p>
                )}
              </label>
              <label className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                Correo electrónico
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(event) => {
                    setNewUser((prev) => ({ ...prev, email: event.target.value }));
                    setNewUserErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full rounded-lg border px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 dark:bg-zinc-900 dark:text-zinc-100 transition-colors ${
                    newUserErrors.email 
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50 dark:bg-rose-950/20' 
                      : 'border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/20 bg-white dark:border-zinc-700'
                  }`}
                />
                {newUserErrors.email && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{newUserErrors.email}</p>
                )}
              </label>
              <label className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                Contraseña
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(event) => {
                    setNewUser((prev) => ({ ...prev, password: event.target.value }));
                    setNewUserErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`w-full rounded-lg border px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 dark:bg-zinc-900 dark:text-zinc-100 transition-colors ${
                    newUserErrors.password 
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50 dark:bg-rose-950/20' 
                      : 'border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/20 bg-white dark:border-zinc-700'
                  }`}
                />
                {newUserErrors.password && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{newUserErrors.password}</p>
                )}
              </label>
              <label className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                Rol
                <select
                  value={newUser.role}
                  onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 transition-colors"
                >
                  {ROLES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={createNewUser}
              disabled={creating}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {creating ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrando...
                </>
              ) : (
                'Registrar usuario'
              )}
            </button>
          </section>
        )}
      </>
      )}

      {!editingUserId && !showRegisterForm && isLoading && (
        <div className="text-zinc-500 dark:text-zinc-400">Cargando usuarios...</div>
      )}

      {editingUserId && editDraft && (
        <section ref={editFormRef} className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Editar usuario</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Solo un formulario activo para no saturar la pantalla.</p>
            </div>
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar edición
            </button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
              Nombre
              <input
                type="text"
                value={editDraft.name}
                onChange={(event) => updateDraft('name', event.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 transition-colors"
              />
            </label>
            <label className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
              Correo
              <input
                type="email"
                value={editDraft.email}
                onChange={(event) => updateDraft('email', event.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 transition-colors"
              />
            </label>
            <label className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
              Rol
              <select
                value={editDraft.role}
                onChange={(event) => updateDraft('role', event.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 transition-colors"
              >
                {ROLES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => saveUser(editingUserId)}
              disabled={savingId === editingUserId}
              className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
            >
              {savingId === editingUserId ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </section>
      )}

      {!editingUserId && !showRegisterForm && !isLoading && (
          <>

            {!editingUserId && filteredUsers.length === 0 && (
              <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                No se encontraron usuarios con esa búsqueda o filtro.
              </div>
            )}

            {!editingUserId && filteredUsers.length > 0 && (
              <>
                <div className="space-y-4 lg:hidden">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</p>
                          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                        <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                          <span>Rol</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.role}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                          <span>Provider</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.provider}</span>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => startEditing(user)}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800 touch-manipulation transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleUserActive(user.id, user.active ? false : true)}
                          disabled={savingId === user.id}
                          className={`w-full rounded-lg px-4 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation transition-colors inline-flex items-center justify-center gap-2 ${
                            user.active ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                          }`}
                        >
                          {savingId === user.id ? (
                            <>
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {user.active ? 'Dando de baja...' : 'Habilitando...'}
                            </>
                          ) : (
                            user.active ? 'Dar de baja' : 'Habilitar'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden lg:block overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead className="bg-zinc-100 dark:bg-zinc-950">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Correo</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Provider</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Estado</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">{user.role}</td>
                          <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{user.provider}</td>
                          <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                              {user.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-zinc-900 dark:text-zinc-100">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEditing(user)}
                                className="inline-flex min-w-[120px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleUserActive(user.id, user.active ? false : true)}
                                disabled={savingId === user.id}
                                className={`inline-flex min-w-[120px] items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 transition-colors gap-2 ${
                                  user.active ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}
                              >
                                {savingId === user.id ? (
                                  <>
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {user.active ? 'Dando de baja...' : 'Habilitando...'}
                                  </>
                                ) : (
                                  user.active ? 'Dar de baja' : 'Habilitar'
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
