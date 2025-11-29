# 📁 Project Structure

## Plateful Menu Frontend - Next.js Application

```
platefulmenufront/
│
├── 📄 Configuration Files
│   ├── package.json              # Dependencies and scripts
│   ├── package-lock.json         # Locked dependency versions
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tsconfig.node.json        # Node.js TypeScript config
│   ├── next.config.js            # Next.js configuration
│   ├── tailwind.config.js         # Tailwind CSS configuration
│   ├── postcss.config.js         # PostCSS configuration
│   ├── middleware.ts             # Next.js middleware (auth, routing)
│   └── next-env.d.ts             # Next.js TypeScript declarations
│
├── 📚 Documentation
│   ├── README.md                              # Project readme
│   ├── HOW_TO_RUN.md                         # Setup and run instructions
│   ├── COMPLETE_API_ENDPOINTS_DOCUMENTATION.md  # Backend API reference
│   ├── CUSTOMER_FLOW_DOCUMENTATION.md         # Customer flow documentation
│   ├── BACKEND_STAFF_UPDATE_SPECIFICATION.md  # Staff update API spec
│   ├── DEBUG_500_ERROR.md                     # Error debugging guide
│   ├── STAFF_UPDATE_IMPLEMENTATION_STATUS.md   # Implementation status
│   └── LOGIN_DEBUGGING.md                     # Login debugging guide
│
├── 📦 Source Code (src/)
│   │
│   ├── 🎨 app/                          # Next.js App Router pages
│   │   ├── layout.tsx                   # Root layout
│   │   ├── page.tsx                     # Home page
│   │   ├── globals.css                  # Global styles
│   │   │
│   │   ├── (auth)/                      # Auth route group
│   │   │   └── login/
│   │   │       └── page.tsx             # Login page
│   │   │
│   │   ├── admin/                       # Admin section
│   │   │   ├── layout.tsx               # Admin layout (with ProtectedLayout)
│   │   │   ├── page.tsx                 # Admin redirect/landing
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx             # Admin dashboard
│   │   │   ├── staff/
│   │   │   │   └── page.tsx             # Admin staff management
│   │   │   ├── tables/
│   │   │   │   └── page.tsx             # Admin table management
│   │   │   └── menu/
│   │   │       └── page.tsx             # Admin menu management
│   │   │
│   │   ├── superadmin/                  # Superadmin section
│   │   │   ├── layout.tsx               # Superadmin layout
│   │   │   ├── page.tsx                 # Superadmin redirect/landing
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx             # Superadmin dashboard
│   │   │   ├── staff/
│   │   │   │   └── page.tsx             # Superadmin staff management
│   │   │   ├── admins/
│   │   │   │   └── page.tsx             # Admin user management
│   │   │   └── branches/
│   │   │       └── page.tsx             # Branch management
│   │   │
│   │   ├── dashboard/                  # Legacy dashboard routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── admin/
│   │   │   │   └── page.tsx
│   │   │   └── superadmin/
│   │   │       └── page.tsx
│   │   │
│   │   ├── table/                      # Customer-facing table pages
│   │   │   └── [tableId]/
│   │   │       └── page.tsx             # Dynamic table menu page
│   │   │
│   │   └── api/                        # API routes (Next.js API handlers)
│   │       └── auth/
│   │           ├── login/
│   │           │   └── route.ts         # Login API endpoint
│   │           ├── logout/
│   │           │   └── route.ts        # Logout API endpoint
│   │           └── session/
│   │               └── route.ts        # Session check endpoint
│   │
│   ├── 🧩 components/                  # React components
│   │   ├── dashboard/
│   │   │   ├── ProtectedLayout.tsx     # Protected route wrapper
│   │   │   └── Sidebar.tsx             # Dashboard sidebar navigation
│   │   │
│   │   └── customer/                   # Customer-facing components
│   │       ├── CustomerMenu.tsx        # Menu display component
│   │       ├── Cart.tsx                # Shopping cart component
│   │       └── OrderSuccess.tsx        # Order confirmation component
│   │
│   ├── 🎣 hooks/                       # Custom React hooks
│   │   ├── useAuth.ts                  # Authentication hook
│   │   └── useApi.ts                   # API client hook
│   │
│   ├── 📚 lib/                         # Utility libraries
│   │   ├── api.ts                      # Base API client setup
│   │   ├── auth.ts                     # Authentication utilities
│   │   ├── token.ts                    # JWT token handling
│   │   ├── roles.ts                    # Role management
│   │   ├── env.ts                      # Environment variables
│   │   │
│   │   └── api/                        # API endpoint functions
│   │       ├── admin.ts                # Admin API calls
│   │       ├── superadmin.ts           # Superadmin API calls
│   │       └── customer.ts             # Customer API calls
│   │
│   ├── 🔄 providers/                   # React context providers
│   │   └── AuthProvider.tsx            # Authentication context provider
│   │
│   └── 📝 types/                       # TypeScript type definitions
│       ├── auth.ts                     # Authentication types
│       └── entities.ts                 # Entity types (User, Branch, etc.)
│
├── 🏗️ Build Output
│   ├── .next/                          # Next.js build output (gitignored)
│   └── dist/                           # Production build (if configured)
│
└── 📦 Dependencies
    └── node_modules/                   # npm packages (gitignored)

```

## 📋 Key Directories Explained

### `/src/app/` - Next.js App Router
- Uses Next.js 13+ App Router with file-based routing
- Each folder represents a route
- `layout.tsx` files provide shared layouts
- `page.tsx` files are the actual pages

### `/src/components/` - Reusable Components
- **dashboard/**: Admin/superadmin dashboard components
- **customer/**: Customer-facing UI components

### `/src/lib/` - Core Libraries
- **api/**: API client functions organized by feature
- Base utilities for auth, tokens, roles, etc.

### `/src/hooks/` - Custom Hooks
- React hooks for shared logic (auth, API calls)

### `/src/types/` - TypeScript Definitions
- Type definitions for entities and authentication

## 🔐 Authentication Flow

1. **Login**: `/app/(auth)/login/page.tsx`
2. **Token Storage**: `lib/token.ts`
3. **Auth Context**: `providers/AuthProvider.tsx`
4. **Protected Routes**: `components/dashboard/ProtectedLayout.tsx`
5. **Middleware**: `middleware.ts` (route protection)

## 🎯 Role-Based Routes

- **Admin**: `/admin/*` - Branch-level management
- **Superadmin**: `/superadmin/*` - Restaurant-level management
- **Customer**: `/table/[tableId]` - Public menu access

## 📡 API Integration

- **Base Client**: `lib/api.ts`
- **Admin APIs**: `lib/api/admin.ts`
- **Superadmin APIs**: `lib/api/superadmin.ts`
- **Customer APIs**: `lib/api/customer.ts`

## 🎨 Styling

- **Framework**: Tailwind CSS
- **Config**: `tailwind.config.js`
- **Global Styles**: `app/globals.css`

## 🚀 Key Features

1. **Fixed Sidebar**: Dashboard sidebar stays fixed on scroll
2. **Staff Management**: Full CRUD for staff (admin & superadmin)
3. **Role-Based Access**: Protected routes based on user roles
4. **Customer Menu**: Public-facing menu for table orders
5. **API Integration**: Complete backend API integration

