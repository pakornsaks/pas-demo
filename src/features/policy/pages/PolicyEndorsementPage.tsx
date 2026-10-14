import React, { useMemo, useState } from "react";

// ============================================================================
// 1. DATA CONTRACTS & TYPE DEFINITIONS (Aligned with PAS SDD & BRD)
// ============================================================================

export type EndorsementType = "TYPE_A" | "TYPE_B" | "TYPE_C";

export interface CustomerData {
  customer_id: string;
  legal_name: string;
  phone_number: string; // Masked per PDPA e.g. 081-XXX-8899
  id_card_number: string; // Masked e.g. 1-1004-XXXXX-88-9
  email: string;
}

export interface MotorRiskExtension {
  license_plate_number: string;
  chassis_number: string;
  sum_insured: number;
}

export interface PolicyVersionRecord {
  version_id: string;
  policy_id: string;
  version_number: number;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  endorsement_type?: EndorsementType;
  endorsement_reason?: string;
  pro_rata_premium_delta: number;
  base_premium: number;
  effective_start_date: string;
  effective_end_date: string | null;
  created_by: string;
  created_at: string;
  motor_data: MotorRiskExtension;
}

export interface PolicyMasterHeader {
  policy_id: string;
  policy_number: string;
  status: "ACTIVE" | "CANCELLED" | "SUSPENDED";
  channel_id: number;
  channel_name: string;
  insurer_name: string;
  product_name: string;
  active_version: PolicyVersionRecord;
  customer: CustomerData;
}

export interface EndorsementDraftPayload {
  endorsement_type: EndorsementType;
  effective_date: string;
  endorsement_reason: string;
  is_premium_impacted: boolean;
  modified_data: {
    customer?: Partial<CustomerData>;
    motor?: Partial<MotorRiskExtension>;
  };
}

export interface EndorsementResponse {
  policy_id: string;
  version_id: string;
  status: "ACTIVE" | "APPROVED_WAITING_PAYMENT";
  financial_impact: {
    type: "ADDITIONAL_PREMIUM" | "RETURN_PREMIUM" | "NONE";
    amount_thb: number;
  };
}

// ============================================================================
// 2. MOCK DATA (Initial State for Demonstration)
// ============================================================================

const INITIAL_POLICY: PolicyMasterHeader = {
  policy_id: "pol-550e8400-e29b-41d4-a716-446655440001",
  policy_number: "VRY-MTR-2026-00892",
  status: "ACTIVE",
  channel_id: 1,
  channel_name: "Telesales",
  insurer_name: "Viriyah Insurance",
  product_name: "Motor Type 1 Comprehensive",
  customer: {
    customer_id: "cust-uuid-1001",
    legal_name: "Somchai Prasertying",
    phone_number: "081-XXX-4921",
    id_card_number: "1-1004-XXXXX-88-9",
    email: "somchai.p@example.com",
  },
  active_version: {
    version_id: "ver-uuid-0001",
    policy_id: "pol-550e8400-e29b-41d4-a716-446655440001",
    version_number: 1,
    status: "ACTIVE",
    endorsement_reason: "ORIGINAL_ISSUANCE",
    pro_rata_premium_delta: 0,
    base_premium: 18500.0,
    effective_start_date: "2026-01-01T00:00:00Z",
    effective_end_date: null,
    created_by: "system-issuance-job",
    created_at: "2026-01-01T00:00:00Z",
    motor_data: {
      license_plate_number: "3ขข-8921 กทม.",
      chassis_number: "MRH-FC1-8892104-TH",
      sum_insured: 650000.0,
    },
  },
};

// ============================================================================
// 3. MAIN COMPONENT: PolicyEndorsementPage
// ============================================================================

export const PolicyEndorsementPage: React.FC = () => {
  const [policy, setPolicy] = useState<PolicyMasterHeader>(INITIAL_POLICY);
  const [versionHistory, setVersionHistory] = useState<PolicyVersionRecord[]>([INITIAL_POLICY.active_version]);

  // Form State
  const [endorsementType, setEndorsementType] = useState<EndorsementType>("TYPE_B");
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState<string>("CORRECT_LICENSE_PLATE");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [stagedResponse, setStagedResponse] = useState<EndorsementResponse | null>(null);

  // Editable Form Inputs
  const [formCustomerName, setFormCustomerName] = useState(policy.customer.legal_name);
  const [formCustomerEmail, setFormCustomerEmail] = useState(policy.customer.email);
  const [formLicensePlate, setFormLicensePlate] = useState(policy.active_version.motor_data.license_plate_number);
  const [formChassisNumber, setFormChassisNumber] = useState(policy.active_version.motor_data.chassis_number);
  const [formSumInsured, setFormSumInsured] = useState<number>(policy.active_version.motor_data.sum_insured);

  // Pro-rata premium calculator simulation
  const calculatedProRata = useMemo(() => {
    if (endorsementType !== "TYPE_C") {
      return { delta: 0, type: "NONE" as const };
    }
    const currentSum = policy.active_version.motor_data.sum_insured;
    const diffSum = formSumInsured - currentSum;
    if (diffSum === 0) return { delta: 0, type: "NONE" as const };

    // Standard actuary calculation simulation (approx. 1.2% rate prorated over 180 days)
    const annualPremiumDelta = diffSum * 0.018;
    const proRataAmount = Math.round(annualPremiumDelta * (180 / 365) * 100) / 100;

    if (proRataAmount > 0) {
      return { delta: proRataAmount, type: "ADDITIONAL_PREMIUM" as const };
    } else {
      return { delta: Math.abs(proRataAmount), type: "RETURN_PREMIUM" as const };
    }
  }, [endorsementType, formSumInsured, policy.active_version.motor_data.sum_insured]);

  // Handle Endorsement Type Change & defaults
  const handleTypeSelect = (type: EndorsementType) => {
    setEndorsementType(type);
    if (type === "TYPE_A") setReason("CUSTOMER_REQUEST_ADDRESS_UPDATE");
    if (type === "TYPE_B") setReason("CORRECT_TYPO_LICENSE_PLATE");
    if (type === "TYPE_C") setReason("SUM_INSURED_INCREASE");
  };

  // Submit MTA Request (POST /policies/{id}/endorse)
  const handleSubmitEndorsement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: EndorsementDraftPayload = {
      endorsement_type: endorsementType,
      effective_date: `${effectiveDate}T00:00:00Z`,
      endorsement_reason: reason,
      is_premium_impacted: endorsementType === "TYPE_C",
      modified_data: {
        ...(endorsementType === "TYPE_A" && {
          customer: {
            legal_name: formCustomerName,
            email: formCustomerEmail,
          },
        }),
        ...((endorsementType === "TYPE_B" || endorsementType === "TYPE_C") && {
          motor: {
            license_plate_number: formLicensePlate,
            chassis_number: formChassisNumber,
            sum_insured: Number(formSumInsured),
          },
        }),
      },
    };

    // Simulated API call (POST /policies/{policy_id}/endorse)
    setTimeout(() => {
      const isAP = calculatedProRata.type === "ADDITIONAL_PREMIUM";
      const mockResult: EndorsementResponse = {
        policy_id: policy.policy_id,
        version_id: `ver-uuid-000${versionHistory.length + 1}`,
        status: isAP ? "APPROVED_WAITING_PAYMENT" : "ACTIVE",
        financial_impact: {
          type: calculatedProRata.type,
          amount_thb: calculatedProRata.delta,
        },
      };

      setStagedResponse(mockResult);

      // If Non-financial (Type B) or Return Premium (Type C refund handled via credit queue),
      // Clone & Swap activates instantly.
      if (!isAP) {
        executeCloneAndSwapActivation(mockResult.version_id, payload, mockResult.financial_impact.amount_thb);
      }
      setIsSubmitting(false);
    }, 600);
  };

  // Complete Clone & Swap in State (Simulating DB ACID swap)
  const executeCloneAndSwapActivation = (
    newVersionId: string,
    payload: EndorsementDraftPayload,
    premiumDelta: number,
  ) => {
    const timestamp = new Date().toISOString();
    const newVersionNumber = policy.active_version.version_number + 1;

    // 1. Cap old active version
    const cappedOldVersion: PolicyVersionRecord = {
      ...policy.active_version,
      status: "ARCHIVED",
      effective_end_date: timestamp,
    };

    // 2. Hydrate new cloned active version
    const newlyActiveVersion: PolicyVersionRecord = {
      version_id: newVersionId,
      policy_id: policy.policy_id,
      version_number: newVersionNumber,
      status: "ACTIVE",
      endorsement_type: payload.endorsement_type,
      endorsement_reason: payload.endorsement_reason,
      pro_rata_premium_delta: premiumDelta,
      base_premium: policy.active_version.base_premium + (payload.endorsement_type === "TYPE_C" ? premiumDelta : 0),
      effective_start_date: timestamp,
      effective_end_date: null,
      created_by: "ops-maker-uuid-889",
      created_at: timestamp,
      motor_data: {
        license_plate_number:
          payload.modified_data.motor?.license_plate_number ?? policy.active_version.motor_data.license_plate_number,
        chassis_number: payload.modified_data.motor?.chassis_number ?? policy.active_version.motor_data.chassis_number,
        sum_insured: payload.modified_data.motor?.sum_insured ?? policy.active_version.motor_data.sum_insured,
      },
    };

    // 3. Update Policy Master Container
    setPolicy((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        ...(payload.modified_data.customer?.legal_name && {
          legal_name: payload.modified_data.customer.legal_name,
        }),
        ...(payload.modified_data.customer?.email && {
          email: payload.modified_data.customer.email,
        }),
      },
      active_version: newlyActiveVersion,
    }));

    // 4. Prepend to Version History Timeline
    setVersionHistory([newlyActiveVersion, cappedOldVersion, ...versionHistory.slice(1)]);
  };

  // Payment Settlement Confirmation (POST /policies/{policy_id}/endorse/confirm-payment)
  const handleConfirmAPPayment = () => {
    if (!stagedResponse) return;
    setIsSubmitting(true);

    setTimeout(() => {
      executeCloneAndSwapActivation(
        stagedResponse.version_id,
        {
          endorsement_type: endorsementType,
          effective_date: effectiveDate,
          endorsement_reason: reason,
          is_premium_impacted: true,
          modified_data: {
            motor: {
              license_plate_number: formLicensePlate,
              chassis_number: formChassisNumber,
              sum_insured: Number(formSumInsured),
            },
          },
        },
        stagedResponse.financial_impact.amount_thb,
      );
      setStagedResponse(null);
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="w-full min-h-screen text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ==================================================================== */}
        {/* HEADER SECTION                                                       */}
        {/* ==================================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">Policy Endorsement</h1>
            <p className="text-sm text-slate-500">
              Implements immutable Clone & Swap methodology. Modifying active risks creates a new version snapshot.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-medium">Policy Number</p>
              <p className="font-mono font-bold text-slate-800">{policy.policy_number}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Current Version</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700">
                v{policy.active_version.version_number} (ACTIVE)
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* POLICY SUMMARY & INSURED CARD                                         */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Insured Metadata */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
              Insured Information (PDPA Encrypted)
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Legal Name:</span>
                <span className="font-semibold text-slate-800">{policy.customer.legal_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Citizen ID:</span>
                <span className="font-mono text-slate-700">{policy.customer.id_card_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-slate-700">{policy.customer.phone_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-700">{policy.customer.email}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Active Asset Risk (Motor Extension) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
              Active Risk Blueprint (v{policy.active_version.version_number})
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">License Plate:</span>
                <span className="font-semibold text-slate-800">
                  {policy.active_version.motor_data.license_plate_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chassis No:</span>
                <span className="font-mono text-xs text-slate-700">
                  {policy.active_version.motor_data.chassis_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sum Insured:</span>
                <span className="font-semibold text-emerald-600">
                  THB {policy.active_version.motor_data.sum_insured.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Base Premium:</span>
                <span className="font-mono text-slate-800">
                  THB {policy.active_version.base_premium.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Governance Metadata */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
              Contract Timeline & Origin
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Sales Channel:</span>
                <span className="font-medium text-slate-800">
                  {policy.channel_name} (ID: {policy.channel_id})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Underwriting Carrier:</span>
                <span className="font-medium text-slate-800">{policy.insurer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Version Active Since:</span>
                <span className="font-mono text-xs text-slate-600">
                  {new Date(policy.active_version.effective_start_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Master Status:</span>
                <span className="font-bold text-emerald-600">{policy.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* MTA MAKER FORM & DIFF ENGINE                                          */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: MTA Parameter Specification (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Stage Endorsement (Clone & Modify)</h2>
              <p className="text-xs text-slate-500">Choose modification class per OIC regulatory guidelines.</p>
            </div>

            {/* Endorsement Class Selection */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTypeSelect("TYPE_A")}
                className={`p-3 text-left rounded-lg border transition-all ${
                  endorsementType === "TYPE_A"
                    ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="text-xs font-bold text-indigo-900">Type A</div>
                <div className="text-xs text-slate-500 mt-1">Customer Demographics</div>
                <div className="text-[10px] text-emerald-600 font-medium mt-1">Non-Risk Impact</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect("TYPE_B")}
                className={`p-3 text-left rounded-lg border transition-all ${
                  endorsementType === "TYPE_B"
                    ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="text-xs font-bold text-indigo-900">Type B</div>
                <div className="text-xs text-slate-500 mt-1">Asset Correction</div>
                <div className="text-[10px] text-emerald-600 font-medium mt-1">Delta = 0.00 THB</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect("TYPE_C")}
                className={`p-3 text-left rounded-lg border transition-all ${
                  endorsementType === "TYPE_C"
                    ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="text-xs font-bold text-indigo-900">Type C</div>
                <div className="text-xs text-slate-500 mt-1">Financial Variation</div>
                <div className="text-[10px] text-amber-600 font-medium mt-1">AP / RP Triggered</div>
              </button>
            </div>

            <form onSubmit={handleSubmitEndorsement} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Effective Date (ISO-8601)</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Endorsement Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {endorsementType === "TYPE_A" && (
                      <>
                        <option value="CUSTOMER_REQUEST_ADDRESS_UPDATE">Customer Relocation</option>
                        <option value="NAME_CHANGE_LEGAL">Legal Name Change</option>
                      </>
                    )}
                    {endorsementType === "TYPE_B" && (
                      <>
                        <option value="CORRECT_TYPO_LICENSE_PLATE">Typo Correction: License Plate</option>
                        <option value="CORRECT_TYPO_CHASSIS">Typo Correction: Chassis Number</option>
                      </>
                    )}
                    {endorsementType === "TYPE_C" && (
                      <>
                        <option value="SUM_INSURED_INCREASE">Sum Insured Upgrade</option>
                        <option value="SUM_INSURED_DECREASE">Sum Insured Downscale</option>
                        <option value="ACCESSORY_ADDITION">Add Special Equipment</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Dynamic Field Inputs depending on Endorsement Type */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Target Field Modifications
                </h3>

                {endorsementType === "TYPE_A" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Insured Legal Name</label>
                      <input
                        type="text"
                        value={formCustomerName}
                        onChange={(e) => setFormCustomerName(e.target.value)}
                        className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Insured Email</label>
                      <input
                        type="email"
                        value={formCustomerEmail}
                        onChange={(e) => setFormCustomerEmail(e.target.value)}
                        className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {(endorsementType === "TYPE_B" || endorsementType === "TYPE_C") && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">License Plate Number</label>
                        <input
                          type="text"
                          value={formLicensePlate}
                          onChange={(e) => setFormLicensePlate(e.target.value)}
                          className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Chassis Number</label>
                        <input
                          type="text"
                          value={formChassisNumber}
                          onChange={(e) => setFormChassisNumber(e.target.value)}
                          className="w-full text-sm font-mono border border-slate-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {endorsementType === "TYPE_C" && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Coverage Sum Insured (THB)
                        </label>
                        <input
                          type="number"
                          step="10000"
                          value={formSumInsured}
                          onChange={(e) => setFormSumInsured(Number(e.target.value))}
                          className="w-full text-sm font-semibold text-indigo-700 border border-slate-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] text-slate-500">
                          Adjusting coverage triggers Pro-Rata Additional Premium (AP) or Return Premium (RP).
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                >
                  {isSubmitting ? "Staging MTA..." : "Preview & Submit MTA"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: Side-by-Side Diff Viewer & AP Handshake (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Diff Viewer Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">Pre-Execution Diff Inspector</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  v{policy.active_version.version_number} &rarr; v{policy.active_version.version_number + 1} (Draft)
                </span>
              </div>

              <div className="text-xs space-y-3">
                {/* Diff Item 1: License Plate */}
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-500 block mb-1">License Plate Number:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="line-through text-red-600 bg-red-50 p-1 rounded font-mono">
                      {policy.active_version.motor_data.license_plate_number}
                    </span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 p-1 rounded font-mono">
                      {formLicensePlate}
                    </span>
                  </div>
                </div>

                {/* Diff Item 2: Sum Insured */}
                {endorsementType === "TYPE_C" && (
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-500 block mb-1">Sum Insured:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="line-through text-red-600 bg-red-50 p-1 rounded">
                        {policy.active_version.motor_data.sum_insured.toLocaleString()} THB
                      </span>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 p-1 rounded">
                        {formSumInsured.toLocaleString()} THB
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Impact Breakdown */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Calculated Financial Delta:</span>
                  <span
                    className={`font-bold font-mono ${
                      calculatedProRata.type === "ADDITIONAL_PREMIUM"
                        ? "text-amber-600"
                        : calculatedProRata.type === "RETURN_PREMIUM"
                          ? "text-blue-600"
                          : "text-slate-700"
                    }`}
                  >
                    {calculatedProRata.type === "ADDITIONAL_PREMIUM" && "+"}
                    {calculatedProRata.type === "RETURN_PREMIUM" && "-"}
                    THB {calculatedProRata.delta.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Accounting Event: {calculatedProRata.type}</p>
              </div>
            </div>

            {/* Handshake Card (If Waiting Payment) */}
            {stagedResponse && stagedResponse.status === "APPROVED_WAITING_PAYMENT" && (
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl space-y-4">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 text-amber-800 mb-1">
                    Payment Gateway Lock
                  </span>
                  <h4 className="text-sm font-bold text-amber-900">Additional Premium (AP) Requires Settlement</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Under SDD Rule 5.7, Type C adjustments with Additional Premium cannot execute the version activation
                    swap until payment is settled.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-200 flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">AP Due Amount:</span>
                  <span className="font-mono font-bold text-amber-700 text-base">
                    THB {stagedResponse.financial_impact.amount_thb.toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmAPPayment}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition shadow-sm"
                >
                  {isSubmitting ? "Confirming Ledger..." : "Confirm Gateway Settlement & Swap Version"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SCD TYPE 2 VERSION AUDIT TRAIL (Timeline View)                       */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                SCD Type 2 Historical Version Timeline (Audit Trail)
              </h2>
              <p className="text-xs text-slate-500">
                Chained historical records fetched from GET /policies/{"{policy_id}"}/versions. Active records are never
                overwritten.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Total Versions: {versionHistory.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Version</th>
                  <th className="px-6 py-3">State</th>
                  <th className="px-6 py-3">Reason / Scope</th>
                  <th className="px-6 py-3">License Plate</th>
                  <th className="px-6 py-3">Sum Insured</th>
                  <th className="px-6 py-3">Premium Delta</th>
                  <th className="px-6 py-3">Effective Window</th>
                  <th className="px-6 py-3">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {versionHistory.map((ver) => (
                  <tr key={ver.version_id} className={ver.status === "ACTIVE" ? "bg-blue-50/40" : "bg-white"}>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">v{ver.version_number}</td>
                    <td className="px-6 py-4">
                      {ver.status === "ACTIVE" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                          ARCHIVED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">
                        {ver.endorsement_type ? `[${ver.endorsement_type}] ` : ""}
                        {ver.endorsement_reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700">{ver.motor_data.license_plate_number}</td>
                    <td className="px-6 py-4 font-mono text-slate-700">
                      THB {ver.motor_data.sum_insured.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {ver.pro_rata_premium_delta > 0 ? (
                        <span className="text-amber-600">+{ver.pro_rata_premium_delta.toLocaleString()}</span>
                      ) : ver.pro_rata_premium_delta < 0 ? (
                        <span className="text-blue-600">{ver.pro_rata_premium_delta.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400">0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600">
                      <div>From: {new Date(ver.effective_start_date).toLocaleString()}</div>
                      <div>
                        To:{" "}
                        {ver.effective_end_date ? (
                          new Date(ver.effective_end_date).toLocaleString()
                        ) : (
                          <span className="text-emerald-600 font-semibold">Open (Indefinite)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">{ver.created_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyEndorsementPage;
