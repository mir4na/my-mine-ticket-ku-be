# MyMineTicketKu API Documentation

**Base URL:** `http://localhost:5000/api`

**Version:** 1.0.0

---

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [Events](#events)
3. [Tickets](#tickets)
4. [Users](#users)
5. [Scan (Offline)](#scan)
6. [Admin](#admin)
7. [Error Responses](#error-responses)

---

## 🔐 Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### POST `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "displayName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role": "USER"
}
```

**Fields:**
- `username` (string, required): Unique username
- `displayName` (string, optional): Display name
- `email` (string, required): Unique email
- `password` (string, required): Password (min 8 characters)
- `role` (string, optional): "USER" or "EO" (default: "USER")

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST `/auth/login`

Login to existing account.

**Request Body:**
```json
{
  "identifier": "johndoe",
  "password": "SecurePassword123!"
}
```

**Fields:**
- `identifier` (string, required): Username or email
- `password` (string, required): Password

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "USER",
      "walletAddress": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### GET `/auth/profile`

Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "walletAddress": "0x...",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

### PUT `/auth/profile`

Update user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "displayName": "John Smith",
  "walletAddress": "0x1234567890abcdef..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "displayName": "John Smith",
      "email": "john@example.com",
      "walletAddress": "0x1234567890abcdef..."
    }
  }
}
```

---

### POST `/auth/connect-wallet`

Connect wallet address to user account.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "walletAddress": "0x1234567890abcdef..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Wallet connected successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "walletAddress": "0x1234567890abcdef..."
    }
  }
}
```

---

## 🎪 Events

### POST `/events`

Create a new event (EO only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jakarta Music Festival 2025",
  "bannerUrl": "https://example.com/banner.jpg",
  "location": "Jakarta Convention Center",
  "startDate": "2025-06-15T18:00:00.000Z",
  "endDate": "2025-06-15T23:00:00.000Z",
  "receivers": [
    {
      "email": "artist@example.com",
      "percentage": 60
    },
    {
      "email": "venue@example.com",
      "percentage": 30
    },
    {
      "email": "lmkn@example.com",
      "percentage": 10
    }
  ]
}
```

**Fields:**
- `name` (string, required): Event name
- `bannerUrl` (string, required): Banner image URL
- `location` (string, required): Event location
- `startDate` (ISO 8601, required): Event start date
- `endDate` (ISO 8601, required): Event end date
- `receivers` (array, optional): Revenue split configuration
  - `email` (string): Receiver email
  - `percentage` (number): Percentage (total must be 100)

**Response (201):**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "event": {
      "id": "uuid",
      "name": "Jakarta Music Festival 2025",
      "bannerUrl": "https://example.com/banner.jpg",
      "location": "Jakarta Convention Center",
      "startDate": "2025-06-15T18:00:00.000Z",
      "endDate": "2025-06-15T23:00:00.000Z",
      "status": "PENDING_APPROVAL",
      "creatorId": "uuid",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

### POST `/events/:eventId/approve/:email`

Approve or reject revenue split (by receiver).

**URL Parameters:**
- `eventId` (uuid): Event ID
- `email` (string): Receiver email

**Request Body:**
```json
{
  "approved": true,
  "bankAccount": "1234567890",
  "bankName": "BCA",
  "accountHolder": "John Doe"
}
```

**For Rejection:**
```json
{
  "approved": false,
  "rejectionReason": "Percentage too low"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Revenue split approved"
}
```

---

### POST `/events/:eventId/tickets`

Configure ticket types for event (EO only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "ticketTypes": [
    {
      "name": "VIP",
      "price": 500000,
      "stock": 100,
      "saleStartDate": "2025-05-01T00:00:00.000Z",
      "saleEndDate": "2025-06-15T18:00:00.000Z"
    },
    {
      "name": "Regular",
      "price": 250000,
      "stock": 500,
      "saleStartDate": "2025-05-01T00:00:00.000Z",
      "saleEndDate": "2025-06-15T18:00:00.000Z"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Tickets configured successfully",
  "data": {
    "ticketTypes": [
      {
        "id": "uuid",
        "eventId": "uuid",
        "name": "VIP",
        "price": 500000,
        "stock": 100,
        "sold": 0,
        "saleStartDate": "2025-05-01T00:00:00.000Z",
        "saleEndDate": "2025-06-15T18:00:00.000Z"
      }
    ]
  }
}
```

---

### GET `/events`

Get list of events (public).

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (string, optional): Event status (default: "ACCEPTED")
- `location` (string, optional): Filter by location

**Example:**
```
GET /events?page=1&limit=10&location=Jakarta
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "uuid",
        "name": "Jakarta Music Festival 2025",
        "bannerUrl": "https://example.com/banner.jpg",
        "location": "Jakarta Convention Center",
        "startDate": "2025-06-15T18:00:00.000Z",
        "endDate": "2025-06-15T23:00:00.000Z",
        "status": "ACCEPTED",
        "creator": {
          "username": "eventorganizerco",
          "displayName": "Event Organizer Co"
        },
        "ticketTypes": [
          {
            "id": "uuid",
            "name": "VIP",
            "price": 500000,
            "stock": 100,
            "sold": 45
          }
        ],
        "_count": {
          "transactions": 45
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### GET `/events/:id`

Get event details by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "uuid",
      "name": "Jakarta Music Festival 2025",
      "bannerUrl": "https://example.com/banner.jpg",
      "location": "Jakarta Convention Center",
      "startDate": "2025-06-15T18:00:00.000Z",
      "endDate": "2025-06-15T23:00:00.000Z",
      "status": "ACCEPTED",
      "creator": {
        "username": "eventorganizerco",
        "displayName": "Event Organizer Co"
      },
      "ticketTypes": [...],
      "revenueReceivers": [
        {
          "email": "artist@example.com",
          "percentage": 60,
          "approvalStatus": "APPROVED"
        }
      ]
    }
  }
}
```

---

### GET `/events/my-events`

Get my events as EO (authenticated, EO only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "uuid",
        "name": "Jakarta Music Festival 2025",
        "status": "ACCEPTED",
        "ticketTypes": [...],
        "revenueReceivers": [...],
        "_count": {
          "transactions": 45
        }
      }
    ]
  }
}
```

---

### POST `/events/:id/complete`

Mark event as completed and initiate revenue distribution (EO only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Event completed and revenue split initiated",
  "data": {
    "txHash": "0xabc123..."
  }
}
```

---

## 🎫 Tickets

### POST `/tickets/purchase`

Purchase a ticket.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "ticketTypeId": "uuid",
  "paymentMethod": "QRIS"
}
```

**Fields:**
- `ticketTypeId` (uuid, required): Ticket type ID
- `paymentMethod` (string, required): "BANK_TRANSFER", "VA", or "QRIS"

**Response (201):**
```json
{
  "success": true,
  "message": "Transaction initiated",
  "data": {
    "transactionId": "uuid",
    "paymentToken": "abc123xyz",
    "redirectUrl": "https://app.midtrans.com/snap/v2/vtweb/abc123xyz"
  }
}
```

---

### POST `/tickets/payment-webhook`

Payment gateway webhook (Midtrans).

**Request Body:**
```json
{
  "order_id": "uuid",
  "transaction_status": "settlement",
  "fraud_status": "accept"
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

### GET `/tickets/my-tickets`

Get my tickets.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "uuid",
        "purchasePrice": 500000,
        "nftTokenId": "123",
        "nftMetadataUri": "ipfs://...",
        "eligibleForResale": true,
        "isUsed": false,
        "qrSignature": "abc123...",
        "pdfVersion": 1,
        "ticketType": {
          "name": "VIP",
          "event": {
            "id": "uuid",
            "name": "Jakarta Music Festival 2025",
            "bannerUrl": "https://...",
            "location": "Jakarta Convention Center",
            "startDate": "2025-06-15T18:00:00.000Z"
          }
        }
      }
    ]
  }
}
```

---

### GET `/tickets/:id`

Get ticket details by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "uuid",
      "purchasePrice": 500000,
      "nftTokenId": "123",
      "nftMetadataUri": "ipfs://...",
      "eligibleForResale": true,
      "isUsed": false,
      "usedAt": null,
      "qrSignature": "abc123...",
      "pdfVersion": 1,
      "ticketType": {
        "name": "VIP",
        "price": 500000,
        "event": {
          "name": "Jakarta Music Festival 2025",
          "location": "Jakarta Convention Center",
          "startDate": "2025-06-15T18:00:00.000Z"
        }
      },
      "owner": {
        "username": "johndoe",
        "displayName": "John Doe",
        "email": "john@example.com",
        "walletAddress": "0x..."
      }
    }
  }
}
```

---

### POST `/tickets/:ticketId/claim-nft`

Claim NFT to connected wallet.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "NFT claimed successfully",
  "data": {
    "txHash": "0xabc123...",
    "nftTokenId": "123",
    "explorerUrl": "https://sepolia.etherscan.io/tx/0xabc123..."
  }
}
```

---

### POST `/tickets/:ticketId/resale`

Create resale listing.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "price": 550000
}
```

**Fields:**
- `price` (number, required): Resale price (max 120% of original)

**Response (201):**
```json
{
  "success": true,
  "message": "Ticket listed for resale",
  "data": {
    "listing": {
      "id": "uuid",
      "ticketId": "uuid",
      "sellerId": "uuid",
      "price": 550000,
      "status": "ACTIVE",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

### GET `/tickets/resale/listings`

Get resale listings.

**Query Parameters:**
- `eventId` (uuid, optional): Filter by event

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "uuid",
        "price": 550000,
        "status": "ACTIVE",
        "ticket": {
          "id": "uuid",
          "purchasePrice": 500000,
          "ticketType": {
            "name": "VIP",
            "event": {
              "name": "Jakarta Music Festival 2025"
            }
          }
        }
      }
    ]
  }
}
```

---

## 👤 Users

### GET `/users/tickets`

Get my tickets (same as `/tickets/my-tickets`).

**Headers:**
```
Authorization: Bearer <token>
```

---

### GET `/users/transactions`

Get my transaction history.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "amount": 500000,
        "paymentMethod": "QRIS",
        "paymentStatus": "PAID",
        "txHash": "0xabc...",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "event": {
          "id": "uuid",
          "name": "Jakarta Music Festival 2025",
          "bannerUrl": "https://..."
        }
      }
    ]
  }
}
```

---

### GET `/users/revenue-receivers`

Get my revenue receiver records.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "receivers": [
      {
        "id": "uuid",
        "percentage": 60,
        "approvalStatus": "APPROVED",
        "bankAccount": "1234567890",
        "event": {
          "id": "uuid",
          "name": "Jakarta Music Festival 2025",
          "status": "COMPLETED"
        },
        "withdrawals": [
          {
            "id": "uuid",
            "amount": 27000000,
            "status": "COMPLETED",
            "txHash": "0xabc..."
          }
        ]
      }
    ]
  }
}
```

---

### GET `/users/dashboard`

Get dashboard statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "ticketCount": 5,
    "transactionCount": 5,
    "revenueReceiverCount": 2
  }
}
```

---

## 📱 Scan (Offline)

### GET `/scan/download-package/:eventId`

Download offline scanning package (EO only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "event_id": "uuid",
  "event_name": "Jakarta Music Festival 2025",
  "event_date": "2025-06-15T18:00:00.000Z",
  "tickets": [
    {
      "ticket_id": "uuid",
      "signature": "abc123...",
      "status": "unused",
      "owner_name": "johndoe",
      "pdf_version": 1
    }
  ],
  "blacklisted": [],
  "generated_at": "2025-06-15T12:00:00.000Z"
}
```

---

### POST `/scan/scan`

Scan ticket (offline/online).

**Request Body:**
```json
{
  "ticketId": "uuid",
  "eventId": "uuid",
  "signature": "abc123...",
  "scannerDevice": "Scanner-Gate-1"
}
```

**Response (200) - Success:**
```json
{
  "success": true,
  "result": "SUCCESS",
  "message": "WELCOME - TICKET VALID",
  "ticket": {
    "owner": "John Doe",
    "ticketType": "VIP",
    "event": "Jakarta Music Festival 2025"
  }
}
```

**Response (200) - Already Used:**
```json
{
  "success": false,
  "result": "ALREADY_USED",
  "message": "Ticket already used at 2025-06-15T18:30:00.000Z",
  "usedAt": "2025-06-15T18:30:00.000Z"
}
```

**Response (200) - Invalid:**
```json
{
  "success": false,
  "result": "INVALID_SIGNATURE",
  "message": "QR code signature is invalid or tampered"
}
```

---

### POST `/scan/upload-logs`

Upload scan logs after event (EO only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "logs": [
    {
      "ticketId": "uuid",
      "eventId": "uuid",
      "scanResult": "SUCCESS",
      "scannerDevice": "Scanner-Gate-1",
      "scannedAt": "2025-06-15T18:30:00.000Z"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "5 scan logs uploaded"
}
```

---

## ⚙️ Admin

### GET `/admin/stats`

Get platform statistics (SUPERADMIN only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalEvents": 150,
    "totalTickets": 25000,
    "totalRevenue": 5000000000,
    "totalUsers": 10000
  }
}
```

---

### POST `/admin/config`

Update platform configuration (SUPERADMIN only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "key": "tax_recipient_wallet",
  "value": "0x1234567890abcdef..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Configuration updated",
  "data": {
    "config": {
      "id": "uuid",
      "key": "tax_recipient_wallet",
      "value": "0x1234567890abcdef...",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

### GET `/admin/revenue-report/:eventId`

Get revenue report for event (SUPERADMIN/EO).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "report": {
      "eventId": "uuid",
      "eventName": "Jakarta Music Festival 2025",
      "totalRevenue": 45000000,
      "receivers": [
        {
          "email": "artist@example.com",
          "percentage": 60,
          "expectedAmount": 27000000,
          "withdrawals": [
            {
              "id": "uuid",
              "amount": 27000000,
              "status": "COMPLETED",
              "txHash": "0xabc..."
            }
          ]
        }
      ]
    }
  }
}
```

---

### POST `/admin/withdrawal`

Process withdrawal for revenue receiver (SUPERADMIN only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "receiverId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Withdrawal processed successfully",
  "data": {
    "withdrawal": {
      "id": "uuid",
      "amount": 27000000,
      "status": "COMPLETED"
    },
    "withdrawTxHash": "0xabc123...",
    "burnTxHash": "0xdef456..."
  }
}
```

---

## ❌ Error Responses

All error responses follow this format:

**Response (4xx/5xx):**
```json
{
  "success": false,
  "message": "Error message here",
  "errors": []
}
```

### Common Error Codes

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate)
- **500 Internal Server Error**: Server error

### Example Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Event not found"
}
```

**400 Validation Error:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Email is required",
    "Password must be at least 8 characters"
  ]
}
```

---

## 📝 Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All monetary values are in Indonesian Rupiah (IDR)
3. Pagination starts from page 1
4. Default items per page: 10
5. Maximum items per page: 100

## 🔗 Related Resources

- [Smart Contract Documentation](./CONTRACTS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)