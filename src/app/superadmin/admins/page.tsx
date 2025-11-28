'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import {
  assignAdminToBranch,
  createAdmin,
  deleteAdmin,
  listAdminsForRestaurant,
  listBranches,
  resetAdminPassword,
  updateAdmin,
  updateBranch,
} from '@/lib/api/superadmin';
import type { Branch, UserRecord } from '@/types/entities';

interface AdminCreateForm {
  email: string;
  password: string;
  branchId: string;
}

interface AdminEditForm {
  password: string;
}

interface AdminState {
  admins: UserRecord[];
  branches: Branch[];
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: AdminState = {
  admins: [],
  branches: [],
  loading: true,
  error: null,
};

const INITIAL_CREATE_FORM: AdminCreateForm = {
  email: '',
  password: '',
  branchId: '',
};

const INITIAL_EDIT_FORM: AdminEditForm = {
  password: '',
};

export default function SuperadminAdminsPage() {
  const { user } = useAuth();
  const api = useApi();
  const [state, setState] = useState<AdminState>(INITIAL_STATE);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<AdminCreateForm>(INITIAL_CREATE_FORM);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editingAdminEmail, setEditingAdminEmail] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AdminEditForm>(INITIAL_EDIT_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [assigningAdmin, setAssigningAdmin] = useState<UserRecord | null>(null);
  const [assignBranchId, setAssignBranchId] = useState<string>('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const restaurantId = user?.restaurantId ?? null;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!restaurantId) {
        setState({ admins: [], branches: [], loading: false, error: 'Restaurant assignment missing in JWT.' });
        return;
      }
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [admins, branches] = await Promise.all([
          listAdminsForRestaurant(api, restaurantId),
          listBranches(api, restaurantId),
        ]);
        if (cancelled) return;
        setState({ admins, branches, loading: false, error: null });
      } catch (error) {
        console.error('[SuperadminAdmins] load error', error);
        if (cancelled) return;
        setState({ admins: [], branches: [], loading: false, error: 'Failed to load admins.' });
      }
    };

    if (user?.role === 'ROLE_SUPERADMIN') {
      void load();
    } else {
      setState(INITIAL_STATE);
    }

    return () => {
      cancelled = true;
    };
  }, [api, restaurantId, user]);

  const branchOptions = useMemo(() => {
    const map = new Map<number, Branch>();
    state.branches.forEach((branch) => map.set(branch.id, branch));
    return map;
  }, [state.branches]);

  const resetCreateForm = () => setCreateForm(INITIAL_CREATE_FORM);
  const resetEditForm = () => {
    setEditingAdminEmail(null);
    setEditForm(INITIAL_EDIT_FORM);
  };
  const resetAssignForm = () => {
    setAssigningAdmin(null);
    setAssignBranchId('');
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!restaurantId) return;
    setCreateSubmitting(true);
    setState((prev) => ({ ...prev, error: null }));
    try {
      const email = createForm.email.trim().toLowerCase();
      const password = createForm.password.trim();
      if (!email || !password) {
        throw new Error('Email and password are required.');
      }
      const branchId = createForm.branchId ? Number(createForm.branchId) : undefined;
      const admin = await createAdmin(api, restaurantId, {
        email,
        password,
        branchId,
      });
      setState((prev) => ({
        ...prev,
        admins: [admin, ...prev.admins],
      }));
      resetCreateForm();
      setShowCreate(false);
    } catch (error) {
      console.error('[SuperadminAdmins] create error', error);
      setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to create admin.' }));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEditModal = (admin: UserRecord) => {
    setEditingAdminEmail(admin.email);
    setEditForm(INITIAL_EDIT_FORM);
  };

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAdminEmail) return;
    setEditSubmitting(true);
    setState((prev) => ({ ...prev, error: null }));
    try {
      const newPassword = editForm.password.trim();
      if (!newPassword) {
        throw new Error('Enter a new password to update this admin.');
      }
      const admin = state.admins.find((a) => a.email === editingAdminEmail);
      if (!admin) {
        throw new Error('Admin not found.');
      }
      await resetAdminPassword(api, admin.id, newPassword);
      setState((prev) => ({
        ...prev,
        admins: prev.admins.map((a) =>
          a.email === editingAdminEmail ? { ...a } : a
        ),
      }));
      resetEditForm();
    } catch (error) {
      console.error('[SuperadminAdmins] password reset error', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to reset admin password.',
      }));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm('Delete this admin? They will lose access immediately.')) {
      return;
    }
    setState((prev) => ({ ...prev, error: null }));
    try {
      await deleteAdmin(api, email);
      setState((prev) => ({
        ...prev,
        admins: prev.admins.filter((admin) => admin.email !== email),
      }));
      if (editingAdminEmail === email) {
        resetEditForm();
      }
      if (assigningAdmin?.email === email) {
        resetAssignForm();
      }
    } catch (error) {
      console.error('[SuperadminAdmins] delete error', error);
      setState((prev) => ({ ...prev, error: 'Failed to delete admin.' }));
    }
  };

  const openAssignModal = (admin: UserRecord) => {
    setAssigningAdmin(admin);
    setAssignBranchId(admin.branchId ? String(admin.branchId) : '');
  };

  const handleAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assigningAdmin) return;
    
    // Handle unassign case
    if (assignBranchId === 'unassign') {
      setAssignSubmitting(true);
      setState((prev) => ({ ...prev, error: null }));
      try {
        console.log('[SuperadminAdmins] Attempting to unassign admin:', {
          email: assigningAdmin.email,
          currentBranchId: assigningAdmin.branchId,
        });
        
        // If admin is assigned to a branch, also update the branch to remove adminUserId
        if (assigningAdmin.branchId) {
          const branch = branchOptions.get(assigningAdmin.branchId);
          if (branch) {
            console.log('[SuperadminAdmins] Also updating branch to remove adminUserId:', branch.id);
            try {
              await updateBranch(api, branch.id, { adminUserId: null });
              console.log('[SuperadminAdmins] Branch updated successfully');
            } catch (branchError: any) {
              console.warn('[SuperadminAdmins] Failed to update branch, continuing with user update:', branchError);
            }
          }
        }
        
        // Update the admin's branchId to null
        // Try superadmin endpoint first
        try {
          const { data } = await api.put<UserRecord>(`/superadmin/users/${encodeURIComponent(assigningAdmin.email.toLowerCase())}`, {
            branchId: null,
          });
          console.log('[SuperadminAdmins] Unassign response (superadmin endpoint):', data);
          
          setState((prev) => ({
            ...prev,
            admins: prev.admins.map((admin) =>
              admin.email === assigningAdmin.email ? { ...admin, branchId: null } : admin
            ),
          }));
          resetAssignForm();
          return;
        } catch (superadminError: any) {
          console.warn('[SuperadminAdmins] Superadmin endpoint failed, trying general endpoint:', {
            message: superadminError?.message,
            response: superadminError?.response?.data,
            status: superadminError?.response?.status,
          });
          
          // Fallback: try omitting branchId entirely (some backends require omitting optional fields to clear them)
          try {
            await updateAdmin(api, assigningAdmin.email, { branchId: null });
            console.log('[SuperadminAdmins] Unassign successful via general endpoint');
          } catch (generalError: any) {
            console.error('[SuperadminAdmins] General endpoint also failed:', {
              message: generalError?.message,
              response: generalError?.response?.data,
              status: generalError?.response?.status,
            });
            throw generalError; // Re-throw to be caught by outer catch
          }
          
          setState((prev) => ({
            ...prev,
            admins: prev.admins.map((admin) =>
              admin.email === assigningAdmin.email ? { ...admin, branchId: null } : admin
            ),
          }));
          resetAssignForm();
        }
        
      } catch (error: any) {
        console.error('[SuperadminAdmins] unassign error', error);
        console.error('[SuperadminAdmins] Full error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
        });
        
        // Extract detailed error message
        let errorMessage = 'Failed to unassign branch.';
        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        // Add backend status code if available
        if (error?.response?.status) {
          errorMessage += ` (Status: ${error.response.status})`;
        }
        
        setState((prev) => ({ ...prev, error: errorMessage }));
      } finally {
        setAssignSubmitting(false);
      }
      return;
    }
    
    // Handle assign case
    if (!assignBranchId) return;
    setAssignSubmitting(true);
    setState((prev) => ({ ...prev, error: null }));
    try {
      await assignAdminToBranch(api, Number(assignBranchId), assigningAdmin.id);
      const branchId = Number(assignBranchId);
      setState((prev) => ({
        ...prev,
        admins: prev.admins.map((admin) =>
          admin.email === assigningAdmin.email ? { ...admin, branchId } : admin
        ),
      }));
      resetAssignForm();
    } catch (error) {
      console.error('[SuperadminAdmins] assign error', error);
      setState((prev) => ({ ...prev, error: 'Failed to assign branch.' }));
    } finally {
      setAssignSubmitting(false);
    }
  };

  if (user?.role !== 'ROLE_SUPERADMIN') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900">
        Access restricted to SuperAdmin role.
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
        Your JWT is missing the required restaurant identifier. Please contact support.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admins</h1>
          <p className="text-sm text-slate-500">
            Manage administrator accounts assigned to each branch of your restaurant.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          onClick={() => {
            resetCreateForm();
            setShowCreate(true);
          }}
        >
          + Create admin
        </button>
      </header>

      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {state.loading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Loading admins…
        </div>
      ) : state.admins.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
          No admins found. Create the first branch admin to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {state.admins.map((admin) => {
            const branch = admin.branchId ? branchOptions.get(admin.branchId) : null;
            return (
              <article
                key={admin.email}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{admin.email}</h2>
                    <div className="mt-1 text-xs text-slate-500">Admin ID: {admin.id}</div>
                    <p className="mt-2 text-sm text-slate-600">
                      Assigned branch: <span className="font-medium text-slate-900">{branch ? branch.name : 'Unassigned'}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 text-xs font-medium text-slate-600 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => openAssignModal(admin)}
                      className="inline-flex items-center justify-center rounded-lg border border-emerald-200 px-3 py-1 text-emerald-600 transition hover:bg-emerald-50"
                    >
                      Assign branch
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(admin)}
                      className="inline-flex items-center justify-center rounded-lg border border-blue-200 px-3 py-1 text-blue-600 transition hover:bg-blue-50"
                    >
                      Reset password
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(admin.email)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-1 text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        title="Create admin"
        open={showCreate}
        onClose={() => {
          if (!createSubmitting) {
            setShowCreate(false);
            resetCreateForm();
          }
        }}
      >
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={createForm.email}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="admin@restaurant.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              required
              type="password"
              value={createForm.password}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Temporary password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="admin-branch">
              Assign branch (optional)
            </label>
            <select
              id="admin-branch"
              value={createForm.branchId}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, branchId: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {state.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => {
                resetCreateForm();
                setShowCreate(false);
              }}
              disabled={createSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createSubmitting ? 'Creating…' : 'Create admin'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title={editingAdminEmail ? `Reset password for ${editingAdminEmail}` : 'Reset password'}
        open={Boolean(editingAdminEmail)}
        onClose={() => {
          if (!editSubmitting) resetEditForm();
        }}
      >
        <form className="space-y-4" onSubmit={handleEdit}>
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="edit-password">
              New password
            </label>
            <input
              id="edit-password"
              type="password"
              required
              value={editForm.password}
              onChange={(event) => setEditForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => {
                if (!editSubmitting) resetEditForm();
              }}
              disabled={editSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title={
          assigningAdmin
            ? assignBranchId === 'unassign'
              ? `Unassign branch from ${assigningAdmin.email}`
              : `Assign branch to ${assigningAdmin.email}`
            : 'Assign branch'
        }
        open={Boolean(assigningAdmin)}
        onClose={() => {
          if (!assignSubmitting) resetAssignForm();
        }}
      >
        <form className="space-y-4" onSubmit={handleAssign}>
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="assign-branch">
              Select branch
            </label>
            <select
              id="assign-branch"
              required
              value={assignBranchId}
              onChange={(event) => setAssignBranchId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              disabled={assignSubmitting}
            >
              <option value="" disabled>
                Choose branch
              </option>
              <option value="unassign">
                Unassign
              </option>
              {state.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => {
                if (!assignSubmitting) resetAssignForm();
              }}
              disabled={assignSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignSubmitting || !assignBranchId}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {assignSubmitting
                ? assignBranchId === 'unassign'
                  ? 'Unassigning…'
                  : 'Assigning…'
                : assignBranchId === 'unassign'
                ? 'Unassign'
                : 'Assign branch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

