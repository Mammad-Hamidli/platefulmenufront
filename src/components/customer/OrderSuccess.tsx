'use client';

export function OrderSuccess() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-green-200 bg-green-50 p-8 text-center shadow-sm">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-green-900">Order Placed!</h1>
        <p className="mb-6 text-slate-600">
          Your order has been received and is being prepared. A server will bring it to your table shortly.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Order More
        </button>
      </div>
    </div>
  );
}

