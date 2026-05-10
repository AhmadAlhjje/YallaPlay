"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthResponseDto = exports.JwtPayload = exports.RefreshTokenDto = exports.VerifyOtpDto = exports.SendOtpDto = void 0;
const zod_1 = require("zod");
exports.SendOtpDto = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+963\d{9}$/, 'يجب أن يبدأ الرقم بـ +963'),
    role: zod_1.z.enum(['athlete', 'owner', 'admin']).default('athlete'),
});
exports.VerifyOtpDto = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+963\d{9}$/),
    otp: zod_1.z.string().length(6, 'رمز التحقق مكون من 6 أرقام'),
});
exports.RefreshTokenDto = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
exports.JwtPayload = zod_1.z.object({
    sub: zod_1.z.string(), // userId
    phone: zod_1.z.string(),
    role: zod_1.z.enum(['athlete', 'owner', 'admin']),
    iat: zod_1.z.number().optional(),
    exp: zod_1.z.number().optional(),
});
exports.AuthResponseDto = zod_1.z.object({
    accessToken: zod_1.z.string(),
    refreshToken: zod_1.z.string(),
    user: zod_1.z.object({
        _id: zod_1.z.string(),
        name: zod_1.z.string(),
        phone: zod_1.z.string(),
        role: zod_1.z.string(),
        avatar: zod_1.z.string().optional(),
        points: zod_1.z.number(),
        plan: zod_1.z.string(),
    }),
});
//# sourceMappingURL=auth.schema.js.map