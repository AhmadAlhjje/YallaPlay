'use client';

import { useState, useEffect, useCallback } from 'react';
import { plansApi, adminApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

type Plan = {
  _id: string;
  name: string;
  tier: string;
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  maxFacilities: number;
  canAddOffers: boolean;
  hasAnalytics: boolean;
  hasPrioritySupport: boolean;
  isActive: boolean;
  createdAt: string;
};

type FormState = {
  name: string;
  tier: string;
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  maxFacilities: number;
  canAddOffers: boolean;
  hasAnalytics: boolean;
  hasPrioritySupport: boolean;
};

const DEFAULT_FORM: FormState = {
  name: '',
  tier: 'custom',
  price: 0,
  billingCycle: 'monthly',
  maxFacilities: 1,
  canAddOffers: false,
  hasAnalytics: false,
  hasPrioritySupport: false,
};

const TIER_COLORS: Record<string, string> = {
  free: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  primer: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  pro: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  custom: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const BILLING_LABELS: Record<string, string> = {
  monthly: 'شهري',
  yearly: 'سنوي',
  lifetime: 'مدى الحياة',
};

type OverrideModal = { open: false } | { open: true; phone: string; planTier: string; loading: boolean };

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
    setForm(DEFAULT_FORM);
    setModalOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setForm({
      name: plan.name,
      tier: plan.tier,
      price: plan.price,
      billingCycle: plan.billingCycle,
      maxFacilities: plan.maxFacilities,
      canAddOffers: plan.canAddOffers,
      hasAnalytics: plan.hasAnalytics,
      hasPrioritySupport: plan.hasPrioritySupport,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editPlan) {
        await plansApi.update(editPlan._id, form);
      } else {
        await plansApi.create(form);
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

  const handleOverride = async () => {
    if (!overrideModal.open) return;
    setOverrideModal({ ...overrideModal, loading: true });
    try {
      await adminApi.overridePlanByPhone(overrideModal.phone, overrideModal.planTier);
      setOverrideModal({ open: false });
    } catch {
      setOverrideModal({ ...overrideModal, loading: false });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">خطط الاشتراك</h1>
          <p className="text-sm text-[--text-tertiary] mt-0.5">{plans.length} خطة مسجّلة</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOverrideModal({ open: true, phone: '', planTier: plans[0]?.tier ?? 'free', loading: false })}
            className="btn-ghost text-sm px-4 py-2"
          >
            تعيين خطة لمالك
          </button>
          <button onClick={openCreate} className="btn-brand text-sm px-4 py-2">
            + خطة جديدة
          </button>
        </div>
      </div>

      {/* Auto-downgrade notice */}
      <GlassCard className="flex items-start gap-3 border border-indigo-500/20">
        <div className="text-2xl">⚙️</div>
        <div>
          <p className="text-sm font-semibold text-[--text-primary] mb-1">منطق التخفيض التلقائي</p>
          <p className="text-xs text-[--text-secondary] leading-relaxed">
            يعمل كرون يومياً الساعة <span className="text-indigo-400 font-mono">01:00 AM</span>، يحوّل أي مالك
            انتهت خطته (<code className="text-amber-400">planExpiresAt &lt; now</code>) تلقائياً إلى الخطة
            المجانية. يمكنك تعيين خطة يدوياً لأي مالك من خلال زر «تعيين خطة لمالك» أعلاه.
          </p>
        </div>
      </GlassCard>

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-72 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onEdit={() => openEdit(plan)}
              onDelete={() => setDeleteConfirm(plan)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div className="glass-card-strong p-6 w-full max-w-lg animate-slide-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[--text-primary]">
                {editPlan ? 'تعديل الخطة' : 'إنشاء خطة جديدة'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-[--text-tertiary] hover:text-[--text-primary] text-xl">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="field-label">اسم الخطة</label>
                <input
                  className="field-input w-full"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: برو بلس"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">المستوى</label>
                  <select
                    className="field-input w-full"
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: e.target.value })}
                  >
                    <option value="free">مجاني</option>
                    <option value="primer">برايمر</option>
                    <option value="pro">برو</option>
                    <option value="custom">مخصص</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">دورة الفوترة</label>
                  <select
                    className="field-input w-full"
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
                  <label className="field-label">عدد الملاعب الأقصى</label>
                  <input
                    type="number"
                    className="field-input w-full"
                    value={form.maxFacilities}
                    onChange={(e) => setForm({ ...form, maxFacilities: Number(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-[--text-tertiary] uppercase tracking-wider">الميزات</p>
                {(
                  [
                    { key: 'canAddOffers', label: 'إضافة عروض فلاش' },
                    { key: 'hasAnalytics', label: 'تحليلات متقدمة' },
                    { key: 'hasPrioritySupport', label: 'دعم ذو أولوية' },
                  ] as const
                ).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setForm({ ...form, [key]: !form[key] })}
                      className={cn(
                        'w-10 h-5 rounded-full transition-colors relative flex-shrink-0',
                        form[key] ? 'bg-brand-primary' : 'bg-white/10',
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm',
                          form[key] ? 'translate-x-0.5' : 'translate-x-5',
                        )}
                      />
                    </div>
                    <span className="text-sm text-[--text-secondary]">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalOpen(false)} className="btn-ghost flex-1">إلغاء</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className={cn('btn-brand flex-1', saving && 'opacity-60 cursor-not-allowed')}
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
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div className="glass-card-strong p-6 w-full max-w-sm animate-slide-up text-center">
            <div className="text-4xl mb-4">🗑️</div>
            <h3 className="text-lg font-bold text-[--text-primary] mb-2">حذف الخطة</h3>
            <p className="text-sm text-[--text-secondary] mb-6">
              هل تريد حذف خطة <span className="text-[--text-primary] font-semibold">"{deleteConfirm.name}"</span>؟
              <span className="block mt-1 text-xs text-[--text-tertiary]">سيُحوَّل المالكون المشتركون إلى الخطة المجانية</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost flex-1">إلغاء</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={cn('btn-danger flex-1', deleting && 'opacity-60')}
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
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div className="glass-card-strong p-6 w-full max-w-sm animate-slide-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[--text-primary]">تعيين خطة يدوياً</h3>
              <button onClick={() => setOverrideModal({ open: false })} className="text-[--text-tertiary] text-xl">✕</button>
            </div>
            <div>
              <label className="field-label">رقم هاتف المالك</label>
              <input
                className="field-input w-full"
                placeholder="+963XXXXXXXXX"
                value={overrideModal.phone}
                onChange={(e) => setOverrideModal({ ...overrideModal, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">الخطة</label>
              <select
                className="field-input w-full"
                value={overrideModal.planTier}
                onChange={(e) => setOverrideModal({ ...overrideModal, planTier: e.target.value })}
              >
                {plans.map((p) => (
                  <option key={p._id} value={p.tier}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setOverrideModal({ open: false })} className="btn-ghost flex-1">إلغاء</button>
              <button
                onClick={handleOverride}
                disabled={overrideModal.loading || !overrideModal.phone.trim()}
                className={cn('btn-brand flex-1', overrideModal.loading && 'opacity-60')}
              >
                {overrideModal.loading ? 'جاري...' : 'تعيين'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, onEdit, onDelete }: { plan: Plan; onEdit: () => void; onDelete: () => void }) {
  const tierCls = TIER_COLORS[plan.tier] ?? TIER_COLORS.custom;

  return (
    <GlassCard className="space-y-4 relative overflow-hidden">
      {/* Glow accent */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ background: plan.tier === 'pro' ? '#F59E0B' : plan.tier === 'primer' ? '#4F46E5' : '#6B7280' }}
      />

      <div className="flex items-start justify-between">
        <div>
          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border', tierCls)}>
            {plan.name}
          </span>
          <p className="text-2xl font-bold text-[--text-primary] mt-2 tabular-nums">
            {plan.price.toLocaleString()} <span className="text-sm font-normal text-[--text-tertiary]">SYP</span>
          </p>
          <p className="text-xs text-[--text-tertiary]">{BILLING_LABELS[plan.billingCycle]}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="btn-ghost text-xs px-2 py-1">تعديل</button>
          {plan.tier !== 'free' && (
            <button onClick={onDelete} className="btn-danger text-xs px-2 py-1">حذف</button>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t border-white/8 pt-3">
        <FeatureRow label="عدد الملاعب" value={String(plan.maxFacilities)} />
        <FeatureRow label="عروض فلاش" value={plan.canAddOffers ? '✓' : '✗'} positive={plan.canAddOffers} />
        <FeatureRow label="تحليلات" value={plan.hasAnalytics ? '✓' : '✗'} positive={plan.hasAnalytics} />
        <FeatureRow label="دعم ذو أولوية" value={plan.hasPrioritySupport ? '✓' : '✗'} positive={plan.hasPrioritySupport} />
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className={cn('text-xs', plan.isActive ? 'text-emerald-400' : 'text-red-400')}>
          {plan.isActive ? '● نشط' : '● معطّل'}
        </span>
      </div>
    </GlassCard>
  );
}

function FeatureRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[--text-tertiary]">{label}</span>
      <span className={cn('text-xs font-medium', positive === true ? 'text-emerald-400' : positive === false ? 'text-red-400' : 'text-[--text-primary]')}>
        {value}
      </span>
    </div>
  );
}
