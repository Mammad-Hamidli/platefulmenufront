'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import {
  getKitchenPinInfo,
  generateKitchenPin,
  setKitchenPin,
  type KitchenPinInfo,
} from '@/lib/api/kitchen';

export default function AdminKitchenPage() {
  const { user } = useAuth();
  const api = useApi();
  const branchId = user?.branchId ?? null;

  const [pinInfo, setPinInfo] = useState<KitchenPinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [customPin, setCustomPin] = useState('');
  const [showCustomPinForm, setShowCustomPinForm] = useState(false);
  const [currentPin, setCurrentPin] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Load stored PIN from localStorage on mount
  useEffect(() => {
    if (!branchId) return;
    
    const storedPinKey = `kitchenPin_branch_${branchId}`;
    const storedPin = localStorage.getItem(storedPinKey);
    if (storedPin) {
      setCurrentPin(storedPin);
    }
  }, [branchId]);

  useEffect(() => {
    if (!branchId) {
      setError('Your account is missing branch assignment.');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const info = await getKitchenPinInfo(api, branchId);
        setPinInfo(info);
      } catch (err: any) {
        console.error('[AdminKitchen] Load PIN info error:', err);
        const errorMessage =
          err?.response?.data?.message || 'Failed to load kitchen PIN information.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [branchId, api]);


  const handleGeneratePin = async () => {
    if (!branchId) return;

    if (!confirm('Generate a new random PIN? The current PIN will be replaced.')) {
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);

      const result = await generateKitchenPin(api, branchId);
      const newPin = result.pin || null;
      
      if (newPin) {
        setCurrentPin(newPin);
        // Store in localStorage so it persists across sessions
        const storedPinKey = `kitchenPin_branch_${branchId}`;
        localStorage.setItem(storedPinKey, newPin);
      }
      
      setPinInfo(result);
      setSuccess('New PIN generated successfully!');
    } catch (err: any) {
      console.error('[AdminKitchen] Generate PIN error:', err);
      const errorMessage =
        err?.response?.data?.message || 'Failed to generate PIN. Please try again.';
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleSetCustomPin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!branchId) return;

    if (customPin.length !== 6 || !/^\d{6}$/.test(customPin)) {
      setError('PIN must be exactly 6 digits.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const result = await setKitchenPin(api, branchId, customPin);
      setPinInfo(result);
      
      // Store the PIN we just set
      setCurrentPin(customPin);
      const storedPinKey = `kitchenPin_branch_${branchId}`;
      localStorage.setItem(storedPinKey, customPin);
      
      setCustomPin('');
      setShowCustomPinForm(false);
      setSuccess('PIN updated successfully!');
    } catch (err: any) {
      console.error('[AdminKitchen] Set PIN error:', err);
      const errorMessage =
        err?.response?.data?.message || 'Failed to set PIN. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (!branchId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-red-700">
          Your account is missing branch assignment. Please contact your administrator.
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Kitchen Settings</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage the 6-digit PIN for kitchen device authentication (Branch #{branchId})
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess(null)}
                  className="ml-4 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-4 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current PIN Info */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Current PIN Status</h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="h-6 w-6 animate-spin text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="ml-2 text-sm text-slate-600">Loading PIN information...</span>
            </div>
          ) : pinInfo ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Status:</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    pinInfo.isSet
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {pinInfo.isSet ? 'PIN Set' : 'No PIN Set'}
                </span>
              </div>

              <div className="rounded-lg border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 p-8 shadow-lg">
                <div className="text-center">
                  <p className="mb-4 text-base font-semibold text-blue-900">Current Kitchen PIN</p>
                  {currentPin ? (
                    <span className="inline-block font-mono text-6xl font-bold text-blue-600 tracking-wider">
                      {currentPin}
                    </span>
                  ) : (
                    <div>
                      <span className="font-mono text-4xl font-bold text-slate-400">
                        {pinInfo.maskedPin || '••••••'}
                      </span>
                      <p className="mt-3 text-sm text-slate-500">
                        PIN not stored locally. Generate or set a new PIN to view it here permanently.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {pinInfo.lastUpdatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Last Updated:</span>
                  <span className="text-sm text-slate-600">{formatDate(pinInfo.lastUpdatedAt)}</span>
                </div>
              )}

            </div>
          ) : (
            <p className="text-sm text-slate-600">Failed to load PIN information.</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Generate Random PIN */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Generate Random PIN</h2>
            <p className="mb-4 text-sm text-slate-600">
              Generate a secure 6-digit random PIN. The full PIN will be shown once for you to save.
            </p>
            <button
              onClick={handleGeneratePin}
              disabled={loading || generating}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <span className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Random PIN'
              )}
            </button>
          </div>

          {/* Set Custom PIN */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Set Custom PIN</h2>
            <p className="mb-4 text-sm text-slate-600">
              Set a custom 6-digit PIN of your choice.
            </p>

            {!showCustomPinForm ? (
              <button
                onClick={() => {
                  setShowCustomPinForm(true);
                  setError(null);
                  setCustomPin('');
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Set Custom PIN
              </button>
            ) : (
              <form onSubmit={handleSetCustomPin} className="space-y-4">
                <div>
                  <label
                    htmlFor="customPin"
                    className="block text-sm font-medium text-slate-700"
                  >
                    6-Digit PIN
                  </label>
                  <input
                    id="customPin"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={customPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCustomPin(value);
                      setError(null);
                    }}
                    placeholder="000000"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 font-mono text-lg tracking-widest focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Enter exactly 6 numeric digits (0-9)
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting || customPin.length !== 6}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save PIN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomPinForm(false);
                      setCustomPin('');
                      setError(null);
                    }}
                    disabled={submitting}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

