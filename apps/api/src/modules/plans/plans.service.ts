import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SubscriptionPlan,
  SubscriptionPlanDocument,
} from '../../database/schemas/subscription-plan.mongoose-schema';
import { User, UserDocument } from '../../database/schemas/user.mongoose-schema';
import { Facility, FacilityDocument } from '../../database/schemas/facility.mongoose-schema';
import { CreatePlanDtoType, PlanTier } from '@yallaplay/shared-types';

@Injectable()
export class PlansService {
  constructor(
    @InjectModel(SubscriptionPlan.name)
    private planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Facility.name) private facilityModel: Model<FacilityDocument>,
  ) {}

  // ─── Public plan listing ───────────────────────────────────────────────────

  async getPublicPlans(): Promise<SubscriptionPlanDocument[]> {
    return this.planModel
      .find({ isVisible: true })
      .sort({ price: 1 })
      .lean() as unknown as SubscriptionPlanDocument[];
  }

  async getPlanById(planId: string): Promise<SubscriptionPlanDocument> {
    const plan = await this.planModel.findById(planId).lean();
    if (!plan) throw new NotFoundException('الخطة غير موجودة.');
    return plan as unknown as SubscriptionPlanDocument;
  }

  // ─── Admin plan management ─────────────────────────────────────────────────

  async createPlan(dto: CreatePlanDtoType): Promise<SubscriptionPlanDocument> {
    return this.planModel.create(dto) as unknown as SubscriptionPlanDocument;
  }

  async updatePlan(
    planId: string,
    dto: Partial<CreatePlanDtoType>,
  ): Promise<SubscriptionPlanDocument> {
    const updated = await this.planModel
      .findByIdAndUpdate(planId, { $set: dto }, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('الخطة غير موجودة.');
    return updated as unknown as SubscriptionPlanDocument;
  }

  async deletePlan(planId: string): Promise<void> {
    const plan = await this.planModel.findById(planId).lean();
    if (!plan) throw new NotFoundException('الخطة غير موجودة.');

    const coreNames: PlanTier[] = ['free', 'primer', 'pro'];
    if (coreNames.includes(plan.name as PlanTier)) {
      throw new BadRequestException('لا يمكن حذف الخطط الأساسية.');
    }

    await this.planModel.deleteOne({ _id: planId });
  }

  // ─── Owner upgrade flow ────────────────────────────────────────────────────

  async upgradePlan(
    ownerId: string,
    targetPlanName: PlanTier,
  ): Promise<{ user: Partial<UserDocument>; plan: SubscriptionPlanDocument }> {
    const plan = await this.planModel.findOne({ name: targetPlanName }).lean();
    if (!plan) throw new NotFoundException('الخطة غير موجودة.');

    const user = await this.userModel.findById(ownerId).lean();
    if (!user) throw new NotFoundException('المستخدم غير موجود.');
    if (user.role !== 'owner') throw new ForbiddenException('هذه الخدمة مخصصة لأصحاب الملاعب.');

    // Plan hierarchy: free < primer < pro
    const hierarchy: PlanTier[] = ['free', 'primer', 'pro', 'custom'];
    const currentIndex = hierarchy.indexOf(user.plan as PlanTier);
    const targetIndex = hierarchy.indexOf(targetPlanName);

    if (targetIndex <= currentIndex) {
      throw new BadRequestException(
        'لا يمكن الترقية إلى خطة أدنى من خطتك الحالية. للتخفيض تواصل مع الدعم.',
      );
    }

    const planExpiresAt = new Date();
    planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);

    await this.userModel.updateOne(
      { _id: ownerId },
      {
        $set: {
          plan: targetPlanName,
          planExpiresAt,
        },
      },
    );

    const updatedUser = await this.userModel
      .findById(ownerId)
      .select('name phone plan planExpiresAt')
      .lean();

    return {
      user: updatedUser as Partial<UserDocument>,
      plan: plan as unknown as SubscriptionPlanDocument,
    };
  }

  // ─── Plan enforcement — called by FacilitiesService before creating ────────

  async assertCanAddFacility(ownerId: string): Promise<void> {
    const [user, plan, currentFacilityCount] = await Promise.all([
      this.userModel.findById(ownerId).select('plan').lean(),
      this.userModel
        .findById(ownerId)
        .select('plan')
        .lean()
        .then((u) => this.planModel.findOne({ name: u?.plan }).lean()),
      this.facilityModel.countDocuments({
        ownerId: new Types.ObjectId(ownerId),
        isActive: true,
      }),
    ]);

    if (!plan) return; // No plan restriction

    const maxFacilities = (plan as any).features?.maxFacilities ?? 1;
    if (currentFacilityCount >= maxFacilities) {
      throw new ForbiddenException(
        `خطتك الحالية تسمح بـ ${maxFacilities} ملعب فقط. يرجى الترقية لإضافة المزيد.`,
      );
    }
  }

  async assertCanAddOffers(ownerId: string): Promise<void> {
    const user = await this.userModel.findById(ownerId).select('plan').lean();
    const plan = await this.planModel.findOne({ name: user?.plan }).lean();

    if (!(plan as any)?.features?.canAddOffers) {
      throw new ForbiddenException(
        'خطتك الحالية لا تتيح إنشاء عروض. يرجى الترقية إلى خطة بريمر أو برو.',
      );
    }
  }

  async getOwnerPlanStatus(ownerId: string) {
    const user = await this.userModel
      .findById(ownerId)
      .select('plan planExpiresAt')
      .lean();

    if (!user) throw new NotFoundException('المستخدم غير موجود.');

    const plan = await this.planModel.findOne({ name: user.plan }).lean();
    const facilityCount = await this.facilityModel.countDocuments({
      ownerId: new Types.ObjectId(ownerId),
      isActive: true,
    });

    const maxFacilities = (plan as any)?.features?.maxFacilities ?? 1;
    const isExpired = user.planExpiresAt ? new Date() > user.planExpiresAt : false;

    return {
      currentPlan: user.plan,
      planExpiresAt: user.planExpiresAt,
      isExpired,
      usage: {
        facilities: { current: facilityCount, max: maxFacilities },
      },
      features: (plan as any)?.features,
    };
  }

  // Daily cron: downgrade expired paid plans back to free
  async expireOverduePlans(): Promise<number> {
    const result = await this.userModel.updateMany(
      {
        plan: { $in: ['primer', 'pro'] },
        planExpiresAt: { $lt: new Date() },
      },
      {
        $set: { plan: 'free' },
        $unset: { planExpiresAt: 1 },
      },
    );
    return result.modifiedCount;
  }
}
