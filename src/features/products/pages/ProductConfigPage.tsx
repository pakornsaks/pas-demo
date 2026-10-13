import React, { useState, useEffect } from 'react';

// ==========================================
// 1. DATA CONTRACTS & TYPES (PAS SPEC)
// ==========================================

export type VersionStatus = 'DRAFT' | 'ACTIVE' | 'SCHEDULED' | 'ARCHIVED';
export type LobCode = 'MOTOR' | 'TRAVEL' | 'HEALTH' | 'FIRE' | 'CUSTOM';
export type PayeeType = 'BROKER' | 'INSURER' | 'THIRD_PARTY';
export type DeductType = 'FIXED_AMOUNT' | 'PERCENTAGE' | 'PER_CLAIM' | 'PER_YEAR';

export interface PlanBenefitVersion {
  version_id: string;
  benefit_id: string;
  benefit_code: string;
  coverage_name: string;
  limit_amount: number;
  effective_start_date: string;
  effective_end_date?: string | null;
}

export interface PlanBenefit {
  benefit_id: string;
  plan_id: string;
  active_version: PlanBenefitVersion;
}

export interface PlanVersion {
  version_id: string;
  plan_id: string;
  plan_code: string;
  name: string;
  status: VersionStatus;
  deductible_amount: number;
  deduct_type: DeductType;
  mandatory_excess_amount: number;
  is_promo_code_eligible: boolean;
  override_payee_type?: PayeeType | null;
  override_base_commission_percent?: number | null;
  effective_start_date: string;
  effective_end_date: string;
}

export interface Plan {
  plan_id: string;
  product_id: string;
  active_version: PlanVersion;
  benefits: PlanBenefit[];
}

export interface ProductVersion {
  version_id: string;
  product_id: string;
  product_code: string;
  status: VersionStatus;
  payee_type: PayeeType;
  base_insurer_commission_percent: number;
  payment_timing: 'BEFORE_ISSUANCE' | 'AFTER_ISSUANCE';
  effective_start_date: string;
  effective_end_date?: string | null;
}

export interface ProductMaster {
  product_id: string;
  insurer_id: string;
  lob_code: LobCode;
  active_version: ProductVersion;
  plans: Plan[];
}

export interface ApiResponseEnvelope<T> {
  data: T;
  meta: {
    timestamp: string;
    transaction_id: string;
    api_version: string;
  };
}

export const ProductPlanConfigPage: React.FC = () => {
  const [productData, setProductData] = useState<ProductMaster | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState<boolean>(false);

  // Initial Fetch (Module 1 - Catalog/Versions Endpoint)
  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        setIsLoading(true);
        // จำลองการเรียก API ตาม Standard Success Response Envelope ของ PAS
        const mockResponse: ApiResponseEnvelope<ProductMaster> = {
          data: {
            product_id: 'prod-001-uuid',
            insurer_id: 'ins-viriyah-001',
            lob_code: 'MOTOR',
            active_version: {
              version_id: 'ver-prod-101',
              product_id: 'prod-001-uuid',
              product_code: 'VIR-MOTOR-TYPE1',
              status: 'ACTIVE',
              payee_type: 'BROKER',
              base_insurer_commission_percent: 18.0,
              payment_timing: 'BEFORE_ISSUANCE',
              effective_start_date: '2026-01-01T00:00:00Z',
              effective_end_date: null
            },
            plans: [
              {
                plan_id: 'plan-gold-uuid',
                product_id: 'prod-001-uuid',
                active_version: {
                  version_id: 'ver-plan-201',
                  plan_id: 'plan-gold-uuid',
                  plan_code: 'PLN-GOLD-V1',
                  name: 'Type 1 Gold Package',
                  status: 'ACTIVE',
                  deductible_amount: 0.0,
                  deduct_type: 'FIXED_AMOUNT',
                  mandatory_excess_amount: 0.0,
                  is_promo_code_eligible: true,
                  effective_start_date: '2026-01-01T00:00:00Z',
                  effective_end_date: '2026-12-31T23:59:59Z'
                },
                benefits: [
                  {
                    benefit_id: 'ben-01-uuid',
                    plan_id: 'plan-gold-uuid',
                    active_version: {
                      version_id: 'ben-ver-301',
                      benefit_id: 'ben-01-uuid',
                      benefit_code: 'BEN_TPBI_PERSON',
                      coverage_name: 'ความรับผิดต่อชีวิต/ร่างกายบุคคลภายนอก (ต่อคน)',
                      limit_amount: 1000000.0,
                      effective_start_date: '2026-01-01T00:00:00Z'
                    }
                  },
                  {
                    benefit_id: 'ben-02-uuid',
                    plan_id: 'plan-gold-uuid',
                    active_version: {
                      version_id: 'ben-ver-302',
                      benefit_id: 'ben-02-uuid',
                      benefit_code: 'BEN_OWN_DAMAGE',
                      coverage_name: 'ความเสียหายต่อตัวรถยนต์ (ตามทุนประกัน)',
                      limit_amount: 850000.0,
                      effective_start_date: '2026-01-01T00:00:00Z'
                    }
                  }
                ]
              },
              {
                plan_id: 'plan-silver-uuid',
                product_id: 'prod-001-uuid',
                active_version: {
                  version_id: 'ver-plan-202',
                  plan_id: 'plan-silver-uuid',
                  plan_code: 'PLN-SILVER-V1',
                  name: 'Type 1 Silver Package (Deductible)',
                  status: 'ACTIVE',
                  deductible_amount: 3000.0,
                  deduct_type: 'PER_CLAIM',
                  mandatory_excess_amount: 0.0,
                  is_promo_code_eligible: true,
                  effective_start_date: '2026-01-01T00:00:00Z',
                  effective_end_date: '2026-12-31T23:59:59Z'
                },
                benefits: [
                  {
                    benefit_id: 'ben-03-uuid',
                    plan_id: 'plan-silver-uuid',
                    active_version: {
                      version_id: 'ben-ver-303',
                      benefit_id: 'ben-03-uuid',
                      benefit_code: 'BEN_TPBI_PERSON',
                      coverage_name: 'ความรับผิดต่อชีวิต/ร่างกายบุคคลภายนอก (ต่อคน)',
                      limit_amount: 500000.0,
                      effective_start_date: '2026-01-01T00:00:00Z'
                    }
                  }
                ]
              }
            ]
          },
          meta: {
            timestamp: new Date().toISOString(),
            transaction_id: 'tx_init_catalog_999',
            api_version: 'v1.2.0'
          }
        };

        setProductData(mockResponse.data);
        if (mockResponse.data.plans.length > 0) {
          setSelectedPlanId(mockResponse.data.plans[0].plan_id);
        }
      } catch (error) {
        console.error('Failed to hydrate catalog:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalogData();
  }, []);

  // BRD Rule BO-01: Clone New Draft workflow (ป้องกันการแก้ไขทับแถว ACTIVE ตรง ๆ)
  const handleCloneNewDraft = async () => {
    if (!productData) return;
    try {
      setIsSubmittingDraft(true);
      // POST /admin/approvals/request -> Snapshot Copy-on-Write
      alert(`Staged DRAFT version request for Product: ${productData.active_version.product_code}. Forwarded to Checker Queue.`);
    } catch (err) {
      console.error('Clone Draft Error:', err);
    } finally {
      setIsSubmittingDraft(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-slate-500">Loading Catalog Hierarchy...</div>;
  }

  if (!productData) {
    return <div className="p-8 text-rose-600">Error: Product record not found.</div>;
  }

  const activePlan = productData.plans.find((p) => p.plan_id === selectedPlanId);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      {/* Header Bar */}
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{productData.active_version.product_code}</h1>
            <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {productData.active_version.status}
            </span>
            <span className="rounded bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
              LOB: {productData.lob_code}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Product UUID: {productData.product_id} | Effective From:{' '}
            {new Date(productData.active_version.effective_start_date).toLocaleDateString()}
          </p>
        </div>

        {/* Action Button: Clone & Swap Stage */}
        <button
          onClick={handleCloneNewDraft}
          disabled={isSubmittingDraft}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-400"
        >
          {isSubmittingDraft ? 'Staging...' : 'Clone New Draft (Maker)'}
        </button>
      </header>

      {/* Global Product Configurations (Inherited Defaults) */}
      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Base Product Level Configuration (Inherited Defaults)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">Payee Type Routing</label>
            <p className="font-medium text-slate-800">{productData.active_version.payee_type}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500">Base Insurer Commission</label>
            <p className="font-medium text-slate-800">
              {productData.active_version.base_insurer_commission_percent.toFixed(2)}%
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-500">Payment Timing Constraint</label>
            <p className="font-medium text-slate-800">{productData.active_version.payment_timing}</p>
          </div>
        </div>
      </section>

      {/* Plan Tiers Tab Navigation */}
      <div className="mb-4 border-b border-slate-200">
        <nav className="-mb-px flex space-x-4">
          {productData.plans.map((plan) => {
            const isSelected = plan.plan_id === selectedPlanId;
            return (
              <button
                key={plan.plan_id}
                onClick={() => setSelectedPlanId(plan.plan_id)}
                className={`border-b-2 py-2 px-3 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {plan.active_version.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Plan Detail & Benefits Grid */}
      {activePlan && (
        <div className="space-y-6">
          {/* Plan Settings Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">
                Plan Configuration: {activePlan.active_version.plan_code}
              </h3>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                Plan ID: {activePlan.plan_id}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="text-xs text-slate-500">Deductible Amount</label>
                <p className="font-medium text-slate-800">
                  THB {activePlan.active_version.deductible_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-500">Deductible Type</label>
                <p className="font-medium text-slate-800">{activePlan.active_version.deduct_type}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500">Mandatory Excess</label>
                <p className="font-medium text-slate-800">
                  THB {activePlan.active_version.mandatory_excess_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-500">Promo Code Eligibility</label>
                <p className="font-medium text-slate-800">
                  {activePlan.active_version.is_promo_code_eligible ? 'Eligible' : 'Locked'}
                </p>
              </div>
            </div>
          </div>

          {/* Plan Benefits Table (Comparison Grid Builder) */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800">
                Comparison Grid: Coverage Limits & Benefits
              </h3>
              <p className="text-xs text-slate-500">
                Source: plan_benefits & plan_benefit_versions (SCD Type 2 Timeline)
              </p>
            </div>
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-3">Benefit Code</th>
                  <th scope="col" className="px-6 py-3">Coverage Name</th>
                  <th scope="col" className="px-6 py-3 text-right">Limit Amount (THB)</th>
                  <th scope="col" className="px-6 py-3 text-center">Effective Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {activePlan.benefits.map((item) => (
                  <tr key={item.benefit_id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-600">
                      {item.active_version.benefit_code}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {item.active_version.coverage_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-slate-900">
                      {item.active_version.limit_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-xs text-slate-500">
                      {new Date(item.active_version.effective_start_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {activePlan.benefits.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No coverage benefits configured for this plan version.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPlanConfigPage;