'use client';

import { useState, useEffect, useCallback } from 'react';
import { plansApi, adminApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { Plus, Edit2, Trash2, X, Phone, CreditCard, Info, UserSearch } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type PlanFeatures = {
  maxFacilities: number;
  canAddOffers: boolean;
  canSetCustomSlotPricing: boolean;
  analyticsDepth: 'basic' | 'full';
  prioritySupport: boolean;
  pointsMultiplier: number;
  waitlistAccess: boolean;
  customBranding: boolean;
};

type Plan = {
  _id: string;
  name: string;
  displayName: string;
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  features: PlanFeatures;
  isVisible: boolean;
  createdAt: string;
};

type FormState = {
  displayName: string;
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  isVisible: boolean;
  features: PlanFeatures;
};

const DEFAULT_FEATURES: PlanFeatures = {
  maxFacilities: 1,
  canAddOffers: false,
  canSetCustomSlotPricing: false,
  analyticsDepth: 'basic',
  prioritySupport: false,
  pointsMultiplier: 1,
  waitlistAccess: false,
  customBranding: false,
};

const DEFAULT_FORM: FormState = {
  displayName: '',
  price: 0,
  billingCycle: 'monthly',
  isVisible: false,
  features: { ...DEFAULT_FEATURES },
};

// ── Constants ─────────────────────────────────────────────────────────────────

const CORE_PLANS = ['free', 'primer', 'pro'];

const TIER_STYLE: Record<string, { badge: string; glow: string; border: string }> = {
  free:   { badge: 'badge-ghost',   glow: '#6B7280', border: 'rgba(107,114,128,0.2)' },
  primer: { badge: 'badge-indigo',  glow: '#4F46E5', border: 'rgba(79,70,229,0.25)' },
  pro:    { badge: 'badge-amber',   glow: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
  custom: { badge: 'badge-success', glow: '#10B981', border: 'rgba(16,185,129,0.2)' },
};

const BILLING_LABELS: Record<string, string> = {
  monthly:  'شهري',
  yearly:   'سنوي',
  lifetime: 'مدى الحياة',
};

const DURATION_OPTIONS = [
  { label: '30 يوم',  days: 30 },
  { label: '90 يوم',  days: 90 },
  { label: '180 يوم', days: 180 },
  { label: '365 يوم', days: 365 },
  { label: 'مخصص',   days: 0 },
];

type OverrideModal =
  | { open: false }
  | {
      open: true;
      step: 'search' | 'confirm';
      phone: string;
      foundUser: { _id: string; name: string; plan: string } | null;
      planTier: string;
      durationDays: number;
      customDays: string;
      loading: boolean;
    };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [overrideModal, setOverrideModal] = useState<OverrideModal>({ open: false });

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await plansApi.getAll();
      setPlans(res.data.data ?? []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openCreate = () => {
    setEditPlan(null);
    setForm({ ...DEFAULT_FORM, features: { ...DEFAULT_FEATURES } });
    setModalOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setForm({
      displayName: plan.displayName,
      price: plan.price,
      billingCycle: plan.billingCycle,
      isVisible: plan.isVisible,
      features: { ...DEFAULT_FEATURES, ...plan.features },
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.displayName.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        displayName: form.displayName,
        price: form.price,
        billingCycle: form.billingCycle,
        isVisible: form.isVisible,
        features: form.features,
      };
      if (!editPlan) payload.name = 'custom';
      if (editPlan) {
        await plansApi.update(editPlan._id, payload);
      } else {
        await plansApi.create(payload);
      }
      setModalOpen(false);
      fetchPlans();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await plansApi.delete(deleteConfirm._id);
      setDeleteConfirm(null);
      fetchPlans();
    } finally {
      setDeleting(false);
    }
  };

  const openOverrideModal = () => {
    setOverrideModal({
      open: true,
      step: 'search',
      phone: '',
      foundUser: null,
      planTier: plans[0]?.name ?? 'free',
      durationDays: 30,
      customDays: '',
      loading: false,
    });
  };

  const handleSearchUser = async () => {
    if (!overrideModal.open) return;
    setOverrideModal({ ...overrideModal, loading: true });
    try {
      const res = await adminApi.listUsers({ search: overrideModal.phone, limit: 1 });
      const user = res.data?.data?.users?.[0] ?? null;
      if (!user) {
        alert('المستخدم غير موجود');
        setOverrideModal({ ...overrideModal, loading: false });
        return;
      }
      setOverrideModal({ ...overrideModal, foundUser: user, step: 'confirm', loading: false });
    } catch {
      setOverrideModal({ ...overrideModal, loading: false });
    }
  };

  const handleOverride = async () => {
    if (!overrideModal.open || !overrideModal.foundUser) return;
    setOverrideModal({ ...overrideModal, loading: true });
    try {
      const days = overrideModal.durationDays === 0
        ? Number(overrideModal.customDays)
        : overrideModal.durationDays;
      const planExpiresAt = days > 0
        ? new Date(Date.now() + days * 86400000).toISOString()
        : undefined;
      await adminApi.overridePlan(overrideModal.foundUser._id, {
        plan: overrideModal.planTier,
        planExpiresAt,
      });
      setOverrideModal({ open: false });
    } catch {
      setOverrideModal({ ...overrideModal, loading: false });
    }
  };

  const isCustomDeletable = (plan: Plan) => !CORE_PLANS.includes(plan.name);

  const updateFeature = (key: keyof PlanFeatures, value: any) =>
    setForm({ ...form, features: { ...form.features, [key]: value } });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[--text-primary]">خطط الاشتراك</h1>
          <p className="text-sm text-[--text-tertiary] mt-0.5">{plans.length} خطة مسجّلة</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openOverrideModal} className="btn-ghost text-sm px-4 py-2 flex items-center gap-2">
            <UserSearch size={15} /> تعيين خطة لمالك
          </button>
          <button onClick={openCreate} className="btn-brand text-sm px-4 py-2 flex items-center gap-2">
            <Plus size={15} /> خطة مخصصة جديدة
          </button>
        </div>
      </div>

      {/* Info notice */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl border border-indigo-500/20"
        style={{ background: 'rgba(79,70,229,0.07)' }}
      >
        <Info size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[--text-primary] mb-1">التخفيض التلقائي للخطة</p>
          <p className="text-xs text-[--text-secondary] leading-relaxed">
            يعمل كرون يومياً عند الساعة{' '}
            <span className="text-indigo-400 font-mono">01:00 AM</span>، يحوّل أي مالك انتهت خطته
            تلقائياً إلى الخطة المجانية. يمكنك تعيين خطة يدوياً لأي مالك من زر «تعيين خطة لمالك» أعلاه.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card h-80 animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <GlassCard className="text-center py-16">
          <CreditCard size={48} className="mx-auto mb-3 text-[--text-tertiary] opacity-30" />
          <p className="text-[--text-tertiary]">لا توجد خطط مسجّلة</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onEdit={() => openEdit(plan)}
              onDelete={isCustomDeletable(plan) ? () => setDeleteConfirm(plan) : undefined}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="glass-card-strong p-6 w-full max-w-lg animate-slide-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[--text-primary] flex items-center gap-2">
                <CreditCard size={16} className="text-brand-primary" />
                {editPlan ? 'تعديل الخطة' : 'إنشاء خطة مخصصة'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-[--text-tertiary] hover:text-[--text-primary]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="field-label">اسم العرض</label>
                <input
                  className="field-input w-full"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="مثال: برو بلس"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">السعر (SYP)</label>
                  <input
                    type="number"
                    className="field-input w-full"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div>
                  <label className="field-label">دورة الفوترة</label>
                  <select
                    className="field-select w-full"
                    value={form.billingCycle}
                    onChange={(e) => setForm({ ...form, billingCycle: e.target.value as FormState['billingCycle'] })}
                  >
                    <option value="monthly">شهري</option>
                    <option value="yearly">سنوي</option>
                    <option value="lifetime">مدى الحياة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">عدد الملاعب الأقصى</label>
                  <input
                    type="number"
                    className="field-input w-full"
                    value={form.features.maxFacilities}
                    onChange={(e) => updateFeature('maxFacilities', Number(e.target.value))}
                    min={1}
                  />
                </div>
                <div>
                  <label className="field-label">مضاعف النقاط</label>
                  <input
                    type="number"
                    className="field-input w-full"
                    value={form.features.pointsMultiplier}
                    onChange={(e) => updateFeature('pointsMultiplier', Number(e.target.value))}
                    min={1}
                    step={0.5}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">عمق التحليلات</label>
                <div className="flex gap-3 mt-1">
                  {(['basic', 'full'] as const).map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="analyticsDepth"
                        value={val}
                        checked={form.features.analyticsDepth === val}
                        onChange={() => updateFeature('analyticsDepth', val)}
                        className="accent-brand-primary"
                      />
                      <span className="text-sm text-[--text-secondary]">
                        {val === 'basic' ? 'أساسية' : 'كاملة'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <p className="field-label">الميزات</p>
                {([
                  { key: 'canAddOffers' as const,            label: 'إضافة عروض فلاش' },
                  { key: 'canSetCustomSlotPricing' as const, label: 'تسعير مخصص للوقت' },
                  { key: 'prioritySupport' as const,         label: 'دعم ذو أولوية' },
                  { key: 'waitlistAccess' as const,          label: 'الوصول لقائمة الانتظار' },
                  { key: 'customBranding' as const,          label: 'علامة تجارية مخصصة' },
                ] as { key: keyof PlanFeatures; label: string }[]).map(({ key, label }) => (
                  <ToggleRow
                    key={key}
                    label={label}
                    value={form.features[key] as boolean}
                    onChange={(v) => updateFeature(key, v)}
                    color="indigo"
                  />
                ))}

                <div className="pt-2 border-t border-white/[0.07]">
                  <ToggleRow
                    label="خطة مرئية للعموم"
                    value={form.isVisible}
                    onChange={(v) => setForm({ ...form, isVisible: v })}
                    color="brand"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalOpen(false)} className="btn-ghost flex-1">إلغاء</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.displayName.trim()}
                className="btn-brand flex-1"
              >
                {saving ? 'جاري الحفظ...' : editPlan ? 'حفظ التعديلات' : 'إنشاء الخطة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
        >
          <div className="glass-card-strong p-6 w-full max-w-sm animate-slide-up text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-[--text-primary] mb-2">حذف الخطة</h3>
            <p className="text-sm text-[--text-secondary] mb-1">
              هل تريد حذف خطة{' '}
              <span className="text-[--text-primary] font-semibold">"{deleteConfirm.displayName}"</span>؟
            </p>
            <p className="text-xs text-[--text-tertiary] mb-5">
              سيُحوَّل المالكون المشتركون إلى الخطة المجانية
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost flex-1">إلغاء</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger flex-1"
              >
                {deleting ? 'جاري...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {overrideModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOverrideModal({ open: false }); }}
        >
          <div className="glass-card-strong p-6 w-full max-w-sm animate-slide-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[--text-primary] flex items-center gap-2">
                <UserSearch size={16} className="text-brand-primary" /> تعيين خطة يدوياً
              </h3>
              <button onClick={() => setOverrideModal({ open: false })} className="text-[--text-tertiary] hover:text-[--text-primary]">
                <X size={18} />
              </button>
            </div>

            {overrideModal.step === 'search' ? (
              <>
                <div>
                  <label className="field-label">رقم هاتف المالك</label>
                  <input
                    className="field-input w-full"
                    placeholder="+963XXXXXXXXX"
                    value={overrideModal.phone}
                    onChange={(e) => setOverrideModal({ ...overrideModal, phone: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearchUser(); }}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setOverrideModal({ open: false })} className="btn-ghost flex-1">إلغاء</button>
                  <button
                    onClick={handleSearchUser}
                    disabled={overrideModal.loading || !overrideModal.phone.trim()}
                    className="btn-brand flex-1 flex items-center gap-2 justify-center"
                  >
                    <Phone size={14} />
                    {overrideModal.loading ? 'جاري البحث...' : 'بحث'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {overrideModal.foundUser && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}
                    >
                      {overrideModal.foundUser.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[--text-primary]">{overrideModal.foundUser.name}</p>
                      <p className="text-xs text-[--text-tertiary]">
                        الخطة الحالية: <span className="text-amber-400">{overrideModal.foundUser.plan}</span>
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="field-label">الخطة الجديدة</label>
                  <select
                    className="field-select w-full"
                    value={overrideModal.planTier}
                    onChange={(e) => setOverrideModal({ ...overrideModal, planTier: e.target.value })}
                  >
                    {plans.map((p) => (
                      <option key={p._id} value={p.name}>
                        {p.displayName} — {p.price.toLocaleString('ar-SA')} SYP / {BILLING_LABELS[p.billingCycle]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">المدة</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setOverrideModal({ ...overrideModal, durationDays: opt.days, customDays: '' })}
                        className={cn(
                          'px-2 py-2 rounded-lg text-xs font-semibold border transition-all',
                          overrideModal.durationDays === opt.days
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                            : 'border-white/10 text-[--text-tertiary] hover:border-white/20',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {overrideModal.durationDays === 0 && (
                    <input
                      type="number"
                      className="field-input w-full mt-2"
                      placeholder="عدد الأيام"
                      value={overrideModal.customDays}
                      onChange={(e) => setOverrideModal({ ...overrideModal, customDays: e.target.value })}
                      min={1}
                    />
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setOverrideModal({ ...overrideModal, step: 'search', foundUser: null })}
                    className="btn-ghost flex-1"
                  >
                    رجوع
                  </button>
                  <button
                    onClick={handleOverride}
                    disabled={
                      overrideModal.loading ||
                      !overrideModal.planTier ||
                      (overrideModal.durationDays === 0 && !overrideModal.customDays)
                    }
                    className="btn-brand flex-1"
                  >
                    {overrideModal.loading ? 'جاري...' : 'تعيين'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: Plan;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const tierKey = CORE_PLANS.includes(plan.name) ? plan.name : 'custom';
  const style = TIER_STYLE[tierKey] ?? TIER_STYLE.custom;

  const TIER_NAMES: Record<string, string> = {
    free:   'مجاني',
    primer: 'برايمر',
    pro:    'برو',
    custom: 'مخصص',
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl border p-5 space-y-4 transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        borderColor: style.border,
      }}
    >
      {/* Glow accent */}
      <div
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-[0.07] blur-2xl pointer-events-none"
        style={{ background: style.glow }}
      />

      <div className="flex items-start justify-between relative">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={cn('badge', style.badge)}>{TIER_NAMES[tierKey] ?? plan.name}</span>
            <span className={cn(
              'badge text-xs',
              plan.isVisible
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-white/5 text-[--text-tertiary] border border-white/10',
            )}>
              {plan.isVisible ? 'مرئية' : 'مخفية'}
            </span>
          </div>
          <p className="text-base font-bold text-[--text-primary] truncate">{plan.displayName}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <p className="text-2xl font-bold text-[--text-primary] tabular-nums">
              {plan.price.toLocaleString('ar-SA')}
            </p>
            <span className="text-xs text-[--text-tertiary]">SYP / {BILLING_LABELS[plan.billingCycle]}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0 mr-2">
          <button onClick={onEdit} className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1">
            <Edit2 size={11} /> تعديل
          </button>
          {onDelete && (
            <button onClick={onDelete} className="btn-danger text-xs px-2.5 py-1 flex items-center gap-1">
              <Trash2 size={11} /> حذف
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t border-white/[0.07] pt-3">
        <FeatureRow label="عدد الملاعب" value={String(plan.features?.maxFacilities ?? 1)} />
        <FeatureRow label="مضاعف النقاط" value={`× ${plan.features?.pointsMultiplier ?? 1}`} />
        <FeatureRow
          label="التحليلات"
          value={plan.features?.analyticsDepth === 'full' ? 'كاملة' : 'أساسية'}
          positive={plan.features?.analyticsDepth === 'full'}
        />
        <FeatureRow label="عروض فلاش"       value={plan.features?.canAddOffers ? '✓' : '✗'} positive={plan.features?.canAddOffers} />
        <FeatureRow label="تسعير مخصص"      value={plan.features?.canSetCustomSlotPricing ? '✓' : '✗'} positive={plan.features?.canSetCustomSlotPricing} />
        <FeatureRow label="دعم أولوية"       value={plan.features?.prioritySupport ? '✓' : '✗'} positive={plan.features?.prioritySupport} />
        <FeatureRow label="قائمة الانتظار"  value={plan.features?.waitlistAccess ? '✓' : '✗'} positive={plan.features?.waitlistAccess} />
        <FeatureRow label="علامة تجارية"    value={plan.features?.customBranding ? '✓' : '✗'} positive={plan.features?.customBranding} />
      </div>
    </div>
  );
}

function FeatureRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[--text-tertiary]">{label}</span>
      <span className={cn(
        'text-xs font-semibold',
        positive === true ? 'text-emerald-400'
        : positive === false ? 'text-red-400'
        : 'text-[--text-primary]',
      )}>
        {value}
      </span>
    </div>
  );
}

function ToggleRow({
  label, value, onChange, color = 'indigo',
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  color?: 'indigo' | 'brand';
}) {
  const bg = color === 'brand' ? '#16A34A' : '#4F46E5';
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!value)}
        className="toggle"
        style={{ background: value ? bg : 'rgba(255,255,255,0.1)' }}
      >
        <div
          className="toggle-thumb"
          style={{ transform: value ? 'translateX(20px)' : 'translateX(2px)' }}
        />
      </div>
      <span className="text-sm text-[--text-secondary]">{label}</span>
    </label>
  );
}
