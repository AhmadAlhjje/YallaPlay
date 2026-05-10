"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoinWaitlistDto = exports.WaitlistSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
exports.WaitlistSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    facilityId: zod_1.z.string(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    userId: zod_1.z.string(),
    position: zod_1.z.number().int().positive(),
    status: zod_1.z.enum(enums_1.WaitlistStatus).default('waiting'),
    notifiedAt: zod_1.z.date().optional(),
    expiresAt: zod_1.z.date(),
    createdAt: zod_1.z.date(),
});
exports.JoinWaitlistDto = zod_1.z.object({
    facilityId: zod_1.z.string(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
});
//# sourceMappingURL=waitlist.schema.js.map