# YallaPlay API Reference
Base URL: `http://localhost:3000/api/v1`  
Swagger UI: `http://localhost:3000/api/docs`

All responses are wrapped: `{ success: boolean, data: T, timestamp: string }`  
Errors: `{ success: false, statusCode, message, errors[], timestamp, path }`

---

## Auth
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/auth/otp/send` | Public | Send OTP to phone |
| POST | `/auth/otp/verify` | Public | Verify OTP → get access + refresh tokens |
| POST | `/auth/token/refresh` | Any | Rotate refresh token |
| POST | `/auth/logout` | Any | Invalidate refresh token |

## Users
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/users/me` | Any | Get own profile |
| PATCH | `/users/me` | Any | Update profile |
| PATCH | `/users/me/location` | Any | Update GPS coords |
| GET | `/users/me/points` | Any | Get points balance |
| GET | `/users/me/points/history` | Any | Points transaction log |
| GET | `/users/me/bookings?filter=upcoming\|past\|all` | Any | Booking history |
| POST | `/users/me/device-token` | Any | Register FCM token |
| DELETE | `/users/me/device-token` | Any | Remove FCM token |

## Facilities
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/facilities?query=&sport=&lat=&lon=&sortBy=` | Public | Search facilities |
| GET | `/facilities/:id` | Public | Facility detail |
| GET | `/facilities/:id/slots?date=YYYY-MM-DD` | Public | Available time slots |
| POST | `/facilities` | Owner | Create facility |
| PATCH | `/facilities/:id` | Owner | Update facility |
| DELETE | `/facilities/:id` | Owner | Soft-delete facility |
| GET | `/facilities/owner/my-facilities` | Owner | List own facilities |

## Bookings
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/bookings` | Athlete | Create booking (atomic lock) |
| GET | `/bookings/:id` | Owner/Athlete | Get booking + QR token |
| DELETE | `/bookings/:id` | Owner/Athlete | Cancel booking |
| POST | `/bookings/confirm-qr` | Owner | Confirm payment via QR scan |
| GET | `/bookings/facility/:id?date=&status=` | Owner | List facility bookings |
| PATCH | `/bookings/:id/share-whatsapp` | Athlete | Mark as shared |

## Waitlist
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/waitlist` | Athlete | Join waitlist |
| GET | `/waitlist` | Athlete | My waitlist entries |
| DELETE | `/waitlist/:id` | Athlete | Leave waitlist |

## Notifications
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/notifications?page=&limit=` | Any | Inbox + unread count |
| PATCH | `/notifications/read-all` | Any | Mark all read |
| PATCH | `/notifications/:id/read` | Any | Mark one read |

## Offers
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/offers` | Owner | Create flash discount |
| GET | `/offers/mine?facilityId=` | Owner | My active offers |
| DELETE | `/offers/:id` | Owner | Deactivate offer |
| GET | `/offers/facility/:id?date=` | Public | Offers for a facility/date |

## Plans
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/plans` | Public | List visible plans |
| GET | `/plans/my-status` | Owner | Current plan + usage |
| POST | `/plans/upgrade` | Owner | Upgrade plan tier |
| POST | `/plans` | Admin | Create plan |
| PATCH | `/plans/:id` | Admin | Update plan |
| DELETE | `/plans/:id` | Admin | Delete custom plan |

## Analytics — Owner
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/analytics/owner/summary` | Owner | Today/month/all-time KPIs |
| GET | `/analytics/owner/revenue?granularity=&from=&to=&facilityId=` | Owner | Revenue chart |
| GET | `/analytics/owner/heatmap?facilityId=` | Owner | Day+hour booking heatmap |
| GET | `/analytics/owner/top-slots` | Owner | Most booked times |
| GET | `/analytics/owner/cancellation-rate?from=&to=` | Owner | Cancellation % |

## Analytics — Admin
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/analytics/admin/summary` | Admin | Platform-wide KPIs |
| GET | `/analytics/admin/revenue?granularity=&from=&to=` | Admin | Platform revenue chart |
| GET | `/analytics/admin/top-facilities` | Admin | Top facilities by bookings |
| GET | `/analytics/admin/facility-breakdown?from=&to=` | Admin | Revenue per facility |

## Weather
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/weather/current?lat=&lon=` | Any | Current + 7-day forecast (1hr cache) |
| GET | `/weather/forecast?lat=&lon=` | Any | 7-day forecast only |

## Admin
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/admin/users?role=&plan=&search=&isActive=` | Admin | List all users |
| GET | `/admin/users/:id` | Admin | User detail + stats |
| PATCH | `/admin/users/:id/suspend` | Admin | Suspend user + force logout |
| PATCH | `/admin/users/:id/reactivate` | Admin | Reactivate user |
| PATCH | `/admin/users/:id/plan` | Admin | Override plan |
| GET | `/admin/facilities?sport=&search=&ownerId=&isActive=` | Admin | List all facilities |
| GET | `/admin/facilities/:id` | Admin | Facility detail + revenue |
| PATCH | `/admin/facilities/:id/suspend` | Admin | Suspend facility |
| PATCH | `/admin/facilities/:id/restore` | Admin | Restore facility |
| GET | `/admin/bookings?status=&facilityId=&userId=&from=&to=` | Admin | Platform booking log |
