# Waste Activity Density — React + Tailwind Starter

This document contains a ready-to-use **starter project** for a professional web application based on **Next.js (React)**, **Tailwind CSS**, and **shadcn/ui** styling. It includes:

- Authentication (NextAuth with Email/Password credential stub, recommended: Supabase or NextAuth + Prisma)
- Database storage using **Prisma + SQLite** (easy to replace with PostgreSQL)
- API endpoints to calculate and save results
- Frontend pages: Login, Dashboard, Calculation form, History table, Chart (Recharts)
- Tailwind + shadcn/ui components used for a clean modern UI (production-ready style suggestions)

> **Note:** This is a starter scaffold: some pieces (email delivery, OAuth providers, production DB) require configuration. Instructions are included below.

---

## Project structure (files included in this doc)

```
waste-density-app/
├─ package.json
├─ README.md
├─ next.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ prisma/
│  └─ schema.prisma
├─ .env.example
├─ src/
│  ├─ pages/
│  │  ├─ _app.js
│  │  ├─ index.js
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth].js
│  │  │  └─ logs.js
│  ├─ lib/
│  │  └─ prisma.js
│  ├─ components/
│  │  ├─ Layout.jsx
│  │  ├─ CalculationForm.jsx
│  │  ├─ HistoryTable.jsx
│  │  ├─ ProtectedRoute.jsx
│  │  └─ LoginForm.jsx
│  └─ styles/globals.css
```

---

## README (usage + install)

```md
# Waste Density App — Next.js + Tailwind Starter

Requirements:
- Node 18+ (or Node 16+)
- pnpm / npm / yarn

Install
```bash
# clone repo
cd waste-density-app
npm install

# generate prisma client
npx prisma migrate dev --name init

# run dev
npm run dev
```

Notes:
- Configure `.env` from `.env.example` (NEXTAUTH_SECRET, DATABASE_URL)
- For production replace SQLite with PostgreSQL or MySQL and set env accordingly
- Configure NextAuth providers (Email/Supabase/Google) for real login flows
```
```

---

## package.json

```json
{
  "name": "waste-density-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "prisma": "prisma"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "next-auth": "^4.22.1",
    "prisma": "5.8.0",
    "@prisma/client": "5.8.0",
    "recharts": "^2.4.0",
    "axios": "^1.4.0",
    "@headlessui/react": "^1.8.0",
    "lucide-react": "^0.280.0",
    "@radix-ui/react-*": "*"
  },
  "devDependencies": {
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.23",
    "autoprefixer": "^10.4.13"
  }
}
```

> Adjust versions to latest stable when implementing.

---

## .env.example

```bash
# copy to .env and edit
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change_this_to_a_secure_random_string"
```

---

## prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String   // hashed password if using credentials
  createdAt DateTime @default(now())
  logs      Log[]
}

model Log {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  isotope    String
  gamma      Float
  distance_m Float
  dose_uSv   Float
  A_MBQ      Float
  A_Bq       Float
  mass_g     Float
  density    Float
  createdAt  DateTime @default(now())
}
```

---

## tailwind.config.js

```js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: []
}
```

## postcss.config.js

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

## src/styles/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html,body,#__next{height:100%;}
body{background:#f8fafc}
```

---

## src/lib/prisma.js

```js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## src/pages/_app.js

```jsx
import '../styles/globals.css'
import { SessionProvider } from 'next-auth/react'

export default function App({ Component, pageProps: { session, ...pageProps } }){
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  )
}
```

---

## src/pages/api/auth/[...nextauth].js

```js
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcrypt'

export default NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials){
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if(!user) return null;
        const pwok = await bcrypt.compare(credentials.password, user.password);
        if(!pwok) return null;
        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET
});
```

> For production, implement email sign-up with hashed passwords (bcrypt) and email verification or use Supabase Auth / OAuth providers.

---

## src/pages/api/logs.js

```js
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'

export default async function handler(req,res){
  const session = await getSession({ req });
  if(!session){ return res.status(401).json({error:'Not authenticated'}) }

  const userEmail = session.user.email;
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if(!user) return res.status(401).json({error:'User not found'})

  if(req.method === 'GET'){
    const logs = await prisma.log.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    return res.json(logs);
  }

  if(req.method === 'POST'){
    const { isotope,gamma,distance_m,dose_uSv,A_MBQ,A_Bq,mass_g,density } = req.body;
    const saved = await prisma.log.create({ data: { userId: user.id, isotope, gamma: Number(gamma), distance_m: Number(distance_m), dose_uSv: Number(dose_uSv), A_MBQ: Number(A_MBQ), A_Bq: Number(A_Bq), mass_g: Number(mass_g), density: Number(density) } });
    return res.json(saved);
  }

  return res.status(405).json({error:'Method not allowed'});
}
```

---

## src/components/Layout.jsx

```jsx
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

export default function Layout({ children }){
  const { data: session } = useSession();
  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">W</div>
            <div>
              <div className="font-semibold">Waste Density</div>
              <div className="text-xs text-gray-500">Monitoring Limbah Padat</div>
            </div>
          </div>
          <div>
            {session ? (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700">{session.user.email}</div>
                <button className="px-3 py-1 bg-red-500 text-white rounded-md" onClick={() => signOut()}>Logout</button>
              </div>
            ) : (
              <Link href="/"> <a className="px-3 py-1 bg-blue-600 text-white rounded-md">Login</a></Link>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
```

---

## src/components/LoginForm.jsx

```jsx
import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginForm(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [err,setErr]=useState('');
  async function onSubmit(e){
    e.preventDefault();
    const r = await signIn('credentials',{ redirect:false, email, password });
    if(r.error) setErr(r.error); else window.location.href='/';
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="text-sm text-gray-600">Email</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full p-2 border rounded"/>
      </div>
      <div>
        <label className="text-sm text-gray-600">Password</label>
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full p-2 border rounded"/>
      </div>
      {err && <div className="text-red-500">{err}</div>}
      <div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Login</button>
      </div>
    </form>
  )
}
```

---

## src/components/CalculationForm.jsx

```jsx
import { useState } from 'react'
import axios from 'axios'

export default function CalculationForm({onSaved}){
  const [isotope,setIsotope]=useState('F-18');
  const [gamma,setGamma]=useState(0.1879);
  const [distance,setDistance]=useState(0.3);
  const [dose,setDose]=useState(0.08);
  const [mass,setMass]=useState(10000);
  const [result,setResult]=useState(null);

  function calc(){
    if(!(gamma>0 && distance>=0 && dose>=0 && mass>0)) return alert('Input tidak valid');
    const A_MBQ = (dose * (distance*distance)) / gamma;
    const A_Bq = A_MBQ * 1e6;
    const density = A_Bq / mass;
    const res={isotope,gamma,distance_m:distance,dose_uSv:dose,A_MBQ,A_Bq,mass_g:mass,density};
    setResult(res);
    return res;
  }

  async function save(){
    const res=calc();
    if(!res) return;
    await axios.post('/api/logs', res);
    setResult(null);
    onSaved && onSaved();
    alert('Tersimpan');
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={isotope} onChange={e=>setIsotope(e.target.value)} className="p-2 border rounded">
          <option value="F-18">F-18</option>
          <option value="I-131">I-131</option>
          <option value="Tc-99m">Tc-99m</option>
          <option value="custom">Custom</option>
        </select>
        <input value={gamma} onChange={e=>setGamma(parseFloat(e.target.value))} className="p-2 border rounded" placeholder="gamma" />
        <input value={distance} onChange={e=>setDistance(parseFloat(e.target.value))} className="p-2 border rounded" placeholder="distance m" />
        <input value={dose} onChange={e=>setDose(parseFloat(e.target.value))} className="p-2 border rounded" placeholder="dose uSv/hr" />
        <input value={mass} onChange={e=>setMass(parseFloat(e.target.value))} className="p-2 border rounded" placeholder="mass g" />
      </div>

      <div className="flex gap-2">
        <button onClick={calc} className="px-4 py-2 bg-blue-600 text-white rounded">Hitung</button>
        <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded">Simpan</button>
      </div>

      {result && (
        <div className="p-3 bg-gray-50 rounded">
          <div>Aktifitas (MBq): {result.A_MBQ.toExponential(5)}</div>
          <div>Aktifitas (Bq): {result.A_Bq.toFixed(2)}</div>
          <div>Densitas (Bq/gr): {result.density.toPrecision(5)}</div>
        </div>
      )}
    </div>
  )
}
```

---

## src/components/HistoryTable.jsx

```jsx
import useSWR from 'swr'
import axios from 'axios'
import { useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const fetcher = (url) => axios.get(url).then(r => r.data)

export default function HistoryTable({refreshFlag}){
  const { data, error, mutate } = useSWR('/api/logs', fetcher, { refreshInterval: 0 });

  useEffect(()=>{ mutate() }, [refreshFlag])

  if(error) return <div className="text-red-500">Gagal memuat</div>
  if(!data) return <div>Memuat...</div>

  return (
    <div>
      <div className="overflow-auto max-h-80">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr><th className="p-2">Waktu</th><th>Isotop</th><th>Densitas (Bq/gr)</th></tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.id} className="border-b"><td className="p-2">{new Date(d.createdAt).toLocaleString()}</td><td className="p-2">{d.isotope}</td><td className="p-2">{Number(d.density).toPrecision(6)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{height:240}} className="mt-4">
        <ResponsiveContainer>
          <BarChart data={data.slice(0,20).map(x=>({ name: new Date(x.createdAt).toLocaleTimeString(), density: Number(x.density) })).reverse()}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="density" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

---

## src/pages/index.js (Dashboard)

```jsx
import Layout from '../components/Layout'
import CalculationForm from '../components/CalculationForm'
import HistoryTable from '../components/HistoryTable'
import { useState } from 'react'
import { getSession } from 'next-auth/react'

export default function Home(){
  const [flag, setFlag] = useState(0);
  return (
    <Layout>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="card">
            <h3 className="font-semibold">Perhitungan</h3>
            <CalculationForm onSaved={() => setFlag(f => f+1)} />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="card">
            <h3 className="font-semibold">Riwayat</h3>
            <HistoryTable refreshFlag={flag} />
          </div>
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps(ctx){
  const session = await getSession(ctx);
  if(!session){
    return { redirect: { destination: '/auth', permanent: false } }
  }
  return { props: {} }
}
```

---

## Notes & Next Steps

1. **Authentication**: The code uses NextAuth Credentials provider with bcrypt. You must implement user registration (API route to create user, hash password with bcrypt) and/or use OAuth providers (Google) or Supabase Auth for simpler setup.
2. **Email/password**: For production send verification emails; consider OTP or Magic Link (NextAuth Email provider) or Supabase.
3. **Database**: For multiple users in production use PostgreSQL. Update `DATABASE_URL` and run `prisma migrate deploy`.
4. **Deployment**: Vercel or Netlify (Next.js recommended on Vercel). Remember to set `NEXTAUTH_SECRET` and `DATABASE_URL` in environment.
5. **shadcn/ui**: This scaffold uses simple Tailwind; to integrate `shadcn/ui`, install the packages and replace components with `Button`, `Card`, etc. (shadcn requires a design system setup).
6. **Security**: Make sure to sanitize inputs (backend does Numeric casts), enable HTTPS, set CORS and rate limiting as needed.

---

If Anda ingin, saya bisa:

- **Generate full file set** ready to paste into a repo (I can create ZIP or multiple files in the canvas) — pilih ini kalau Prof ingin saya hasilkan semua file siap-clone.
- **Implement registration endpoint + frontend** (signup with hashed password), sehingga Anda dapat membuat akun pengguna baru.
- **Switch Auth to Supabase** (faster setup, managed auth & DB) and provide instructions to connect.

Pilih salah satu, dan saya akan buatkan langkah selanjutnya.
