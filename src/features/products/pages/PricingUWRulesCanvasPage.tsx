import React, { useState } from 'react';
import {
  Sliders,
  GitBranch,
  Plus,
  Trash2,
  Play,
  Save,
  Send,
  Info,
  Zap,
} from 'lucide-react';

// ============================================================================
// Types & Domain Entities (PAS Schema Alignment)
// ============================================================================

export type LOBType = 'MOTOR' | 'HEALTH' | 'PA' | 'FIRE' | 'TRAVEL' | 'CUSTOM';

export type RuleField =
  | 'vehicle.age_years'
  | 'vehicle.sum_insured_ratio'
  | 'vehicle.is_modified'
  | 'driver.age'
  | 'health.bmi'
  | 'health.is_smoker'
  | 'pa.occupation_class'
  | 'pa.has_motorcycle_risk';

export type ComparisonOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'IN'
  | 'BETWEEN';

export type LogicalOperator = 'AND' | 'OR';

export type EnforcementAction =
  | 'AUTO_APPROVE'       // Green Channel (APPROVED_WAITING_PAYMENT)
  | 'REFER'              // Yellow Channel (PENDING_REVIEW)
  | 'REJECT'             // Red Channel (Hard decline)
  | 'APPLY_LOADING';     // Rated Counter-Offer (QUOTATION_RATED)

export interface RuleCondition {
  id: string;
  field: RuleField;
  operator: ComparisonOperator;
  value: string | number;
  valueSecondary?: string | number; // For BETWEEN
}

export interface RuleGroup {
  id: string;
  logicalOperator: LogicalOperator;
  conditions: RuleCondition[];
}

export interface RuleAction {
  enforcement: EnforcementAction;
  basePremiumFormula?: string;
  loadingPercent: number;
  loadingAmountThb: number;
  deductibleOverrideThb?: number;
  referralTemplateRequired?: string; // Required documents / questions
  internalNotes: string;
  policyExclusionClause?: string;     // Red text clause on PDF schedule
}

export interface CanvasRuleNode {
  id: string;
  ruleCode: string;
  name: string;
  priorityOrder: number;
  isOverridden: boolean; // True if Plan-level override (Blue highlight per BO-03)
  conditionGroup: RuleGroup;
  action: RuleAction;
}

// ============================================================================
// Initial Mock Data (Reflecting Viriyah Motor & Health Scenarios)
// ============================================================================

const INITIAL_RULES: CanvasRuleNode[] = [
  {
    id: 'rule-node-101',
    ruleCode: 'URE-MTR-01',
    name: 'Young Driver Risk Loading',
    priorityOrder: 1,
    isOverridden: true, // Overridden at Plan level
    conditionGroup: {
      id: 'grp-1',
      logicalOperator: 'AND',
      conditions: [
        {
          id: 'cond-1-1',
          field: 'driver.age',
          operator: 'LESS_THAN',
          value: 22,
        },
      ],
    },
    action: {
      enforcement: 'APPLY_LOADING',
      loadingPercent: 15.0,
      loadingAmountThb: 0,
      internalNotes: 'Young driver actuarial index loading (+15% base)',
      policyExclusionClause: '',
    },
  },
  {
    id: 'rule-node-102',
    ruleCode: 'URE-MTR-02',
    name: 'Aging Vehicle Referral (Yellow Channel)',
    priorityOrder: 2,
    isOverridden: false, // Inherited from Product Master
    conditionGroup: {
      id: 'grp-2',
      logicalOperator: 'AND',
      conditions: [
        {
          id: 'cond-2-1',
          field: 'vehicle.age_years',
          operator: 'GREATER_THAN',
          value: 10,
        },
      ],
    },
    action: {
      enforcement: 'REFER',
      loadingPercent: 0,
      loadingAmountThb: 0,
      referralTemplateRequired: 'MTR_CAR_4_CORNERS_INSPECTION_PHOTO',
      internalNotes: 'Automated lock to PENDING_REVIEW; requires physical garage inspection review.',
      policyExclusionClause: 'Subject to mechanical pre-inspection verification',
    },
  },
  {
    id: 'rule-node-103',
    ruleCode: 'URE-MTR-03',
    name: 'Performance Modified Suspension Hard Stop',
    priorityOrder: 3,
    isOverridden: false,
    conditionGroup: {
      id: 'grp-3',
      logicalOperator: 'AND',
      conditions: [
        {
          id: 'cond-3-1',
          field: 'vehicle.is_modified',
          operator: 'EQUALS',
          value: 'true',
        },
      ],
    },
    action: {
      enforcement: 'REJECT',
      loadingPercent: 0,
      loadingAmountThb: 0,
      internalNotes: 'Hard Stop: Street-racing and aftermarket performance modifications breach underwriting guidelines.',
      policyExclusionClause: '',
    },
  },
];

// ============================================================================
// Main Component
// ============================================================================

export const PricingUWRulesCanvasPage: React.FC = () => {
  // Navigation / Product Header State
  const [selectedLob] = useState<LOBType>('MOTOR');
  const [productCode] = useState('P-VIRIYAH-MTR-T1');
  const [planCode] = useState('PLAN-GOLD-2026');
  const [productVersion] = useState('v2.1 (Active)');
  const [draftVersion] = useState('v2.2-draft');
  const [inheritFromProduct, setInheritFromProduct] = useState<boolean>(false);

  // Canvas State
  const [rules, setRules] = useState<CanvasRuleNode[]>(INITIAL_RULES);
  const [selectedRuleId, setSelectedRuleId] = useState<string>(INITIAL_RULES[0].id);

  // Simulator Drawer State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simAge, setSimAge] = useState<number>(20);
  const [simCarAge, setSimCarAge] = useState<number>(7);
  const [simIsModified, setSimIsModified] = useState<boolean>(false);
  const [simBasePremium, setSimBasePremium] = useState<number>(18000);
  const [simResult, setSimResult] = useState<{
    status: EnforcementAction;
    grossPremium: number;
    vat: number;
    stamp: number;
    messages: string[];
  } | null>(null);

  // Active Rule Selector
  const activeRule = rules.find((r) => r.id === selectedRuleId) || rules[0];

  // Handlers for Rule Manipulation
  const handleToggleInheritance = () => {
    setInheritFromProduct(!inheritFromProduct);
  };

  const handleUpdateActiveAction = (updatedAction: Partial<RuleAction>) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === activeRule.id
          ? {
              ...r,
              isOverridden: true, // Mutating flags it as a Plan override (BO-03)
              action: { ...r.action, ...updatedAction },
            }
          : r
      )
    );
  };

  const handleAddCondition = () => {
    const newCondition: RuleCondition = {
      id: `cond-${Date.now()}`,
      field: 'driver.age',
      operator: 'GREATER_THAN',
      value: 25,
    };
    setRules((prev) =>
      prev.map((r) =>
        r.id === activeRule.id
          ? {
              ...r,
              isOverridden: true,
              conditionGroup: {
                ...r.conditionGroup,
                conditions: [...r.conditionGroup.conditions, newCondition],
              },
            }
          : r
      )
    );
  };

  const handleRemoveCondition = (condId: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === activeRule.id
          ? {
              ...r,
              isOverridden: true,
              conditionGroup: {
                ...r.conditionGroup,
                conditions: r.conditionGroup.conditions.filter((c) => c.id !== condId),
              },
            }
          : r
      )
    );
  };

  const handleUpdateCondition = (condId: string, partial: Partial<RuleCondition>) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === activeRule.id
          ? {
              ...r,
              isOverridden: true,
              conditionGroup: {
                ...r.conditionGroup,
                conditions: r.conditionGroup.conditions.map((c) =>
                  c.id === condId ? { ...c, ...partial } : c
                ),
              },
            }
          : r
      )
    );
  };

  const handleAddNewRule = () => {
    const newRule: CanvasRuleNode = {
      id: `rule-node-${Date.now()}`,
      ruleCode: `URE-CUSTOM-${rules.length + 1}`,
      name: 'New Custom Underwriting Rule',
      priorityOrder: rules.length + 1,
      isOverridden: true,
      conditionGroup: {
        id: `grp-${Date.now()}`,
        logicalOperator: 'AND',
        conditions: [
          {
            id: `cond-new-${Date.now()}`,
            field: 'vehicle.age_years',
            operator: 'GREATER_THAN',
            value: 8,
          },
        ],
      },
      action: {
        enforcement: 'AUTO_APPROVE',
        loadingPercent: 0,
        loadingAmountThb: 0,
        internalNotes: 'Drafted via Visual Canvas',
      },
    };
    setRules([...rules, newRule]);
    setSelectedRuleId(newRule.id);
  };

  // Dry Run Evaluator (Local Engine Simulation)
  const runSimulator = () => {
    const logs: string[] = [];
    let currentStatus: EnforcementAction = 'AUTO_APPROVE';
    let cumulativeLoadingPct = 0;
    let cumulativeLoadingAmount = 0;

    // Waterfall evaluation: Check each rule in priority order
    for (const rule of rules) {
      logs.push(`Evaluating [${rule.ruleCode}] ${rule.name}...`);
      let ruleMatched = true;

      for (const cond of rule.conditionGroup.conditions) {
        if (cond.field === 'driver.age') {
          const val = Number(cond.value);
          if (cond.operator === 'LESS_THAN' && !(simAge < val)) ruleMatched = false;
          if (cond.operator === 'GREATER_THAN' && !(simAge > val)) ruleMatched = false;
        } else if (cond.field === 'vehicle.age_years') {
          const val = Number(cond.value);
          if (cond.operator === 'GREATER_THAN' && !(simCarAge > val)) ruleMatched = false;
        } else if (cond.field === 'vehicle.is_modified') {
          const val = cond.value === 'true';
          if (simIsModified !== val) ruleMatched = false;
        }
      }

      if (ruleMatched) {
        logs.push(`-> TRIGGERED: Action is ${rule.action.enforcement}`);
        if (rule.action.enforcement === 'REJECT') {
          currentStatus = 'REJECT';
          logs.push(`Hard stop trigger reached. Policy execution declines immediately.`);
          break; // Stop waterfall evaluation immediately
        } else if (rule.action.enforcement === 'REFER') {
          currentStatus = 'REFER'; // Fixed: direct assignment without redundant comparison
          logs.push(`Yellow channel triggered. S2 Lock enforced. Dynamic form required.`);
        } else if (rule.action.enforcement === 'APPLY_LOADING') {
          cumulativeLoadingPct += rule.action.loadingPercent;
          cumulativeLoadingAmount += rule.action.loadingAmountThb;
          logs.push(`Added loading: +${rule.action.loadingPercent}% and +${rule.action.loadingAmountThb} THB.`);
        }
      } else {
        logs.push(`-> Passed cleanly.`);
      }
    }

    // Math: Net Base Premium -> Loading -> Stamp (0.4%) -> VAT (7%)
    const ratedBase = simBasePremium * (1 + cumulativeLoadingPct / 100) + cumulativeLoadingAmount;
    const stamp = Math.ceil(ratedBase * 0.004);
    const vat = parseFloat(((ratedBase + stamp) * 0.07).toFixed(2));
    const gross = ratedBase + stamp + vat;

    setSimResult({
      status: currentStatus,
      grossPremium: gross,
      stamp,
      vat,
      messages: logs,
    });
  };

  return (
    <div className="flex flex-col min-h-full space-y-6">
      {/* ==================================================================== */}
      {/* Top Header / Governance Bar                                           */}
      {/* ==================================================================== */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {selectedLob} Line of Business
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Source: {productVersion}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                Editing: {draftVersion} (SCD Type-2)
              </span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 mt-2">
              Pricing & Underwriting Rules Canvas
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Target Plan: <strong className="text-zinc-700">{productCode}</strong> / <span className="text-zinc-700 font-medium">{planCode}</span>
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Rule Inheritance Switch (Requirement BO-03 & PROD-04/05) */}
            <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-lg p-1.5 px-3">
              <span className="text-xs font-medium text-zinc-700 mr-3 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
                Inherit Product Defaults?
              </span>
              <button
                type="button"
                onClick={handleToggleInheritance}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  inheritFromProduct ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    inheritFromProduct ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span
                className={`ml-2 text-[11px] font-semibold ${
                  inheritFromProduct ? 'text-emerald-700' : 'text-blue-700'
                }`}
              >
                {inheritFromProduct ? 'Inherited' : 'Plan Override'}
              </span>
            </div>

            {/* Test Simulator Drawer Button */}
            <button
              onClick={() => {
                setIsSimulatorOpen(!isSimulatorOpen);
                runSimulator();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition"
            >
              <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
              Simulate Risk Payload
            </button>

            {/* Save Staged Draft */}
            <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 transition shadow-sm">
              <Save className="w-3.5 h-3.5 text-zinc-600" />
              Save Draft (Clone v2)
            </button>

            {/* Submit Maker-Checker */}
            <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm">
              <Send className="w-3.5 h-3.5 text-white" />
              Submit to Maker-Checker
            </button>
          </div>
        </div>

        {/* Informational Notification Banner */}
        {!inheritFromProduct && (
          <div className="mt-4 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Child-First Plan Override Active:</strong> Rules configured on this canvas will evaluate
              <strong> prior</strong> to global master product rules during the quoting phase (POST /quotes/calculate).
            </span>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* Visual Canvas Split-Screen (Condition Tree vs Action Builder)         */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 items-start">
        {/* ------------------------------------------------------------------ */}
        {/* Left Side: Rule Tree & Node Hierarchy (Col 1-4)                    */}
        {/* ------------------------------------------------------------------ */}
        <div className="xl:col-span-4 bg-white border border-zinc-200 rounded-xl shadow-sm flex flex-col h-[740px] overflow-hidden">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-zinc-600" />
                Underwriting Rule Nodes
              </h2>
              <span className="text-[11px] text-zinc-500">
                Evaluated Waterfall (Priority Order)
              </span>
            </div>
            <button
              onClick={handleAddNewRule}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-white border border-zinc-300 rounded-md text-zinc-800 hover:bg-zinc-50 transition shadow-sm"
            >
              <Plus className="w-3 h-3 text-blue-600" />
              Add Node
            </button>
          </div>

          {/* List of Rule Cards */}
          <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
            {rules.map((rule, idx) => {
              const isSelected = rule.id === activeRule.id;

              // Action color badge
              let badgeColor = 'bg-zinc-100 text-zinc-700 border-zinc-200';
              if (rule.action.enforcement === 'AUTO_APPROVE') {
                badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              } else if (rule.action.enforcement === 'REFER') {
                badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
              } else if (rule.action.enforcement === 'REJECT') {
                badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
              } else if (rule.action.enforcement === 'APPLY_LOADING') {
                badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
              }

              return (
                <div
                  key={rule.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition relative ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/20 shadow-sm ring-1 ring-blue-400'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-zinc-600">
                          #{idx + 1}
                        </span>
                        <h3 className="text-xs font-bold text-zinc-900 line-clamp-1">
                          {rule.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                        {rule.ruleCode}
                      </span>
                    </div>

                    {/* Blue Override Pill (Req BO-03) */}
                    {rule.isOverridden && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200 rounded">
                        Override
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}
                    >
                      {rule.action.enforcement}
                    </span>
                    <span className="text-zinc-500 text-[10px]">
                      {rule.conditionGroup.conditions.length} condition
                      {rule.conditionGroup.conditions.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Right Side: Active Block Builder & Action Formula (Col 5-12)      */}
        {/* ------------------------------------------------------------------ */}
        <div className="xl:col-span-8 flex flex-col space-y-6">
          {/* Section 1: Visual IF (Condition Blocks) */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black rounded uppercase">
                  IF Block
                </span>
                <h3 className="text-sm font-bold text-zinc-900">
                  Risk Assessment Criteria (Trigger Group)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium">Logical Match:</span>
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setRules((prev) =>
                        prev.map((r) =>
                          r.id === activeRule.id
                            ? {
                                ...r,
                                conditionGroup: {
                                  ...r.conditionGroup,
                                  logicalOperator: 'AND',
                                },
                              }
                            : r
                        )
                      )
                    }
                    className={`px-2.5 py-1 text-xs font-semibold rounded-l-md border ${
                      activeRule.conditionGroup.logicalOperator === 'AND'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    AND
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRules((prev) =>
                        prev.map((r) =>
                          r.id === activeRule.id
                            ? {
                                ...r,
                                conditionGroup: {
                                  ...r.conditionGroup,
                                  logicalOperator: 'OR',
                                },
                              }
                            : r
                        )
                      )
                    }
                    className={`px-2.5 py-1 text-xs font-semibold rounded-r-md border border-l-0 ${
                      activeRule.conditionGroup.logicalOperator === 'OR'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    OR
                  </button>
                </div>
              </div>
            </div>

            {/* Conditions Builder List */}
            <div className="mt-4 space-y-3">
              {activeRule.conditionGroup.conditions.map((cond, index) => (
                <div
                  key={cond.id}
                  className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition"
                >
                  <span className="text-[11px] font-bold text-zinc-400 w-6 text-center">
                    #{index + 1}
                  </span>

                  {/* Schema Field Selector */}
                  <div className="flex-1 min-w-[200px]">
                    <select
                      value={cond.field}
                      onChange={(e) =>
                        handleUpdateCondition(cond.id, {
                          field: e.target.value as RuleField,
                        })
                      }
                      className="w-full text-xs font-medium bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <optgroup label="Motor Vehicle Vectors">
                        <option value="vehicle.age_years">Car Age (Years from Redbook)</option>
                        <option value="vehicle.sum_insured_ratio">Sum Insured Boundary (70%-90%)</option>
                        <option value="vehicle.is_modified">Engine/Suspension Modified (Bool)</option>
                        <option value="driver.age">Primary Driver Age</option>
                      </optgroup>
                      <optgroup label="Health Vectors">
                        <option value="health.bmi">Body Mass Index (BMI)</option>
                        <option value="health.is_smoker">Smoker Declaration (Bool)</option>
                      </optgroup>
                      <optgroup label="Personal Accident Vectors">
                        <option value="pa.occupation_class">Occupation Class (1 to 4)</option>
                        <option value="pa.has_motorcycle_risk">Motorcycle Risk Attached (Bool)</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Operator Selector */}
                  <div className="w-[170px]">
                    <select
                      value={cond.operator}
                      onChange={(e) =>
                        handleUpdateCondition(cond.id, {
                          operator: e.target.value as ComparisonOperator,
                        })
                      }
                      className="w-full text-xs font-medium bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="EQUALS">is Equal (==)</option>
                      <option value="NOT_EQUALS">is Not Equal (!=)</option>
                      <option value="GREATER_THAN">Greater Than (&gt;)</option>
                      <option value="GREATER_THAN_OR_EQUAL">Greater Than or Equal (&gt;=)</option>
                      <option value="LESS_THAN">Less Than (&lt;)</option>
                      <option value="LESS_THAN_OR_EQUAL">Less Than or Equal (&lt;=)</option>
                      <option value="BETWEEN">Between [A, B]</option>
                    </select>
                  </div>

                  {/* Value Input */}
                  <div className="w-[140px]">
                    <input
                      type="text"
                      value={cond.value}
                      onChange={(e) =>
                        handleUpdateCondition(cond.id, { value: e.target.value })
                      }
                      placeholder="Value"
                      className="w-full text-xs font-mono bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveCondition(cond.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                    title="Delete Condition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="pt-2">
                <button
                  onClick={handleAddCondition}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Expression
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Visual THEN (Action & Pricing Engine Formula) */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-black rounded uppercase">
                  THEN Block
                </span>
                <h3 className="text-sm font-bold text-zinc-900">
                  Underwriting Triage & Premium Adjustment Action
                </h3>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Target State Enforcement */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  State Machine Enforcement Trigger (URE)
                </label>
                <select
                  value={activeRule.action.enforcement}
                  onChange={(e) =>
                    handleUpdateActiveAction({
                      enforcement: e.target.value as EnforcementAction,
                    })
                  }
                  className="w-full text-xs font-semibold bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="AUTO_APPROVE">
                    Green Channel: AUTO_APPROVE (Unlock Checkout)
                  </option>
                  <option value="REFER">
                    Yellow Channel: REFER (Lock Payment / Require Dynamic Template)
                  </option>
                  <option value="APPLY_LOADING">
                    Rated Counter-Offer: APPLY_LOADING (Recalculate Premium)
                  </option>
                  <option value="REJECT">
                    Red Channel: REJECT (Hard Stop / Blacklist)
                  </option>
                </select>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Enforces exact API responses during customer application transition.
                </p>
              </div>

              {/* Dynamic Referral Requirements (Yellow Channel only) */}
              {activeRule.action.enforcement === 'REFER' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1.5">
                    Trigger Refer Template Form (Yellow Channel)
                  </label>
                  <select
                    value={activeRule.action.referralTemplateRequired || ''}
                    onChange={(e) =>
                      handleUpdateActiveAction({
                        referralTemplateRequired: e.target.value,
                      })
                    }
                    className="w-full text-xs bg-amber-50/50 border border-amber-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="MTR_CAR_4_CORNERS_INSPECTION_PHOTO">
                      Motor: 4-Corner Vehicle Inspection Photos
                    </option>
                    <option value="HLT_ATTENDING_PHYSICIAN_STATEMENT">
                      Health: Attending Physician Statement (APS)
                    </option>
                    <option value="PA_DANGEROUS_DUTY_QUESTIONNAIRE">
                      PA: Dangerous Occupation Exposure Form
                    </option>
                  </select>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Defines the dynamic upload schema returned in GET /requirements.
                  </p>
                </div>
              )}

              {/* Actuarial Loadings (Rated Offer) */}
              {activeRule.action.enforcement === 'APPLY_LOADING' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Percentage Risk Loading (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={activeRule.action.loadingPercent}
                        onChange={(e) =>
                          handleUpdateActiveAction({
                            loadingPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full text-xs font-mono bg-white border border-zinc-300 rounded-lg px-3 py-2 pr-8 text-zinc-900 focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-zinc-400">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Fixed Monetary Loading (THB)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="100"
                        value={activeRule.action.loadingAmountThb}
                        onChange={(e) =>
                          handleUpdateActiveAction({
                            loadingAmountThb: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full text-xs font-mono bg-white border border-zinc-300 rounded-lg px-3 py-2 pr-12 text-zinc-900 focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-zinc-400">
                        THB
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Policy Exclusion Red-Text Clause (Req 7.2) */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center justify-between">
                <span>Binding Exclusion Clause (Schedule PDF Injection)</span>
                <span className="text-[10px] text-rose-600 font-normal">
                  Prints in red text on official insurer contract schedule
                </span>
              </label>
              <textarea
                rows={2}
                value={activeRule.action.policyExclusionClause || ''}
                onChange={(e) =>
                  handleUpdateActiveAction({
                    policyExclusionClause: e.target.value,
                  })
                }
                placeholder="e.g. Permanent Exclusion: No coverage for pre-existing right knee ligament conditions."
                className="w-full text-xs bg-white border border-zinc-300 rounded-lg p-2.5 text-zinc-900 focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-400"
              />
            </div>

            {/* Internal Underwriter Notes */}
            <div className="mt-3">
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Internal Actuary / Underwriter Rationale (Audit Trail)
              </label>
              <input
                type="text"
                value={activeRule.action.internalNotes}
                onChange={(e) =>
                  handleUpdateActiveAction({
                    internalNotes: e.target.value,
                  })
                }
                placeholder="Audit notes saved to audit_logs table"
                className="w-full text-xs bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* Live Simulation Playground (Slide-Over Drawer)                      */}
      {/* ==================================================================== */}
      {isSimulatorOpen && (
        <div className="bg-white border border-zinc-300 rounded-xl p-5 shadow-lg mt-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h3 className="text-sm font-bold text-zinc-900">
                Rule Engine Execution Sandbox (Local Simulation)
              </h3>
            </div>
            <button
              onClick={() => setIsSimulatorOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 text-xs font-bold"
            >
              ✕ Close Sandbox
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
            {/* Input Vector Controls (Col 1-5) */}
            <div className="lg:col-span-5 space-y-3 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
              <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Simulated Customer & Asset KYC Payload
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-600">
                    Primary Driver Age
                  </label>
                  <input
                    type="number"
                    value={simAge}
                    onChange={(e) => setSimAge(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-white border border-zinc-300 rounded p-1.5 text-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-600">
                    Vehicle Age (Years)
                  </label>
                  <input
                    type="number"
                    value={simCarAge}
                    onChange={(e) => setSimCarAge(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-white border border-zinc-300 rounded p-1.5 text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <div>
                  <label className="text-[11px] font-medium text-zinc-600">
                    Base Net Premium (THB)
                  </label>
                  <input
                    type="number"
                    value={simBasePremium}
                    onChange={(e) => setSimBasePremium(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-white border border-zinc-300 rounded p-1.5 text-zinc-900"
                  />
                </div>
                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-800">
                    <input
                      type="checkbox"
                      checked={simIsModified}
                      onChange={(e) => setSimIsModified(e.target.checked)}
                      className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    Engine Modified?
                  </label>
                </div>
              </div>

              <button
                onClick={runSimulator}
                className="w-full mt-2 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Execute URE Test Run
              </button>
            </div>

            {/* Execution Trace & Financial Breakdown (Col 6-12) */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-900 text-zinc-100 p-4 rounded-lg border border-zinc-800 font-mono text-xs">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400 font-bold">Execution Trace Logs</span>
                  {simResult && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        simResult.status === 'AUTO_APPROVE'
                          ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                          : simResult.status === 'REFER'
                          ? 'bg-amber-900/80 text-amber-300 border border-amber-700'
                          : simResult.status === 'APPLY_LOADING'
                          ? 'bg-blue-900/80 text-blue-300 border border-blue-700'
                          : 'bg-rose-900/80 text-rose-300 border border-rose-700'
                      }`}
                    >
                      TRIAGE: {simResult.status}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1 max-h-36 overflow-y-auto text-[11px] text-zinc-300">
                  {simResult?.messages.map((m, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-zinc-500">&gt;</span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Math Verification */}
              {simResult && simResult.status !== 'REJECT' && (
                <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-4 gap-2 text-center">
                  <div className="bg-zinc-800/60 p-2 rounded">
                    <span className="text-[10px] text-zinc-400 block">Base Rated</span>
                    <span className="text-xs font-bold text-white">
                      {(simResult.grossPremium - simResult.vat - simResult.stamp).toLocaleString()} ฿
                    </span>
                  </div>
                  <div className="bg-zinc-800/60 p-2 rounded">
                    <span className="text-[10px] text-zinc-400 block">Stamp (0.4%)</span>
                    <span className="text-xs font-bold text-zinc-300">
                      {simResult.stamp.toLocaleString()} ฿
                    </span>
                  </div>
                  <div className="bg-zinc-800/60 p-2 rounded">
                    <span className="text-[10px] text-zinc-400 block">VAT (7.0%)</span>
                    <span className="text-xs font-bold text-zinc-300">
                      {simResult.vat.toLocaleString()} ฿
                    </span>
                  </div>
                  <div className="bg-blue-900/50 border border-blue-800 p-2 rounded">
                    <span className="text-[10px] text-blue-300 block font-sans">Final Gross</span>
                    <span className="text-xs font-bold text-blue-200">
                      {simResult.grossPremium.toLocaleString()} ฿
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingUWRulesCanvasPage;