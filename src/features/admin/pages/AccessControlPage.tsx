import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  Info,
  KeyRound,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Search,
  Shield,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ============================================================================
// Types & Domain Models (BRD 6.8 & SDD 4.8)
// ============================================================================

export interface Role {
  role_id: number;
  role_name: string;
  description: string;
  is_system: boolean;
}

export interface Permission {
  permission_id: number;
  action_scope: string; // e.g., 'quote:create', 'pii:unmask'
  module_context: "POLICIES" | "UNDERWRITING" | "FINANCE" | "PRODUCT_CATALOG" | "PDPA_SECURITY" | "WORKFLOW";
  description: string;
  is_high_risk?: boolean;
}

export interface AdminUser {
  admin_user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role_ids: number[];
  has_pii_unmask_override: boolean; // Direct PII reveal capability
  created_at: string;
}

// Maker-Checker & Role Conflict definition (BRD SEC-05 & SDD 2.1.5)
export interface SODConstraint {
  id: string;
  name: string;
  maker_scope: string;
  checker_scope: string;
  description: string;
}

// ============================================================================
// Static Data & Constraints Specification
// ============================================================================

const SOD_CONSTRAINTS: SODConstraint[] = [
  {
    id: "SOD-01",
    name: "Product Governance",
    maker_scope: "product:edit",
    checker_scope: "product:publish",
    description: "A user or role that creates/modifies product versions cannot publish or approve them.",
  },
  {
    id: "SOD-02",
    name: "Finance & Refund Disbursement",
    maker_scope: "payout:request",
    checker_scope: "refund:approve",
    description: "Staff staging ledger payouts cannot authorize or settle refund disbursements.",
  },
  {
    id: "SOD-03",
    name: "Underwriting Override",
    maker_scope: "application:adjudicate",
    checker_scope: "rule:override",
    description: "Triage personnel entering manual loadings cannot bypass high-level systemic URE boundaries.",
  },
];

const INITIAL_ROLES: Role[] = [
  { role_id: 1, role_name: "Super Admin", description: "Full system setup and technical governance", is_system: true },
  {
    role_id: 2,
    role_name: "Underwriter",
    description: "Evaluates risk, applies loadings and manual triage",
    is_system: false,
  },
  {
    role_id: 3,
    role_name: "Finance Officer",
    description: "Manages ledger reconciliation and settlements",
    is_system: false,
  },
  {
    role_id: 4,
    role_name: "Telesales Agent",
    description: "Frontline quote creation and customer binding",
    is_system: false,
  },
  {
    role_id: 5,
    role_name: "Operations Officer",
    description: "Manages refer templates and batch renewal migrations",
    is_system: false,
  },
  {
    role_id: 6,
    role_name: "Approver (Manager)",
    description: "Checker authority for discounts, rates and refunds",
    is_system: false,
  },
];

const PERMISSIONS_CATALOG: Permission[] = [
  // Policies & Lifecycle
  {
    permission_id: 101,
    action_scope: "quote:create",
    module_context: "POLICIES",
    description: "Generate mathematical premium quotes",
  },
  {
    permission_id: 102,
    action_scope: "quote:read",
    module_context: "POLICIES",
    description: "View quote records and installment plans",
  },
  {
    permission_id: 103,
    action_scope: "policy:endorse",
    module_context: "POLICIES",
    description: "Initiate mid-term snapshot endorsement (Clone & Swap)",
  },
  {
    permission_id: 104,
    action_scope: "policy:cancel",
    module_context: "POLICIES",
    description: "Terminate active policy contracts",
  },

  // Underwriting & Risk
  {
    permission_id: 201,
    action_scope: "application:review",
    module_context: "UNDERWRITING",
    description: "Claim tickets and review yellow-channel submissions",
  },
  {
    permission_id: 202,
    action_scope: "application:adjudicate",
    module_context: "UNDERWRITING",
    description: "Apply manual underwriting loading and exclusions",
  },
  {
    permission_id: 203,
    action_scope: "rule:override",
    module_context: "UNDERWRITING",
    description: "Bypass standard age/vehicle underwriting boundaries",
    is_high_risk: true,
  },

  // Finance & Commissions
  {
    permission_id: 301,
    action_scope: "commission:read",
    module_context: "FINANCE",
    description: "Inspect agent wallet balances and withholding taxes",
  },
  {
    permission_id: 302,
    action_scope: "commission:edit",
    module_context: "FINANCE",
    description: "Alter broker commission base percentages",
    is_high_risk: true,
  },
  {
    permission_id: 303,
    action_scope: "transaction:settle",
    module_context: "FINANCE",
    description: "Execute End-of-Month carrier bordereau settlement",
  },
  {
    permission_id: 304,
    action_scope: "refund:approve",
    module_context: "FINANCE",
    description: "Authorize premium refunds exceeding threshold",
    is_high_risk: true,
  },

  // Product Catalog & Governance
  {
    permission_id: 401,
    action_scope: "product:edit",
    module_context: "PRODUCT_CATALOG",
    description: "Create and edit DRAFT product & plan versions",
  },
  {
    permission_id: 402,
    action_scope: "product:publish",
    module_context: "PRODUCT_CATALOG",
    description: "Activate and publish versioned insurance products",
    is_high_risk: true,
  },

  // PDPA & Security
  {
    permission_id: 501,
    action_scope: "pii:unmask",
    module_context: "PDPA_SECURITY",
    description: "Decrypt and reveal Thai National ID and phone numbers in UI",
    is_high_risk: true,
  },
  {
    permission_id: 601,
    action_scope: "workflow:configure",
    module_context: "WORKFLOW",
    description: "Edit state transitions and conditional logic schemas",
    is_high_risk: true,
  },
];

// Initial matrix role-to-permission mapping
const INITIAL_ROLE_PERMISSIONS: Record<number, number[]> = {
  1: [101, 102, 103, 104, 201, 202, 203, 301, 302, 303, 304, 401, 402, 501, 601], // Super Admin
  2: [101, 102, 201, 202, 203], // Underwriter (lacks commission:edit)
  3: [102, 301, 303, 304], // Finance Officer (lacks policy:cancel)
  4: [101, 102], // Telesales Agent
  5: [101, 102, 103, 201], // Operations Officer
  6: [102, 301, 304, 402], // Approver Manager
};

const INITIAL_USERS: AdminUser[] = [
  {
    admin_user_id: "usr-001",
    email: "somchai.u@broker-pas.co.th",
    full_name: "Somchai Prasert",
    is_active: true,
    role_ids: [2],
    has_pii_unmask_override: false,
    created_at: "2026-01-15",
  },
  {
    admin_user_id: "usr-002",
    email: "kanya.f@broker-pas.co.th",
    full_name: "Kanya Ratanakul",
    is_active: true,
    role_ids: [3, 6],
    has_pii_unmask_override: true,
    created_at: "2026-02-01",
  },
  {
    admin_user_id: "usr-003",
    email: "anan.tele@broker-pas.co.th",
    full_name: "Anan Wongsuwan",
    is_active: true,
    role_ids: [4],
    has_pii_unmask_override: false,
    created_at: "2026-02-14",
  },
  {
    admin_user_id: "usr-004",
    email: "security.admin@broker-pas.co.th",
    full_name: "Pakornsak Supamongkon (Lead)",
    is_active: true,
    role_ids: [1],
    has_pii_unmask_override: true,
    created_at: "2026-01-01",
  },
];

// ============================================================================
// Main Component
// ============================================================================

export const AccessControlPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"matrix" | "users" | "sod">("matrix");

  // Matrix State
  const [rolePermissions, setRolePermissions] = useState<Record<number, number[]>>(INITIAL_ROLE_PERMISSIONS);
  const [persistedRolePermissions, setPersistedRolePermissions] =
    useState<Record<number, number[]>>(INITIAL_ROLE_PERMISSIONS);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<number | "ALL">("ALL");
  const [matrixSearch, setMatrixSearch] = useState<string>("");
  const [hasUnsavedMatrixChanges, setHasUnsavedMatrixChanges] = useState<boolean>(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<boolean>(false);

  // Users State
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [userSearch, setUserSearch] = useState<string>("");
  const [filterUserRole, setFilterUserRole] = useState<number | "ALL">("ALL");
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Form State for User Modal
  const [userFormData, setUserFormData] = useState<{
    email: string;
    full_name: string;
    role_ids: number[];
    is_active: boolean;
    has_pii_unmask_override: boolean;
  }>({
    email: "",
    full_name: "",
    role_ids: [],
    is_active: true,
    has_pii_unmask_override: false,
  });

  // --------------------------------------------------------------------------
  // Matrix Rule Checking & Actions
  // --------------------------------------------------------------------------

  // Hardcoded BRD constraint validation: Agent cannot possess commission:edit
  const isPermissionForbiddenForRole = (roleId: number, actionScope: string): boolean => {
    if (roleId === 4 && actionScope === "commission:edit") {
      return true; // Screen 8.6.1 Hardcoded constraint
    }
    return false;
  };

  const handleTogglePermission = (roleId: number, permissionId: number, actionScope: string) => {
    if (isPermissionForbiddenForRole(roleId, actionScope)) {
      return;
    }

    const currentPerms = rolePermissions[roleId] || [];
    const isAssigned = currentPerms.includes(permissionId);

    const updated = isAssigned ? currentPerms.filter((id) => id !== permissionId) : [...currentPerms, permissionId];

    const nextState = {
      ...rolePermissions,
      [roleId]: updated,
    };

    setRolePermissions(nextState);
    setHasUnsavedMatrixChanges(JSON.stringify(nextState) !== JSON.stringify(persistedRolePermissions));
  };

  const handleSaveMatrixChanges = () => {
    setPersistedRolePermissions(rolePermissions);
    setHasUnsavedMatrixChanges(false);
    setSaveSuccessNotification(true);
    setTimeout(() => setSaveSuccessNotification(false), 3000);
  };

  const handleResetMatrixChanges = () => {
    setRolePermissions(persistedRolePermissions);
    setHasUnsavedMatrixChanges(false);
  };

  // --------------------------------------------------------------------------
  // User Modal Management
  // --------------------------------------------------------------------------

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      email: "",
      full_name: "",
      role_ids: [4],
      is_active: true,
      has_pii_unmask_override: false,
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setUserFormData({
      email: user.email,
      full_name: user.full_name,
      role_ids: [...user.role_ids],
      is_active: user.is_active,
      has_pii_unmask_override: user.has_pii_unmask_override,
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.email || !userFormData.full_name) return;

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.admin_user_id === editingUser.admin_user_id
            ? {
                ...u,
                email: userFormData.email,
                full_name: userFormData.full_name,
                role_ids: userFormData.role_ids,
                is_active: userFormData.is_active,
                has_pii_unmask_override: userFormData.has_pii_unmask_override,
              }
            : u,
        ),
      );
    } else {
      const newUser: AdminUser = {
        admin_user_id: `usr-${Date.now().toString().slice(-4)}`,
        email: userFormData.email,
        full_name: userFormData.full_name,
        role_ids: userFormData.role_ids,
        is_active: userFormData.is_active,
        has_pii_unmask_override: userFormData.has_pii_unmask_override,
        created_at: new Date().toISOString().split("T")[0],
      };
      setUsers((prev) => [...prev, newUser]);
    }

    setIsUserModalOpen(false);
  };

  // --------------------------------------------------------------------------
  // SOD Conflicts Evaluation
  // --------------------------------------------------------------------------

  const detectedSODConflicts = useMemo(() => {
    const conflicts: { roleId: number; roleName: string; constraint: SODConstraint }[] = [];

    INITIAL_ROLES.forEach((role) => {
      const perms = rolePermissions[role.role_id] || [];
      const scopes = perms.map((pid) => PERMISSIONS_CATALOG.find((p) => p.permission_id === pid)?.action_scope);

      SOD_CONSTRAINTS.forEach((rule) => {
        if (scopes.includes(rule.maker_scope) && scopes.includes(rule.checker_scope)) {
          conflicts.push({
            roleId: role.role_id,
            roleName: role.role_name,
            constraint: rule,
          });
        }
      });
    });

    return conflicts;
  }, [rolePermissions]);

  // --------------------------------------------------------------------------
  // Filtered Permission List
  // --------------------------------------------------------------------------

  const filteredPermissions = useMemo(() => {
    return PERMISSIONS_CATALOG.filter((perm) => {
      const matchesSearch =
        perm.action_scope.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        perm.description.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        perm.module_context.toLowerCase().includes(matrixSearch.toLowerCase());
      return matchesSearch;
    });
  }, [matrixSearch]);

  const activeRolesToDisplay = useMemo(() => {
    if (selectedRoleFilter === "ALL") return INITIAL_ROLES;
    return INITIAL_ROLES.filter((r) => r.role_id === selectedRoleFilter);
  }, [selectedRoleFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = filterUserRole === "ALL" || u.role_ids.includes(filterUserRole as number);
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, filterUserRole]);

  return (
    // Compensates layout padding: flush with header, strictly light theme
    <div className="-mt-6 -mx-6 bg-zinc-50 min-h-screen text-zinc-900 pb-12 antialiased">
      {/* ------------------------------------------------------------------ */}
      {/* Edge-to-Edge Sticky Sub-Header                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-20 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex p-1.5 rounded-lg bg-zinc-900 text-white">
                <Shield className="w-4 h-4" />
              </span>
              <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">Access Control & RBAC</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                OIC & PDPA Compliant
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Role definitions, atomic API scopes, Segregation of Duties (Maker-Checker), and Thai PDPA unmasking
              policies.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-3">
            {hasUnsavedMatrixChanges && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetMatrixChanges}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Discard
                </button>
                <button
                  onClick={handleSaveMatrixChanges}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Matrix Changes
                </button>
              </div>
            )}

            {saveSuccessNotification && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Permissions Updated Successfully
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 mt-4 border-t border-zinc-100 pt-3 text-xs font-medium">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`pb-2 transition-colors relative flex items-center gap-2 ${
              activeTab === "matrix" ? "text-zinc-900 font-semibold" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Permission Matrix (Screen 8.6.1)
            {activeTab === "matrix" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`pb-2 transition-colors relative flex items-center gap-2 ${
              activeTab === "users" ? "text-zinc-900 font-semibold" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Internal Staff & PII Scopes (Screen 8.6.2)
            {activeTab === "users" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("sod")}
            className={`pb-2 transition-colors relative flex items-center gap-2 ${
              activeTab === "sod" ? "text-zinc-900 font-semibold" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Maker-Checker Conflict Guardrails
            {detectedSODConflicts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {detectedSODConflicts.length}
              </span>
            )}
            {activeTab === "sod" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tab 1: Permission Matrix Grid                                      */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "matrix" && (
        <div className="p-6 max-w-7xl mx-auto space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter scopes (e.g. quote:create, pii:unmask, refund)..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-zinc-500" />
                <select
                  aria-label="Filter by Role View"
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white"
                >
                  <option value="ALL">Show All Roles ({INITIAL_ROLES.length})</option>
                  {INITIAL_ROLES.map((r) => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" /> Active Scope
              </span>
              <span className="flex items-center gap-1 ml-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-100 border border-rose-300 inline-block" /> High-Risk
                Scope
              </span>
              <span className="flex items-center gap-1 ml-2">
                <Lock className="w-3 h-3 text-zinc-400 inline-block" /> BRD System Constraint
              </span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
                    <th className="py-3 px-4 font-semibold w-72 sticky left-0 bg-zinc-50 z-10 border-r border-zinc-200">
                      Permission Scope (entity:action)
                    </th>
                    <th className="py-3 px-3 font-semibold w-28 text-center border-r border-zinc-200">
                      Module Context
                    </th>
                    {activeRolesToDisplay.map((role) => (
                      <th
                        key={role.role_id}
                        className="py-3 px-3 font-semibold text-center min-w-[120px] max-w-[140px] border-r border-zinc-200 last:border-r-0"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-zinc-900 font-medium">{role.role_name}</span>
                          <span className="text-[10px] text-zinc-400 font-normal line-clamp-1">
                            {role.role_id === 1 ? "Immutable" : `ID: ${role.role_id}`}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-800">
                  {filteredPermissions.map((perm) => (
                    <tr key={perm.permission_id} className="hover:bg-zinc-50/70 transition-colors">
                      {/* Permission Scope Column */}
                      <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-zinc-200">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-semibold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded-sm">
                            {perm.action_scope}
                          </span>
                          {perm.is_high_risk && (
                            <span className="text-[10px] text-rose-600 font-medium px-1.5 py-0.2 bg-rose-50 border border-rose-200 rounded-xs">
                              Critical
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{perm.description}</p>
                      </td>

                      {/* Module Context */}
                      <td className="py-3 px-3 text-center border-r border-zinc-200">
                        <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {perm.module_context}
                        </span>
                      </td>

                      {/* Role Checkboxes */}
                      {activeRolesToDisplay.map((role) => {
                        const isAssigned = (rolePermissions[role.role_id] || []).includes(perm.permission_id);
                        const isForbidden = isPermissionForbiddenForRole(role.role_id, perm.action_scope);
                        const isSuperAdmin = role.role_id === 1;

                        return (
                          <td
                            key={role.role_id}
                            className="py-3 px-3 text-center border-r border-zinc-200 last:border-r-0"
                          >
                            <div className="flex items-center justify-center">
                              {isForbidden ? (
                                <div
                                  className="group relative cursor-not-allowed p-1.5 rounded-md bg-zinc-100 text-zinc-400"
                                  title="Constraint: BRD physically blocks Agent from commission editing"
                                >
                                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    !isSuperAdmin &&
                                    handleTogglePermission(role.role_id, perm.permission_id, perm.action_scope)
                                  }
                                  disabled={isSuperAdmin}
                                  aria-label={`Toggle ${perm.action_scope} for ${role.role_name}`}
                                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                    isAssigned
                                      ? "bg-zinc-900 text-white shadow-2xs"
                                      : "border border-zinc-300 hover:border-zinc-400 bg-white"
                                  } ${isSuperAdmin ? "opacity-80 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  {isAssigned && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPermissions.length === 0 && (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No permissions found matching "{matrixSearch}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Tab 2: Internal Staff & PII Scopes (Screen 8.6.2)                  */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "users" && (
        <div className="p-6 max-w-7xl mx-auto space-y-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff by name or corporate email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all"
                />
              </div>

              <select
                aria-label="Filter Users by Assigned Role"
                value={filterUserRole}
                onChange={(e) => setFilterUserRole(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white"
              >
                <option value="ALL">All Roles</option>
                {INITIAL_ROLES.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAddUser}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Internal Staff Member
            </button>
          </div>

          {/* User Table */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
                  <th className="py-3 px-4 font-semibold">User Details</th>
                  <th className="py-3 px-4 font-semibold">Assigned RBAC Roles</th>
                  <th className="py-3 px-4 font-semibold">PDPA PII Unmask Override</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Joined Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800">
                {filteredUsers.map((user) => (
                  <tr key={user.admin_user_id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 font-semibold flex items-center justify-center text-xs">
                          {user.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900">{user.full_name}</div>
                          <div className="text-[11px] text-zinc-500 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {user.role_ids.map((rid) => {
                          const roleObj = INITIAL_ROLES.find((r) => r.role_id === rid);
                          return (
                            <span
                              key={rid}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200"
                            >
                              {roleObj?.role_name || `Role #${rid}`}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {user.has_pii_unmask_override ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          <Eye className="w-3 h-3" />
                          PII Unmask Permitted (Audited)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                          <EyeOff className="w-3 h-3 text-zinc-400" />
                          Default Masked (1-1004-XXXX)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <UserCheck className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                          <UserX className="w-3.5 h-3.5" /> Deactivated
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">{user.created_at}</td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEditUser(user)}
                        className="text-zinc-600 hover:text-zinc-900 font-medium text-xs px-2.5 py-1 rounded-md border border-zinc-200 hover:bg-zinc-100 transition-colors"
                      >
                        Edit Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Tab 3: Maker-Checker Conflict Guardrails (BRD SEC-05 & BO-08)       */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "sod" && (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Summary Box */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-zinc-700" />
              Segregation of Duties (SOD) Invariants & Statutory Constraints
            </h2>
            <p className="text-xs text-zinc-600 mt-1">
              To prevent internal fraud and meet OIC Thailand audit obligations, the Policy Administration System (PAS)
              enforces structural separation between Maker (Initiator) and Checker (Approver) scopes. The system
              physically blocks identical UUIDs from executing state approvals (BRD GOV-02).
            </p>
          </div>

          {/* Conflict Alert Banner */}
          {detectedSODConflicts.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-amber-900">
                  {detectedSODConflicts.length} Role Scope Conflict(s) Detected
                </h3>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  The current matrix configuration assigns both Maker and Checker authority to the same operational role
                  group:
                </p>
                <div className="mt-2 space-y-1">
                  {detectedSODConflicts.map((c, idx) => (
                    <div key={idx} className="text-xs text-amber-900 flex items-center gap-2">
                      <span className="font-semibold text-zinc-900">[{c.roleName}]</span> violates{" "}
                      <span className="font-mono text-[11px] font-medium bg-amber-100 px-1 py-0.5 rounded">
                        {c.constraint.name}
                      </span>{" "}
                      (Combines <code className="text-zinc-800 font-bold">{c.constraint.maker_scope}</code> with{" "}
                      <code className="text-zinc-800 font-bold">{c.constraint.checker_scope}</code>)
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <div className="text-xs text-emerald-900">
                <span className="font-semibold">Zero Structural Conflicts:</span> All configured role permissions adhere
                to strict segregation boundaries.
              </div>
            </div>
          )}

          {/* Architectural Constraints Table */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50">
              <h3 className="text-xs font-semibold text-zinc-900">Systemic Guardrails Registry</h3>
              <p className="text-[11px] text-zinc-500">
                Mandatory rules enforced by the PAS API Gateway Middleware & ACID Transaction Blocks.
              </p>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
                  <th className="py-2.5 px-4 font-semibold w-24">Rule ID</th>
                  <th className="py-2.5 px-4 font-semibold w-48">Boundary Name</th>
                  <th className="py-2.5 px-4 font-semibold">Maker Scope (Initiator)</th>
                  <th className="py-2.5 px-4 font-semibold">Checker Scope (Gatekeeper)</th>
                  <th className="py-2.5 px-4 font-semibold">Enforcement Logic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800">
                {SOD_CONSTRAINTS.map((rule) => (
                  <tr key={rule.id} className="hover:bg-zinc-50/70">
                    <td className="py-3 px-4 font-mono font-medium text-zinc-700">{rule.id}</td>
                    <td className="py-3 px-4 font-medium text-zinc-900">{rule.name}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[11px] border border-zinc-200">
                        {rule.maker_scope}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[11px] border border-zinc-200">
                        {rule.checker_scope}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 text-[11px] leading-relaxed">{rule.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Modal: Create / Edit Staff User (Screen 8.6.2)                     */}
      {/* ------------------------------------------------------------------ */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-semibold text-zinc-900">
                  {editingUser ? "Edit Internal User Authorization" : "Create Internal Staff Account"}
                </h3>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name (English / Thai)</label>
                <input
                  type="text"
                  required
                  value={userFormData.full_name}
                  onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                  placeholder="e.g., Somchai Prasert"
                  className="w-full text-xs px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Corporate Email (Single Sign-On Anchor)
                </label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  placeholder="name@broker-pas.co.th"
                  className="w-full text-xs px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white font-mono"
                />
              </div>

              {/* Roles Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Assigned Operational Roles</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto border border-zinc-200 rounded-lg p-2.5 bg-zinc-50">
                  {INITIAL_ROLES.map((r) => {
                    const isChecked = userFormData.role_ids.includes(r.role_id);
                    return (
                      <label
                        key={r.role_id}
                        className="flex items-center gap-2 text-xs text-zinc-800 cursor-pointer hover:bg-zinc-100/80 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserFormData({
                                ...userFormData,
                                role_ids: [...userFormData.role_ids, r.role_id],
                              });
                            } else {
                              setUserFormData({
                                ...userFormData,
                                role_ids: userFormData.role_ids.filter((id) => id !== r.role_id),
                              });
                            }
                          }}
                          className="rounded text-zinc-900 focus:ring-zinc-900"
                        />
                        <span className="font-medium">{r.role_name}</span>
                        <span className="text-[10px] text-zinc-400">({r.description})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* PDPA PII Override Toggle (Screen 8.6.2) */}
              <div className="pt-2 border-t border-zinc-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                      PII Override Privilege (Thai PDPA)
                    </label>
                    <p className="text-[11px] text-zinc-500 leading-normal">
                      Permits user to click &ldquo;Reveal&rdquo; to decrypt Thai National IDs & phone numbers. Every
                      unmask action automatically writes an immutable log to <code>audit_logs</code>.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={userFormData.has_pii_unmask_override}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        has_pii_unmask_override: e.target.checked,
                      })
                    }
                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                </div>
              </div>

              {/* Status Switch */}
              <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-800">Account Active</span>
                  <p className="text-[11px] text-zinc-500">Deactivating revokes JWT session tokens immediately.</p>
                </div>
                <input
                  type="checkbox"
                  checked={userFormData.is_active}
                  onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800 bg-white border border-zinc-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md shadow-xs"
                >
                  {editingUser ? "Save User Privileges" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Footer Notes & Traceability Bar                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-400" />
            <span>
              Target Tables: <code>admin_users</code>, <code>roles</code>, <code>permissions</code>,{" "}
              <code>role_permissions</code>, <code>approval_requests</code> (BRD 6.8 & SDD 4.8)
            </span>
          </div>
          <span className="font-mono">API Version 2.0 (REST/JSON)</span>
        </div>
      </div>
    </div>
  );
};

export default AccessControlPage;
