import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Mail,
  ShieldCheck,
  Wallet,
  Briefcase,
  User as UserIcon,
  X,
  AlertCircle,
  Loader2,
  Filter,
} from "lucide-react";
import debounce from "lodash.debounce";
import toast, { Toaster } from "react-hot-toast";

/* =====================================================
   TYPES
===================================================== */

type User = {
  _id: string;
  name: string;
  email: string;
  role: "Admin" | "Finance" | "Manager";
  status: "Active" | "Inactive";
};

type FormDataType = Omit<User, "_id">;

const API = "http://localhost:5000/api/users";

/* =====================================================
   MAIN COMPONENT
===================================================== */

export default function PremiumUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    email: "",
    role: "Manager",
    status: "Active",
  });

  /* =====================================================
     FETCH USERS
  ===================================================== */

  const fetchUsers = useCallback(async (query = "", role = "") => {
    try {
      setLoading(true);

      const res = await axios.get(API, {
        params: { search: query, role },
      });

      setUsers(res.data?.data || []);
    } catch {
      toast.error("Failed to Load Users");
    } finally {
      setLoading(false);
    }
  }, []);

type DebouncedFetch = ((q: string, r: string) => void) & {
  cancel: () => void;
};

const debouncedFetch = useMemo(() => {
  return debounce(
    (q: string, r: string) => fetchUsers(q, r),
    400
  ) as DebouncedFetch;
}, [fetchUsers]);

useEffect(() => {
  debouncedFetch(search, roleFilter);

  return () => {
    debouncedFetch.cancel();
  };
}, [search, roleFilter, debouncedFetch]);
  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (editingUser) {
        await axios.patch(`${API}/${editingUser._id}`, formData);
        toast.success("User Updated");
      } else {
        await axios.post(API, formData);
        toast.success("User Created");
      }

      closeModal();
      fetchUsers(search, roleFilter);
    } catch {
      toast.error("Operation Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const deleteUser = async (id: string) => {
    if (!window.confirm("Delete this User?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      toast.success("Deleted");
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {
      toast.error("Delete Failed");
    }
  };

  /* =====================================================
     MODAL
  ===================================================== */

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        role: "Manager",
        status: "Active",
      });
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
            {/* ICON BOX */}
            <div className="bg-sky-600 p-2.5 rounded-xl shadow-lg shadow-sky-200">
              <UserIcon className="text-white" size={28} />
            </div>

            {/* TEXT BLOCK */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Team<span className="text-sky-600"> Directory</span>
              </h1>

              <p className="text-slate-600 font-medium">Manage organization members and permissions</p>
            </div>
          </div>

          <button
            onClick={() => openModal()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold shadow"
          >
            <Plus size={18} />
            Invite Member
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* SEARCH */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>

            {/* ROLE */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 outline-none appearance-none"
              >
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Finance">Finance</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-800">No Users Found</h3>
            <p className="text-slate-500 text-sm">
              Try another search or filter
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {users.map((user) => (
              <UserCard
                key={user._id}
                user={user}
                onEdit={openModal}
                onDelete={deleteUser}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h2 className="text-xl font-bold text-slate-800">
                {editingUser ? "Edit Member" : "Create Member"}
              </h2>

              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  Full Name
                </label>

                <input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  Email
                </label>

                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">
                    Role
                  </label>

                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as any,
                      })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  >
                    <option>Admin</option>
                    <option>Finance</option>
                    <option>Manager</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">
                    Status
                  </label>

                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sk-700 text-white font-semibold flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}

                  {editingUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   CARD
===================================================== */

function UserCard({
  user,
  onEdit,
  onDelete,
}: {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}) {
  const Icon =
    {
      Admin: ShieldCheck,
      Finance: Wallet,
      Manager: Briefcase,
    }[user.role] || UserIcon;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg transition">
      <div className="flex justify-between gap-3">
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <UserIcon className="w-7 h-7 text-slate-600" />
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 truncate">
              {user.name}
            </h3>

            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 truncate">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(user)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <Edit size={16} />
          </button>

          <button
            onClick={() => onDelete(user._id)}
            className="p-2 rounded-lg hover:bg-red-50 text-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
          <Icon className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold">{user.role}</span>
        </div>

        <span
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            user.status === "Active"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {user.status}
        </span>
      </div>
    </div>
  );
}