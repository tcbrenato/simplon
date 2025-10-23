import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import InvoiceEditor from './components/InvoiceEditor';
import './index.css';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b sticky top-0 bg-white/80 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">GBEFFA REIS BE KOM</Link>
          <nav className="flex gap-4 text-sm">
            <NavLink to="/" end className={({isActive}) => isActive ? 'text-primary font-semibold' : 'text-slate-600 hover:text-primary'}>Tableau de bord</NavLink>
            <NavLink to="/invoices" className={({isActive}) => isActive ? 'text-primary font-semibold' : 'text-slate-600 hover:text-primary'}>Factures</NavLink>
            <NavLink to="/clients" className={({isActive}) => isActive ? 'text-primary font-semibold' : 'text-slate-600 hover:text-primary'}>Clients</NavLink>
            <NavLink to="/settings" className={({isActive}) => isActive ? 'text-primary font-semibold' : 'text-slate-600 hover:text-primary'}>Paramètres</NavLink>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="border-t mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-slate-600">
          Développé par Rénato TCHOBO.
        </div>
      </footer>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Factures" value="0" />
        <StatCard title="Montant total" value="0 FCFA" />
        <StatCard title="Clients" value="0" />
        <StatCard title="En cours" value="0" />
      </div>
      <div className="flex gap-3 flex-wrap">
        <Link to="/invoices/new" className="px-4 py-2 bg-primary text-white rounded">Créer une facture</Link>
        <Link to="/invoices" className="px-4 py-2 border rounded">Voir les factures</Link>
        <Link to="/clients/new" className="px-4 py-2 border rounded">Enregistrer un client</Link>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded border p-4">
      <div className="text-slate-500 text-sm">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Invoices() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Factures pro forma</h2>
        <Link to="/invoices/new" className="px-4 py-2 bg-primary text-white rounded">Nouvelle facture</Link>
      </div>
      <div className="text-slate-600">Aucune facture pour le moment.</div>
    </div>
  );
}

function Clients() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Clients</h2>
        <Link to="/clients/new" className="px-4 py-2 bg-primary text-white rounded">Nouveau client</Link>
      </div>
      <div className="text-slate-600">Aucun client pour le moment.</div>
    </div>
  );
}

function Settings() {
  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Paramètres</h2>
      <div className="text-slate-600">Configurer TVA, réductions, logo, etc.</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<InvoiceEditor />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
