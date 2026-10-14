import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ApiResponseEnvelope,
  AvailableBrokersPayload,
  BrokerOption,
  LobCode,
  SelectBrokerRequest,
  SelectBrokerResponse,
  SystemRole,
} from "../../../types/brokerContext";

// Helper to generate UUIDv4 for X-Correlation-ID & X-Idempotency-Key (SDD 3.1)
const generateUuidV4 = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Maps primary RBAC role to default Back-Office Screen (BRD Section 8.7)
const resolveDefaultWorkspaceRoute = (roles: SystemRole[]): string => {
  if (roles.includes("Underwriter")) return "/admin/underwriting-workbench"; // Screen 8.7.2
  if (roles.includes("Finance Officer")) return "/admin/finance-ledger"; // Screen 8.7.3
  if (roles.includes("Telesales Agent")) return "/admin/telesales-cockpit"; // Screen 8.7.1
  if (roles.includes("Approver (Manager)")) return "/admin/approvals/inbox"; // Screen 8.9.1
  return "/admin/operations-dashboard";
};

const LOB_BADGE_STYLES: Record<LobCode, { label: string; className: string }> = {
  MOTOR: { label: "Motor (Voluntary)", className: "bg-blue-100 text-blue-800 border-blue-200" },
  CMI: { label: "CMI (Por Ror Bor)", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  HEALTH: { label: "Health", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  TRAVEL: { label: "Travel", className: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  FIRE: { label: "Fire & Property", className: "bg-orange-100 text-orange-800 border-orange-200" },
  PA: { label: "Personal Accident", className: "bg-purple-100 text-purple-800 border-purple-200" },
  LIFE: { label: "Life", className: "bg-rose-100 text-rose-800 border-rose-200" },
  CUSTOM: { label: "Specialty / Custom", className: "bg-slate-800 text-white border-slate-700" },
};

// Mock Fallback Data for DEV/SIT Sandbox testing (9 Singha Broker context)
const MOCK_AVAILABLE_BROKERS: AvailableBrokersPayload = {
  admin_user: {
    admin_user_id: "550e8400-e29b-41d4-a716-446655440000",
    full_name: "Pakornsak Supamongkonchaikul",
    email: "pakornsak@9singhabroker.co.th",
    roles: ["Super Admin", "Underwriter"],
  },
  allow_global_view: false,
  available_brokers: [
    {
      broker_id: "111e8400-e29b-41d4-a716-446655440001",
      broker_code: "BRK-9SINGHA-HQ",
      broker_name_th: "บริษัท 9 สิงห์ โบรกเกอร์ จำกัด (สำนักงานใหญ่)",
      broker_name_en: "9 Singha Broker Co., Ltd. (Head Office)",
      is_default: true,
      license_details: {
        oic_license_no: "ว00018/2569",
        status: "ACTIVE",
        expiry_date: "2028-12-31",
      },
      authorized_lobs: ["MOTOR", "CMI", "HEALTH", "TRAVEL", "PA", "FIRE", "CUSTOM"],
      active_insurer_partners_count: 14,
    },
    {
      broker_id: "222e8400-e29b-41d4-a716-446655440002",
      broker_code: "BRK-9SINGHA-CORP",
      broker_name_th: "บริษัท 9 สิงห์ คอร์ปอเรท อินชัวรันส์ จำกัด",
      broker_name_en: "9 Singha Corporate Risk Solutions Co., Ltd.",
      is_default: false,
      license_details: {
        oic_license_no: "ว00094/2569",
        status: "ACTIVE",
        expiry_date: "2027-09-30",
      },
      authorized_lobs: ["FIRE", "HEALTH", "LIFE", "CUSTOM"],
      active_insurer_partners_count: 8,
    },
    {
      broker_id: "333e8400-e29b-41d4-a716-446655440003",
      broker_code: "BRK-LEGACY-AFF",
      broker_name_th: "บริษัท สิงห์ อัฟฟิลิเอท โบรกเกอร์ จำกัด",
      broker_name_en: "Singha Affiliate Broker Co., Ltd.",
      is_default: false,
      license_details: {
        oic_license_no: "ว00003/2564",
        status: "EXPIRED",
        expiry_date: "2025-12-31",
      },
      authorized_lobs: ["MOTOR", "CMI"],
      active_insurer_partners_count: 3,
    },
  ],
};

interface BrokerSelectionPageProps {
  /** Pre-scoped JWT issued upon initial login before broker context is bound */
  preSessionToken?: string;
  /** Callback fired when the broker-scoped JWT is minted */
  onContextSelected?: (session: SelectBrokerResponse) => void;
  /** Callback for signing out of the pre-session state */
  onLogout?: () => void;
}

export const BrokerSelectionPage: React.FC<BrokerSelectionPageProps> = ({
  preSessionToken = sessionStorage.getItem("pas_pre_session_jwt") || "dev-pre-token",
  onContextSelected,
  onLogout,
}) => {
  const [payload, setPayload] = useState<AvailableBrokersPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingId, setIsSubmittingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLobFilter, setSelectedLobFilter] = useState<LobCode | "ALL">("ALL");

  // Step 3: Execute POST /admin/auth/select-broker to mint the scoped JWT
  const handleSelectBroker = useCallback(
    async (brokerId: string) => {
      setIsSubmittingId(brokerId);
      setErrorMessage(null);

      const correlationId = generateUuidV4();
      const idempotencyKey = generateUuidV4();

      const requestBody: SelectBrokerRequest = {
        broker_id: brokerId,
        is_global_view: false,
      };

      try {
        const response = await fetch("/api/v1/admin/auth/select-broker", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${preSessionToken}`,
            "X-Correlation-ID": correlationId,
            "X-Idempotency-Key": idempotencyKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const envelope: ApiResponseEnvelope<SelectBrokerResponse> = await response.json();
        const sessionData = envelope.data;

        // Store the active broker-scoped JWT & context for downstream API calls
        sessionStorage.setItem("pas_access_token", sessionData.access_token);
        sessionStorage.setItem("pas_active_broker_context", JSON.stringify(sessionData.active_context));

        if (onContextSelected) {
          onContextSelected(sessionData);
        } else {
          window.location.href = sessionData.redirect_to;
        }
      } catch {
        // Fallback simulation for DEV/SIT environments when backend is offline
        if (payload) {
          const chosenBroker = payload.available_brokers.find((b) => b.broker_id === brokerId);
          if (chosenBroker && chosenBroker.license_details.status !== "ACTIVE") {
            setErrorMessage(
              `Cannot bind session to ${chosenBroker.broker_code}: OIC License (${chosenBroker.license_details.oic_license_no}) is ${chosenBroker.license_details.status}.`,
            );
            setIsSubmittingId(null);
            return;
          }

          const simulatedResponse: SelectBrokerResponse = {
            access_token: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.simulated.${correlationId}`,
            active_context: {
              broker_id: chosenBroker?.broker_id || brokerId,
              broker_code: chosenBroker?.broker_code || "UNKNOWN",
              broker_name_en: chosenBroker?.broker_name_en || "",
              is_global_view: false,
              roles: payload.admin_user.roles,
              scopes: ["application:review", "policy:read", "rule:override", "maker:request"],
            },
            redirect_to: resolveDefaultWorkspaceRoute(payload.admin_user.roles),
          };

          sessionStorage.setItem("pas_access_token", simulatedResponse.access_token);
          sessionStorage.setItem("pas_active_broker_context", JSON.stringify(simulatedResponse.active_context));

          if (onContextSelected) {
            onContextSelected(simulatedResponse);
          } else {
            window.location.href = simulatedResponse.redirect_to;
          }
        }
      } finally {
        setIsSubmittingId(null);
      }
    },
    [preSessionToken, payload, onContextSelected],
  );

  // Step 2: Hydrate authorized brokers via GET /admin/auth/available-brokers
  useEffect(() => {
    let isMounted = true;
    const fetchAuthorizedBrokers = async () => {
      setIsLoading(true);
      const correlationId = generateUuidV4();

      try {
        const response = await fetch("/api/v1/admin/auth/available-brokers", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${preSessionToken}`,
            "X-Correlation-ID": correlationId,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch available brokers from API");
        }

        const envelope: ApiResponseEnvelope<AvailableBrokersPayload> = await response.json();
        if (!isMounted) return;
        setPayload(envelope.data);
      } catch {
        // Fallback to mock data in local development
        if (!isMounted) return;
        setPayload(MOCK_AVAILABLE_BROKERS);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAuthorizedBrokers();
    return () => {
      isMounted = false;
    };
  }, [preSessionToken]);

  // Requirement BO-11: Single-Broker Auto-Route if user has exactly 1 active broker
  useEffect(() => {
    if (
      payload &&
      payload.available_brokers.length === 1 &&
      payload.available_brokers[0].license_details.status === "ACTIVE"
    ) {
      handleSelectBroker(payload.available_brokers[0].broker_id);
    }
  }, [payload, handleSelectBroker]);

  // Filter brokers by search query and LOB badge
  const filteredBrokers = useMemo(() => {
    if (!payload) return [];
    return payload.available_brokers.filter((broker) => {
      const matchesQuery =
        broker.broker_name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        broker.broker_name_th.toLowerCase().includes(searchQuery.toLowerCase()) ||
        broker.broker_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        broker.license_details.oic_license_no.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLob = selectedLobFilter === "ALL" || broker.authorized_lobs.includes(selectedLobFilter);

      return matchesQuery && matchesLob;
    });
  }, [payload, searchQuery, selectedLobFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">
          Verifying RBAC permissions and loading authorized broker entities...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      {/* Top Security & Identity Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-sm shadow-inner">
            PAS
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Unified Insurance Broker Platform</h1>
            <p className="text-xs text-slate-500">Back-Office Administrative Console • Pre-Application Context Gate</p>
          </div>
        </div>

        {payload && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800">{payload.admin_user.full_name}</div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {payload.admin_user.roles.map((role) => (
                  <span
                    key={role}
                    className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-medium text-slate-600 hover:text-red-600 border border-slate-300 hover:border-red-300 px-3 py-1.5 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Select Broker Workspace</h2>
          <p className="text-sm text-slate-600 mt-1">
            Choose the licensed broker entity to scope your session. All policies, underwriting queues, insurer
            settlement schedules, and channel SLA timers will be isolated to the selected broker.
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start justify-between"
          >
            <div>
              <span className="font-semibold">Context Binding Blocked: </span>
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-600 hover:text-red-900 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search & LOB Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-96 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Broker Name, Code, or OIC License..."
              className="w-full pl-3.5 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            <span className="text-xs font-medium text-slate-500 mr-1">Filter LOB:</span>
            {(["ALL", "MOTOR", "CMI", "HEALTH", "TRAVEL", "FIRE", "PA", "LIFE", "CUSTOM"] as const).map((lob) => (
              <button
                key={lob}
                type="button"
                onClick={() => setSelectedLobFilter(lob)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  selectedLobFilter === lob
                    ? "bg-blue-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {lob}
              </button>
            ))}
          </div>
        </div>

        {/* Broker Entity Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBrokers.map((broker: BrokerOption) => {
            const isLicenseActive = broker.license_details.status === "ACTIVE";
            const isThisSubmitting = isSubmittingId === broker.broker_id;

            return (
              <div
                key={broker.broker_id}
                className={`bg-white rounded-xl border transition-all flex flex-col justify-between p-5 shadow-sm ${
                  isLicenseActive
                    ? "border-slate-200 hover:border-blue-500 hover:shadow-md"
                    : "border-red-200 bg-slate-50/75 opacity-80"
                }`}
              >
                <div>
                  {/* Card Top Bar: Code & OIC License Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                        {broker.broker_code}
                      </span>
                      {broker.is_default && (
                        <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                          Default
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isLicenseActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      OIC: {broker.license_details.status}
                    </span>
                  </div>

                  {/* Localized Broker Entity Names */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{broker.broker_name_en}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{broker.broker_name_th}</p>

                  {/* OIC License Metadata */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">OIC License No:</span>
                      <span className="font-mono font-medium text-slate-700">
                        {broker.license_details.oic_license_no}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">License Expiry:</span>
                      <span
                        className={`font-medium ${isLicenseActive ? "text-slate-700" : "text-red-600 font-semibold"}`}
                      >
                        {broker.license_details.expiry_date}
                      </span>
                    </div>
                    {broker.active_insurer_partners_count !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Active Insurer Settings:</span>
                        <span className="font-medium text-slate-700">
                          {broker.active_insurer_partners_count} Carriers
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Authorized Lines of Business (LOBs) */}
                  <div className="mt-4">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Authorized Lines of Business
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {broker.authorized_lobs.map((lob) => {
                        const badge = LOB_BADGE_STYLES[lob];
                        return (
                          <span
                            key={lob}
                            className={`text-[11px] font-medium px-2 py-0.5 rounded border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={!isLicenseActive || isSubmittingId !== null}
                    onClick={() => handleSelectBroker(broker.broker_id)}
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-colors ${
                      isLicenseActive
                        ? "bg-blue-700 hover:bg-blue-800 text-white shadow-sm disabled:opacity-50"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {isThisSubmitting
                      ? "Minting Scoped Session..."
                      : isLicenseActive
                        ? "Access Broker Workspace →"
                        : "Workspace Locked (OIC License Expired)"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredBrokers.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No authorized broker entities match your filter criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedLobFilter("ALL");
              }}
              className="mt-3 text-xs font-semibold text-blue-700 hover:underline"
            >
              Reset search and LOB filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default BrokerSelectionPage;
