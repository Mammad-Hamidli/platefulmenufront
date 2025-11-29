'use client';

// Disable SSR completely - this route must be client-only
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const preferredRegion = 'auto';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/env';
import { setKdsToken } from '@/lib/kds-token';
import { hasValidKdsToken } from '@/lib/kds-token';

if (typeof window === 'undefined') {
  console.log('[KDS] ❌ SERVER RENDER BLOCKED');
}

export default function KitchenPinPage() {
  if (typeof window === 'undefined') return null;

  console.log('[Kitchen] Client-side render OK');
  console.log('[Kitchen] Window check passed');

  const params = useParams();
  const router = useRouter();
  const branchId = Number(params.branchId);

  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submittingRef = useRef(false);
  const expiresAtRef = useRef<string | null>(null);

  // Check if already authenticated with KDS token
  useEffect(() => {
    if (isNaN(branchId)) {
      setError('Invalid branch ID');
      return;
    }

    // Check if we already have a valid KDS token
    if (hasValidKdsToken(branchId)) {
      console.log('[KDS] Already authenticated, redirecting to orders');
      router.replace(`/kitchen/${branchId}/orders`);
    }
  }, [branchId, router]);

  const handleNumberClick = useCallback((num: string) => {
    if (verified) return;
    
    setError(null);
    const currentPinString = pin.join('');
    
    if (currentPinString.length < 6) {
      const newPin = [...pin];
      const nextEmptyIndex = newPin.findIndex((digit) => digit === '');
      if (nextEmptyIndex !== -1) {
        newPin[nextEmptyIndex] = num;
        setPin(newPin);
        
        // Move focus to next input if available
        if (nextEmptyIndex < 5) {
          setFocusedIndex(nextEmptyIndex + 1);
        }
      }
    }
  }, [pin, verified]);

  const handleBackspace = useCallback(() => {
    if (verified) return;
    
    setError(null);
    const newPin = [...pin];
    
    // Find last filled position
    let lastFilledIndex = -1;
    for (let i = newPin.length - 1; i >= 0; i--) {
      if (newPin[i] !== '') {
        lastFilledIndex = i;
        break;
      }
    }
    
    if (lastFilledIndex !== -1) {
      newPin[lastFilledIndex] = '';
      setPin(newPin);
      setFocusedIndex(lastFilledIndex);
    }
  }, [pin, verified]);

  const handleInputChange = useCallback((index: number, value: string) => {
    if (verified) return;
    
    setError(null);
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    // Only allow digits
    if (value !== '' && !/^\d$/.test(value)) {
      return;
    }
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    // Auto-focus next input if digit entered
    if (value && index < 5) {
      setFocusedIndex(index + 1);
    }
  }, [pin, verified]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (verified) return;
    
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      // Move to previous input on backspace if current is empty
      setFocusedIndex(index - 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setFocusedIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < 5) {
      setFocusedIndex(index + 1);
    }
  }, [pin, verified]);

  // Focus management
  useEffect(() => {
    if (inputRefs.current[focusedIndex] && !verified) {
      inputRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, verified]);

  const verifyPin = useCallback(async (pinString: string) => {
    if (pinString.length !== 6 || !/^\d{6}$/.test(pinString)) {
      return;
    }

    if (isNaN(branchId)) {
      setError('Invalid branch ID');
      return;
    }

    if (submittingRef.current || loading) {
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('[KDS] Verifying PIN for branch:', branchId);

      const response = await fetch(`${API_BASE_URL}/branches/${branchId}/kitchen/pin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: pinString }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[KDS] PIN verification failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });

        if (response.status === 401) {
          setError('Invalid PIN. Please try again.');
          setPin(['', '', '', '', '', '']);
          setFocusedIndex(0);
        } else if (response.status === 400) {
          setError('Invalid PIN format. PIN must be 6 digits.');
          setPin(['', '', '', '', '', '']);
          setFocusedIndex(0);
        } else if (response.status === 404) {
          setError('Branch not found.');
        } else {
          setError('Failed to verify PIN. Please try again.');
        }
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      const data = await response.json();
      console.log('[KDS] PIN verified successfully:', {
        branchId: data.branchId,
        tokenPreview: data.kdsToken ? `${data.kdsToken.substring(0, 10)}...` : 'null',
        expiresAt: data.expiresAt,
      });

      if (data.kdsToken && data.expiresAt) {
        setStoredToken(data.kdsToken);
        expiresAtRef.current = data.expiresAt;
        setVerified(true);
        setLoading(false);
        submittingRef.current = false;
      } else {
        setError('Invalid response from server. Please try again.');
        setLoading(false);
        submittingRef.current = false;
      }
    } catch (err) {
      console.error('[KDS] PIN verification error:', err);
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
      submittingRef.current = false;
    }
  }, [branchId, loading]);

  // Auto-verify when PIN is complete
  useEffect(() => {
    const pinString = pin.join('');
    if (pinString.length === 6 && /^\d{6}$/.test(pinString) && !submittingRef.current && !loading && !verified) {
      void verifyPin(pinString);
    }
  }, [pin, loading, verified, verifyPin]);

  const handleContinue = useCallback(() => {
    if (!storedToken || !expiresAtRef.current) return;

    setKdsToken(branchId, storedToken, expiresAtRef.current);
    console.log('[KDS] Token stored in localStorage:', `kdsToken_branch_${branchId}`);
    
    router.replace(`/kitchen/${branchId}/orders`);
  }, [storedToken, branchId, router]);

  if (isNaN(branchId)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Invalid Branch ID</h1>
        </div>
      </main>
    );
  }

  const pinString = pin.join('');

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-extrabold text-gray-900 tracking-tight">
            Kitchen Display System
          </h1>
          <div className="mx-auto h-1 w-24 rounded-full bg-blue-600"></div>
        </div>

        {/* Instruction */}
        <p className="mb-4 text-center text-lg text-gray-700">
          Enter 6-digit PIN to access kitchen dashboard.
        </p>

        {/* Branch Number */}
        <p className="mb-10 text-center text-base font-medium text-gray-600">
          Branch # <span className="font-semibold text-gray-900">{branchId}</span>
        </p>

        {/* PIN Input Fields */}
        <div className="mb-8 flex justify-center gap-4">
          {pin.map((digit, index) => (
            <div key={index} className="relative">
              <input
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={() => setFocusedIndex(index)}
                disabled={loading || verified}
                className={`h-16 w-16 rounded-xl border-3 text-center text-3xl font-bold text-gray-900 shadow-lg transition-all duration-200 ${
                  verified
                    ? 'border-green-500 bg-green-50'
                    : digit
                    ? 'border-blue-400 bg-blue-50 shadow-blue-200'
                    : 'border-gray-300 bg-white'
                } ${
                  focusedIndex === index && !verified
                    ? 'border-blue-600 ring-4 ring-blue-200 scale-105'
                    : ''
                } focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-70 disabled:cursor-not-allowed`}
              />
              {verified && digit && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Success Message */}
        {verified && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="rounded-xl bg-green-50 border-2 border-green-500 p-4 text-center">
              <p className="text-lg font-semibold text-green-800">
                ✓ PIN Verified Successfully!
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !verified && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 text-center">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
              <svg className="h-5 w-5 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium text-blue-700">Verifying PIN...</span>
            </div>
          </div>
        )}

        {/* Continue Button */}
        {verified && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <button
              onClick={handleContinue}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105 active:scale-100"
            >
              Continue to Orders
            </button>
          </div>
        )}

        {/* Numeric Keypad */}
        {!verified && (
          <>
            <div className="mb-4 grid grid-cols-3 gap-3">
              {/* Numbers 1-9 */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberClick(num.toString())}
                  disabled={loading || pinString.length >= 6}
                  className="h-16 rounded-xl border-2 border-gray-300 bg-white text-2xl font-bold text-gray-900 shadow-md transition-all duration-150 hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:shadow-md"
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Bottom Row: 0 and Backspace */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleNumberClick('0')}
                disabled={loading || pinString.length >= 6}
                className="h-16 rounded-xl border-2 border-gray-300 bg-white text-2xl font-bold text-gray-900 shadow-md transition-all duration-150 hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:shadow-md"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={loading || pinString.length === 0}
                className="h-16 rounded-xl border-2 border-gray-300 bg-white text-xl font-bold text-gray-900 shadow-md transition-all duration-150 hover:bg-red-50 hover:border-red-300 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:shadow-md"
              >
                ⌫
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
