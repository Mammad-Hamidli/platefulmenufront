'use client';

import { FormEvent, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { createStaff, listStaff, updateStaff, getBranch } from '@/lib/api/admin';
import type { Branch, UserRecord } from '@/types/entities';

type StaffType = 'Waiter' | 'Cleaner';
type SalaryCycle = 'Daily' | 'Weekly' | 'Monthly';

interface StaffForm {
  email: string;
  staffType: StaffType;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  salary: string;
  salaryCycle: SalaryCycle;
}

interface StaffEditForm {
  staffType: StaffType;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  salary: string;
  salaryCycle: SalaryCycle;
}

const INITIAL_FORM: StaffForm = {
  email: '',
  staffType: 'Waiter',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  salary: '',
  salaryCycle: 'Monthly',
};

const INITIAL_EDIT_FORM: StaffEditForm = {
  staffType: 'Waiter',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  salary: '',
  salaryCycle: 'Monthly',
};

const STAFF_TYPE_OPTIONS: { label: string; value: StaffType }[] = [
  { label: 'Waiter', value: 'Waiter' },
  { label: 'Cleaner', value: 'Cleaner' },
];

const SALARY_CYCLE_OPTIONS: { label: string; value: SalaryCycle }[] = [
  { label: 'Daily', value: 'Daily' },
  { label: 'Weekly', value: 'Weekly' },
  { label: 'Monthly', value: 'Monthly' },
];

const STAFF_ROLES = new Set(['ROLE_WAITER', 'ROLE_KITCHEN']);

export default function AdminStaffPage() {
  const { user } = useAuth();
  const api = useApi();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState<StaffForm>(INITIAL_FORM);
  const [editForm, setEditForm] = useState<StaffEditForm>(INITIAL_EDIT_FORM);
  const [editingStaffEmail, setEditingStaffEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loadingBranch, setLoadingBranch] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [staff, setStaff] = useState<UserRecord[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const restaurantId = user?.restaurantId ?? null;
  const branchId = user?.branchId ?? null;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Load branch info
  useEffect(() => {
    if (!branchId) return;
    setLoadingBranch(true);
    getBranch(api, branchId)
      .then((data) => {
        setBranch(data);
      })
      .catch((err) => {
        console.error('[AdminStaff] Failed to load branch', err);
      })
      .finally(() => {
        setLoadingBranch(false);
      });
  }, [api, branchId]);

  // Load staff list when page loads
  useEffect(() => {
    if (!branchId) return;
    
    const loadStaff = async () => {
      setLoadingStaff(true);
      try {
        const data = await listStaff(api, branchId);
        // Filter to show only staff roles (WAITER, KITCHEN)
        const staffMembers = data.filter((user) => STAFF_ROLES.has(user.role));
        setStaff(staffMembers);
      } catch (err) {
        console.error('[AdminStaff] Failed to load staff', err);
      } finally {
        setLoadingStaff(false);
      }
    };

    loadStaff();
  }, [api, branchId]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setError(null);
  };

  const resetEditForm = () => {
    setEditForm(INITIAL_EDIT_FORM);
    setEditError(null);
    setEditingStaffEmail(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setShowModal(false);
      resetForm();
    }
  };

  const handleOpenEditModal = (member: UserRecord) => {
    // Parse name from fullName or use firstName/lastName
    let firstName = '';
    let lastName = '';
    if (member.firstName && member.lastName) {
      firstName = member.firstName;
      lastName = member.lastName;
    } else if (member.fullName) {
      const nameParts = member.fullName.trim().split(/\s+/);
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Determine staff type from role
    const staffType: StaffType = member.role === 'ROLE_WAITER' ? 'Waiter' : 'Cleaner';
    
    // Get salary cycle from member data
    const salaryCycle: SalaryCycle = member.salaryPeriod 
      ? (member.salaryPeriod.charAt(0) + member.salaryPeriod.slice(1).toLowerCase()) as SalaryCycle
      : 'Monthly';

    setEditForm({
      staffType,
      firstName,
      lastName,
      phoneNumber: member.phoneNumber || member.phone || '',
      salary: member.salaryAmount != null ? String(member.salaryAmount) : '',
      salaryCycle,
    });
    setEditingStaffEmail(member.email);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    if (!editSubmitting) {
      setShowEditModal(false);
      resetEditForm();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!restaurantId || !branchId) {
      setError('Restaurant ID and Branch ID are required.');
      return;
    }

    setSubmitting(true);

    try {
      // Map staff type to backend role
      const role = form.staffType === 'Waiter' ? 'ROLE_WAITER' : 'ROLE_KITCHEN';
      
      // Convert salary cycle to uppercase
      const salaryPeriod = form.salaryCycle.toUpperCase() as 'DAILY' | 'WEEKLY' | 'MONTHLY';
      
      // Convert salary to number
      const salaryAmount = Number(parseFloat(form.salary).toFixed(2));
      if (isNaN(salaryAmount) || salaryAmount <= 0) {
        throw new Error('Salary must be a positive number.');
      }

      // Validate email
      const email = form.email.trim().toLowerCase();
      if (!email) {
        throw new Error('Email is required.');
      }

      // Validate phone number
      const phoneNumber = form.phoneNumber.trim();
      if (!phoneNumber) {
        throw new Error('Phone number is required.');
      }

      const payload = {
        email,
        role,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber,
        salaryAmount,
        salaryPeriod,
      };

      await createStaff(api, restaurantId, branchId, payload);

      // Refresh staff list after successful creation
      try {
        const data = await listStaff(api, branchId);
        const staffMembers = data.filter((user) => STAFF_ROLES.has(user.role));
        setStaff(staffMembers);
      } catch (err) {
        console.error('[AdminStaff] Failed to refresh staff list', err);
      }

      setSubmitting(false);
      setShowModal(false);
      resetForm();
      showToast('Staff member created successfully!', 'success');
    } catch (err: any) {
      console.error('[AdminStaff] create error', err);
      
      // Extract error message from axios response
      let errorMessage = 'Failed to create staff member.';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditError(null);

    if (!editingStaffEmail) {
      setEditError('No staff member selected for editing.');
      return;
    }

    setEditSubmitting(true);

    try {
      // Map staff type to backend role
      const role = editForm.staffType === 'Waiter' ? 'ROLE_WAITER' : 'ROLE_KITCHEN';
      
      // Convert salary cycle to uppercase
      const salaryPeriod = editForm.salaryCycle.toUpperCase() as 'DAILY' | 'WEEKLY' | 'MONTHLY';
      
      // Convert salary to number
      const salaryAmount = Number(parseFloat(editForm.salary).toFixed(2));
      if (isNaN(salaryAmount) || salaryAmount <= 0) {
        throw new Error('Salary must be a positive number.');
      }

      // Validate phone number
      const phoneNumber = editForm.phoneNumber.trim();
      if (!phoneNumber) {
        throw new Error('Phone number is required.');
      }

      const payload = {
        role,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phoneNumber,
        salaryAmount,
        salaryPeriod,
      };

      await updateStaff(api, editingStaffEmail, payload);

      // Refresh staff list after successful update
      try {
        const data = await listStaff(api, branchId!);
        const staffMembers = data.filter((user) => STAFF_ROLES.has(user.role));
        setStaff(staffMembers);
      } catch (err) {
        console.error('[AdminStaff] Failed to refresh staff list', err);
      }

      setEditSubmitting(false);
      setShowEditModal(false);
      resetEditForm();
      showToast('Staff member updated successfully!', 'success');
    } catch (err: any) {
      console.error('[AdminStaff] update error', err);
      
      // Extract error message from axios response
      let errorMessage = 'Failed to update staff member.';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setEditError(errorMessage);
      showToast(errorMessage, 'error');
      setEditSubmitting(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Staff directory</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage staff members for {branch ? branch.name : 'your branch'}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Add staff
          </button>
        </header>

        {/* Staff Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          {loadingStaff ? (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              Loading staff members...
            </div>
          ) : staff.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              No staff members found. Click "Add staff" to add your first staff member.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">EMAIL</th>
                  <th className="px-6 py-3">FIRST NAME</th>
                  <th className="px-6 py-3">LAST NAME</th>
                  <th className="px-6 py-3">ROLE</th>
                  <th className="px-6 py-3">PHONE</th>
                  <th className="px-6 py-3">SALARY</th>
                  <th className="px-6 py-3">SALARY CYCLE</th>
                  <th className="px-6 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {staff.map((member) => {
                  // Get name from firstName/lastName or fullName
                  let firstName: string | null = null;
                  let lastName: string | null = null;
                  
                  if (member.firstName && member.lastName) {
                    firstName = member.firstName;
                    lastName = member.lastName;
                  } else if (member.fullName) {
                    const nameParts = member.fullName.trim().split(/\s+/);
                    firstName = nameParts[0] || null;
                    lastName = nameParts.slice(1).join(' ') || null;
                  }
                  
                  const phone = member.phone || member.phoneNumber || null;
                  const salary = member.salaryAmount != null ? Number(member.salaryAmount).toFixed(2) : null;
                  const salaryCycle = member.salaryPeriod || null;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {member.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {firstName || '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {lastName || '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {member.role.replace('ROLE_', '').toUpperCase()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {phone || '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {salary ? `$${salary}` : '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {salaryCycle ? salaryCycle.charAt(0) + salaryCycle.slice(1).toLowerCase() : '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(member)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <Modal
          title="Add staff"
          open={showModal}
          onClose={handleCloseModal}
          error={error}
          onSubmit={handleSubmit}
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="staff-form"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Adding…' : 'Add staff'}
              </button>
            </div>
          }
        >
          <form id="staff-form" className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="email">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="staff@example.com"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="staff-type">
                Staff type
              </label>
              <select
                id="staff-type"
                required
                value={form.staffType}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, staffType: event.target.value as StaffType }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                {STAFF_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="first-name">
                First name
              </label>
              <input
                id="first-name"
                type="text"
                required
                value={form.firstName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, firstName: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter first name"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="last-name">
                Last name
              </label>
              <input
                id="last-name"
                type="text"
                required
                value={form.lastName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, lastName: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter last name"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="phone-number">
                Phone number
              </label>
              <input
                id="phone-number"
                type="tel"
                required
                value={form.phoneNumber}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1234567890"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="salary">
                Salary
              </label>
              <input
                id="salary"
                type="number"
                required
                min="0"
                step="0.01"
                value={form.salary}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, salary: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="salary-cycle">
                Salary cycle
              </label>
              <select
                id="salary-cycle"
                required
                value={form.salaryCycle}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, salaryCycle: event.target.value as SalaryCycle }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                {SALARY_CYCLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>

        <Modal
          title="Edit staff"
          open={showEditModal}
          onClose={handleCloseEditModal}
          error={editError}
          onSubmit={handleEditSubmit}
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                disabled={editSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-staff-form"
                disabled={editSubmitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editSubmitting ? 'Updating…' : 'Update staff'}
              </button>
            </div>
          }
        >
          <form id="edit-staff-form" className="space-y-4" onSubmit={handleEditSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="edit-staff-type">
                Staff type
              </label>
              <select
                id="edit-staff-type"
                required
                value={editForm.staffType}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, staffType: event.target.value as StaffType }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={editSubmitting}
              >
                {STAFF_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="edit-first-name">
                First name
              </label>
              <input
                id="edit-first-name"
                type="text"
                required
                value={editForm.firstName}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, firstName: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter first name"
                disabled={editSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="edit-last-name">
                Last name
              </label>
              <input
                id="edit-last-name"
                type="text"
                required
                value={editForm.lastName}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, lastName: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter last name"
                disabled={editSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="edit-phone-number">
                Phone number
              </label>
              <input
                id="edit-phone-number"
                type="tel"
                required
                value={editForm.phoneNumber}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1234567890"
                disabled={editSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="edit-salary">
                Salary
              </label>
              <input
                id="edit-salary"
                type="number"
                required
                min="0"
                step="0.01"
                value={editForm.salary}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, salary: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                disabled={editSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600" htmlFor="edit-salary-cycle">
                Salary cycle
              </label>
              <select
                id="edit-salary-cycle"
                required
                value={editForm.salaryCycle}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, salaryCycle: event.target.value as SalaryCycle }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={editSubmitting}
              >
                {SALARY_CYCLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  error?: string | null;
  footer?: React.ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}

function Modal({ title, open, onClose, children, error, footer, onSubmit }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-4">
      <div className="relative flex flex-col w-full max-w-lg max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Absolute positioned error alert at the very top - overlays content without affecting layout */}
        {error && (
          <div className="absolute top-0 left-0 right-0 z-[9999] rounded-t-2xl bg-red-50 border-b border-red-200 px-6 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        
        {/* Fixed Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4 flex-shrink-0">
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
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6" style={{ maxHeight: '70vh' }}>
          {children}
        </div>
        
        {/* Fixed Footer */}
        {footer && (
          <div className="flex-shrink-0 p-6 pt-4 border-t border-slate-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ToastProps {
  message: string;
  type: 'success' | 'error';
}

function Toast({ message, type }: ToastProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div
        className={`pointer-events-auto rounded-lg px-6 py-4 shadow-2xl transition-all duration-300 ${
          type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
}
