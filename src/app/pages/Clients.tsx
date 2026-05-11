import React, { useEffect, useState, useMemo } from "react";
import {
  Plus, Edit, Trash2, Search, Building2, Globe2,
  Mail, Phone, MapPin, Briefcase, Filter, X, CheckCircle2, AlertCircle
} from "lucide-react";

/* ---------------------------------------------------------
   TYPES & INTERFACES
--------------------------------------------------------- */
interface ClientType {
  _id: string;
  client_name: string;
  industry: string;
  country: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt?: string;
}

// ... (Other interfaces remain same as your original)

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */
export default function Clients() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const token = localStorage.getItem("token") || "";
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.role;

  const [clients, setClients] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState<ClientType | null>(null);

  const emptyClient: ClientType = {
    _id: "", client_name: "", industry: "", country: "",
    email: "", phone: "", address: "", isActive: true,
  };

  const [newClient, setNewClient] = useState<ClientType>(emptyClient);

  /* -------------------- DATA FETCHING -------------------- */
  const loadClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClients(data.data || []);
    } catch (err) {
      console.error("Client Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  /* -------------------- MEMOIZED CALCULATIONS -------------------- */
  const filteredClients = useMemo(() => {
    return clients
      .filter((c) => (showInactive ? true : c.isActive))
      .filter((c) => c.client_name.toLowerCase().includes(search.toLowerCase()));
  }, [clients, showInactive, search]);

  const stats = useMemo(() => {
    const active = clients.filter(c => c.isActive).length;
    return {
      total: clients.length,
      active,
      inactive: clients.length - active,
      industries: new Set(clients.map(c => c.industry)).size,
      countries: new Set(clients.map(c => c.country)).size
    };
  }, [clients]);

  /* -------------------- ACTIONS -------------------- */
  const handleSave = async (client: ClientType, isEdit: boolean) => {
    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit ? `${API_BASE}/api/clients/${client._id}` : `${API_BASE}/api/clients`;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify(client),
      });

      if (res.ok) {
        isEdit ? setShowEdit(false) : setShowAdd(false);
        setNewClient(emptyClient);
        loadClients();
      }
    } catch (err) {
      alert("Error saving client");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8">
      
      {/* GLASSMORPHIC HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-sky-600 rounded-xl text-white shadow-lg shadow-blue-200">
            <Building2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Client <span className="text-sky-600">Directory</span></h1>
            <p className="text-slate-600 font-medium">Manage corporate relationships and global partners</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Quick search..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {(userRole === "Admin" || userRole === "Finance") && (
            <button 
              onClick={() => setShowAdd(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium"
            >
              <Plus size={18} /> <span className="hidden sm:inline">Add Client</span>
            </button>
          )}
        </div>
      </header>

      {/* KPI DASHBOARD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients" value={stats.total} icon={<Briefcase />} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Active" value={stats.active} icon={<CheckCircle2 />} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Industries" value={stats.industries} icon={<Globe2 />} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Global Reach" value={`${stats.countries} Countries`} icon={<MapPin />} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* FILTER TOGGLE */}
      <div className="flex justify-end">
        <button 
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition ${showInactive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}
        >
            <Filter size={14} /> {showInactive ? "Showing All" : "Showing Active Only"}
        </button>
      </div>

      {/* MAIN GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Syncing database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard 
              key={client._id} 
              client={client} 
              onEdit={() => { setEditData(client); setShowEdit(true); }}
              onDelete={loadClients}
              canManage={userRole === "Admin" || userRole === "Finance"}
            />
          ))}
        </div>
      )}

      {/* MODALS (Simplified for brevity, logic remains same) */}
      {(showAdd || showEdit) && (
        <Modal onClose={() => { setShowAdd(false); setShowEdit(false); }}>
            <ClientForm 
                title={showEdit ? "Update Client" : "New Client Profile"}
                data={showEdit ? editData! : newClient}
                setData={showEdit ? setEditData : setNewClient}
                onSave={() => handleSave(showEdit ? editData! : newClient, showEdit)}
                onCancel={() => { setShowAdd(false); setShowEdit(false); }}
            />
        </Modal>
      )}
    </div>
  );
}

/* -------------------- SUB-COMPONENTS -------------------- */

function StatCard({ label, value, icon, color, bg }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bg} ${color}`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function ClientCard({ client, onEdit, onDelete, canManage }: any) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-1.5 h-full ${client.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${client.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {client.isActive ? 'Active Member' : 'Archived'}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{client.client_name}</h3>
        </div>
        {canManage && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"><Edit size={16} /></button>
                <button className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition"><Trash2 size={16} /></button>
            </div>
        )}
      </div>

      <div className="space-y-3">
        <IconDetail icon={<Briefcase size={16}/>} text={client.industry} />
        <IconDetail icon={<Globe2 size={16}/>} text={client.country} />
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <IconDetail icon={<Mail size={16}/>} text={client.email} className="text-indigo-600 text-sm font-medium" />
            <IconDetail icon={<Phone size={16}/>} text={client.phone} className="text-slate-500 text-sm" />
        </div>
      </div>
    </div>
  );
}

function IconDetail({ icon, text, className = "text-slate-600" }: any) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <span className="text-slate-400">{icon}</span>
            <span className="truncate">{text || "Not Provided"}</span>
        </div>
    );
}

function Modal({ children, onClose }: any) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg animate-in fade-in zoom-in duration-200">
                {children}
            </div>
        </div>
    );
}

function ClientForm({ title, data, setData, onSave, onCancel }: any) {
    return (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                <h2 className="text-xl font-bold">{title}</h2>
                <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Company Name" value={data.client_name} onChange={(v) => setData({...data, client_name: v})} colSpan="col-span-2" />
                    <FormInput label="Industry" value={data.industry} onChange={(v) => setData({...data, industry: v})} />
                    <FormInput label="Country" value={data.country} onChange={(v) => setData({...data, country: v})} />
                    <FormInput label="Email" type="email" value={data.email} onChange={(v) => setData({...data, email: v})} />
                    <FormInput label="Phone" value={data.phone} onChange={(v) => setData({...data, phone: v})} />
                    <FormInput label="Full Address" value={data.address} onChange={(v) => setData({...data, address: v})} colSpan="col-span-2" />
                </div>
                <div className="flex justify-end gap-3 pt-6">
                    <button onClick={onCancel} className="px-6 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition">Discard</button>
                    <button onClick={onSave} className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">Save Partner</button>
                </div>
            </div>
        </div>
    );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  colSpan = "col-span-1",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  colSpan?: string;
}) {
  return (
    <div className={colSpan}>
      <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
        {label}
      </label>
      <input
        type={type}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}