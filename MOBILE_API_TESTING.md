# Mobile API Testing Guide

This guide shows how to test the mobile authentication endpoints and verify the hybrid auth system (cookies + tokens) is working correctly.

## Base URL

- **Local**: `http://localhost:3000/api`
- **Production**: `https://scrubly-delta.vercel.app/api`

## Authentication Endpoints

### 1. Register (Mobile)

Creates a new user account and returns an access token.

**Endpoint**: `POST /auth/mobile/register`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "CUSTOMER",
  "postcode": "SW1A 1AA"
}
```

**Response** (Success):
```json
{
  "accessToken": "base64-encoded-token",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "emailVerified": true
  },
  "expiresAt": "2025-12-02T12:00:00.000Z"
}
```

**Notes**:
- For `CLEANER` role, `postcode` is required
- For `CUSTOMER` role, `postcode` is optional
- Email is automatically verified on mobile registration
- Returns 400 if email already exists
- Returns 400 if postcode is invalid (for cleaners)

**curl Example**:
```bash
curl -X POST https://scrubly-delta.vercel.app/api/auth/mobile/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "CUSTOMER"
  }'
```

---

### 2. Login (Mobile)

Authenticates existing user and returns an access token.

**Endpoint**: `POST /auth/mobile/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (Success):
```json
{
  "accessToken": "base64-encoded-token",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "emailVerified": true
  },
  "expiresAt": "2025-12-02T12:00:00.000Z"
}
```

**Error Responses**:
- `400`: Missing email or password
- `401`: Invalid email or password

**curl Example**:
```bash
curl -X POST https://scrubly-delta.vercel.app/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

### 3. Refresh Token

Extends the expiration of an existing token.

**Endpoint**: `POST /auth/mobile/refresh`

**Request Body**:
```json
{
  "token": "your-current-access-token"
}
```

**Response** (Success):
```json
{
  "accessToken": "same-token",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "emailVerified": true
  },
  "expiresAt": "2025-12-09T12:00:00.000Z"
}
```

**Error Responses**:
- `400`: Token is required
- `401`: Invalid or expired token

**curl Example**:
```bash
curl -X POST https://scrubly-delta.vercel.app/api/auth/mobile/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-access-token-here"
  }'
```

---

### 4. Logout

Invalidates the current access token.

**Endpoint**: `POST /auth/mobile/logout`

**Headers**:
```
Authorization: Bearer your-access-token
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**curl Example**:
```bash
curl -X POST https://scrubly-delta.vercel.app/api/auth/mobile/logout \
  -H "Authorization: Bearer your-access-token-here"
```

---

## Protected Endpoints (Hybrid Auth)

All protected endpoints now support both cookie-based (web) and token-based (mobile) authentication.

### Using Token Authentication

Add the `Authorization` header to your requests:

```
Authorization: Bearer your-access-token
```

### 5. Get Bookings

**Endpoint**: `GET /bookings`

**Headers**:
```
Authorization: Bearer your-access-token
```

**Query Parameters**:
- `role=cleaner` - Get cleaner's jobs (optional)

**curl Example**:
```bash
# Get customer bookings
curl https://scrubly-delta.vercel.app/api/bookings \
  -H "Authorization: Bearer your-access-token-here"

# Get cleaner jobs
curl "https://scrubly-delta.vercel.app/api/bookings?role=cleaner" \
  -H "Authorization: Bearer your-access-token-here"
```

---

### 6. Create Payment Intent

**Endpoint**: `POST /create-payment-intent`

**Headers**:
```
Authorization: Bearer your-access-token
Content-Type: application/json
```

**Request Body**:
```json
{
  "postcode": "SW1A 1AA",
  "serviceType": "STANDARD",
  "propertyType": "APARTMENT",
  "bedrooms": 2,
  "bathrooms": 1,
  "extras": ["OVEN", "FRIDGE"],
  "address": "123 Main St",
  "city": "London",
  "date": "2025-12-15T10:00:00.000Z",
  "timeSlot": "10:00 AM - 12:00 PM",
  "instructions": "Please use eco-friendly products",
  "price": 65.00
}
```

**Response**:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "bookingId": "booking-id"
}
```

**curl Example**:
```bash
curl -X POST https://scrubly-delta.vercel.app/api/create-payment-intent \
  -H "Authorization: Bearer your-access-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "postcode": "SW1A 1AA",
    "serviceType": "STANDARD",
    "propertyType": "APARTMENT",
    "bedrooms": 2,
    "bathrooms": 1,
    "extras": [],
    "address": "123 Main St",
    "city": "London",
    "date": "2025-12-15T10:00:00.000Z",
    "timeSlot": "10:00 AM - 12:00 PM",
    "price": 50.00
  }'
```

---

### 7. Update Booking

**Endpoint**: `PATCH /bookings/{id}`

**Headers**:
```
Authorization: Bearer your-access-token
Content-Type: application/json
```

**Request Body** (Accept Job):
```json
{
  "status": "ACCEPTED",
  "cleanerId": "cleaner-user-id"
}
```

**Request Body** (Cancel Booking):
```json
{
  "status": "CANCELLED"
}
```

**curl Example**:
```bash
curl -X PATCH https://scrubly-delta.vercel.app/api/bookings/booking-id \
  -H "Authorization: Bearer your-access-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACCEPTED",
    "cleanerId": "your-cleaner-id"
  }'
```

---

### 8. Get Notifications

**Endpoint**: `GET /notifications`

**Headers**:
```
Authorization: Bearer your-access-token
```

**Response**:
```json
[
  {
    "id": "notification-id",
    "title": "Booking Accepted",
    "message": "John Doe has accepted your booking",
    "type": "BOOKING_ACCEPTED",
    "read": false,
    "data": {
      "bookingId": "booking-id"
    },
    "createdAt": "2025-11-25T12:00:00.000Z"
  }
]
```

---

### 9. Mark Notification as Read

**Endpoint**: `PATCH /notifications`

**Headers**:
```
Authorization: Bearer your-access-token
Content-Type: application/json
```

**Request Body**:
```json
{
  "id": "notification-id"
}
```

---

### 10. Store FCM Token

**Endpoint**: `POST /users/fcm-token`

**Headers**:
```
Authorization: Bearer your-access-token
Content-Type: application/json
```

**Request Body**:
```json
{
  "token": "fcm-device-token"
}
```

**Response**:
```json
{
  "success": true
}
```

**curl Example**:
```bash
curl -X POST https://scrubly-delta.vercel.app/api/users/fcm-token \
  -H "Authorization: Bearer your-access-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "fcm-device-token-here"
  }'
```

---

### 11. Get User Role

**Endpoint**: `GET /users/role`

**Headers**:
```
Authorization: Bearer your-access-token
```

**Response**:
```json
{
  "role": "CUSTOMER"
}
```

---

## Testing Workflow

### Complete Registration & Booking Flow

```bash
# 1. Register a customer
REGISTER_RESPONSE=$(curl -X POST https://scrubly-delta.vercel.app/api/auth/mobile/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "customer@test.com",
    "password": "password123",
    "role": "CUSTOMER"
  }')

# Extract token
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.accessToken')

# 2. Create a payment intent
curl -X POST https://scrubly-delta.vercel.app/api/create-payment-intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "postcode": "SW1A 1AA",
    "serviceType": "STANDARD",
    "propertyType": "APARTMENT",
    "bedrooms": 2,
    "bathrooms": 1,
    "extras": [],
    "address": "123 Test St",
    "city": "London",
    "date": "2025-12-15T10:00:00.000Z",
    "timeSlot": "10:00 AM - 12:00 PM",
    "price": 50.00
  }'

# 3. Get bookings
curl https://scrubly-delta.vercel.app/api/bookings \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Codes

- `400`: Bad Request - Invalid input
- `401`: Unauthorized - No valid token or cookie
- `403`: Forbidden - Valid auth but insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `500`: Internal Server Error

---

## Notes

1. **Token Expiration**: Tokens expire after 7 days
2. **Token Storage**: Store tokens securely (Keychain on iOS, EncryptedSharedPreferences on Android)
3. **Automatic Refresh**: Implement automatic token refresh when receiving 401 errors
4. **Hybrid Auth**: All endpoints support both cookie (web) and Bearer token (mobile) authentication
5. **Email Verification**: Mobile users are auto-verified on registration

---

## Next Steps

1. Test all endpoints with Postman or similar tool
2. Implement React Native mobile app using these endpoints
3. Set up Firebase Cloud Messaging for push notifications
4. Implement automatic token refresh in mobile app
5. Add error handling and retry logic
