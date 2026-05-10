"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
exports.NotificationSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    userId: zod_1.z.string(),
    type: zod_1.z.enum(enums_1.NotificationType),
    title: zod_1.z.string(),
    body: zod_1.z.string(),
    data: zod_1.z.record(zod_1.z.unknown()).default({}),
    isRead: zod_1.z.boolean().default(false),
    sentAt: zod_1.z.date(),
    createdAt: zod_1.z.date(),
});
//# sourceMappingURL=notification.schema.js.map