# MyMineTicketKu API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

Most endpoints require Bearer token authentication.

```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### 1.1 Register User

**POST** `/auth/register`

Register new user (EO or regular user).

**Request Body:**
```json
{
  "username": "johndoe",
  "displayName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "USER"
}
```

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

### 1.2 Login

**POST** `/auth/login`

Login with email/username and password.

**Request Body:**
```json
{
  "identifier": "john@example.com",
  "password": "password123"
}
```

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

### 1.3 Get Profile

**GET** `/auth/profile`

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
      "walletAddress": null,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 1.4 Update Profile

**PUT** `/auth/profile`

Update user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "displayName": "John Updated",
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
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
      "displayName": "John Updated",
      "email": "john@example.com",
      "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
    }
  }
}
```

---

### 1.5 Connect Wallet

**POST** `/auth/connect-wallet`

Connect cryptocurrency wallet to account.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
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
      "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
    }
  }
}
```

---

## 2. Event Endpoints

### 2.1 Create Event

**POST** `/events`

Create new event (EO only).

**Headers:**
```
Authorization: Bearer <eo_token>
```

**Request Body:**
```json
{
  "name": "Music Festival 2025",
  "bannerUrl": "https://example.com/banner.jpg",
  "location": "Jakarta Convention Center",
  "startDate": "2025-12-01T18:00:00Z",
  "endDate": "2025-12-01T23:00:00Z",
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
      "email": "sponsor@example.com",
      "percentage": 10
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Event created successfully. Tax (10%) and Platform Fee (2.5%) will be automatically deducted.",
  "data": {
    "event": {
      "id": "uuid",
      "name": "Music Festival 2025",
      "bannerUrl": "https://example.com/banner.jpg",
      "location": "Jakarta Convention Center",
      "startDate": "2025-12-01T18:00:00.000Z",
      "endDate": "2025-12-01T23:00:00.000Z",
      "status": "PENDING_APPROVAL",
      "creatorId": "uuid",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 2.2 Approve Revenue Split

**POST** `/events/:eventId/approve/:email`

Approve or reject revenue split invitation.

**Request Body:**
```json
{
  "approved": true,
  "bankAccount": "1234567890",
  "bankName": "Bank BCA",
  "accountHolder": "Artist Name"
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

### 2.3 Configure Tickets

**POST** `/events/:eventId/tickets`

Configure ticket types for event (EO only).

**Headers:**
```
Authorization: Bearer <eo_token>
```

**Request Body:**
```json
{
  "ticketTypes": [
    {
      "name": "VIP",
      "price": 500000,
      "stock": 100,
      "saleStartDate": "2025-11-01T00:00:00Z",
      "saleEndDate": "2025-12-01T17:00:00Z"
    },
    {
      "name": "Regular",
      "price": 250000,
      "stock": 500,
      "saleStartDate": "2025-11-01T00:00:00Z",
      "saleEndDate": "2025-12-01T17:00:00Z"
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
        "saleStartDate": "2025-11-01T00:00:00.000Z",
        "saleEndDate": "2025-12-01T17:00:00.000Z"
      }
    ]
  }
}
```

---

### 2.4 Get All Events

**GET** `/events?page=1&limit=10&status=ACCEPTED&location=Jakarta`

Get list of events with pagination and filters.

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `status` (optional, default: ACCEPTED)
- `location` (optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "uuid",
        "name": "Music Festival 2025",
        "bannerUrl": "https://example.com/banner.jpg",
        "location": "Jakarta Convention Center",
        "startDate": "2025-12-01T18:00:00.000Z",
        "endDate": "2025-12-01T23:00:00.000Z",
        "status": "ACCEPTED",
        "creator": {
          "username": "eo_user",
          "displayName": "EO Company"
        },
        "ticketTypes": [],
        "_count": {
          "transactions": 0
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 2.5 Get Event by ID

**GET** `/events/:id`

Get detailed event information.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "uuid",
      "name": "Music Festival 2025",
      "bannerUrl": "https://example.com/banner.jpg",
      "location": "Jakarta Convention Center",
      "startDate": "2025-12-01T18:00:00.000Z",
      "endDate": "2025-12-01T23:00:00.000Z",
      "status": "ACCEPTED",
      "creator": {
        "username": "eo_user",
        "displayName": "EO Company"
      },
      "ticketTypes": [
        {
          "id": "uuid",
          "name": "VIP",
          "price": 500000,
          "stock": 100,
          "sold": 0
        }
      ],
      "revenueReceivers": [
        {
          "email": "artist@example.com",
          "percentage": 60,
          "approvalStatus": "APPROVED",
          "walletAddress": "0x..."
        }
      ]
    }
  }
}
```

---

### 2.6 Get My Events

**GET** `/events/my-events`

Get events created by current EO.

**Headers:**
```
Authorization: Bearer <eo_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "uuid",
        "name": "Music Festival 2025",
        "status": "ACCEPTED",
        "ticketTypes": [],
        "revenueReceivers": [],
        "_count": {
          "transactions": 0
        }
      }
    ]
  }
}
```

---

### 2.7 Complete Event

**POST** `/events/:id/complete`

Mark event as completed and trigger revenue split (EO only).

**Headers:**
```
Authorization: Bearer <eo_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Event completed and revenue split initiated",
  "data": {
    "txHash": "0xabcdef123456..."
  }
}
```

---

## 3. Ticket Endpoints

### 3.1 Purchase Ticket

**POST** `/tickets/purchase`

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

**Response (200):**
```json
{
  "success": true,
  "message": "Transaction started",
  "data": {
    "transaction": {
      "id": "uuid",
      "amount": 500000,
      "paymentStatus": "PENDING"
    },
    "payment": {
      "token": "midtrans-token",
      "redirect_url": "https://payment-gateway.com/..."
    }
  }
}
```

---

### 3.2 Payment Webhook

**POST** `/tickets/payment-webhook`

Webhook endpoint for payment gateway (Midtrans).

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
  "success": true,
  "message": "Webhook processed"
}
```

---

### 3.3 Get My Tickets

**GET** `/tickets/my-tickets`

Get all tickets owned by current user.

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
        "nftTokenId": "0",
        "nftMetadataUri": "ipfs://...",
        "eligibleForResale": true,
        "isUsed": false,
        "ticketType": {
          "name": "VIP",
          "event": {
            "id": "uuid",
            "name": "Music Festival 2025",
            "bannerUrl": "https://example.com/banner.jpg",
            "location": "Jakarta Convention Center",
            "startDate": "2025-12-01T18:00:00.000Z"
          }
        }
      }
    ]
  }
}
```

---

### 3.4 Get Ticket Detail

**GET** `/tickets/:id`

Get ticket detail with QR code data.

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
      "nftTokenId": "0",
      "isUsed": false,
      "ticketType": {
        "name": "VIP",
        "event": {
          "name": "Music Festival 2025"
        }
      }
    },
    "qrData": {
      "ticket_id": "uuid",
      "event_id": "uuid",
      "signature": "hmac-signature"
    }
  }
}
```

---

### 3.5 Claim NFT

**POST** `/tickets/:ticketId/claim-nft`

Claim NFT to personal wallet.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "NFT claimed successfully",
  "data": {
    "txHash": "0xabcdef123456..."
  }
}
```

---

### 3.6 Create Resale Listing

**POST** `/tickets/:ticketId/resale`

List ticket for resale (max 120% of original price).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "price": 600000
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Resale listing created",
  "data": {
    "listing": {
      "id": "uuid",
      "ticketId": "uuid",
      "price": 600000,
      "status": "ACTIVE",
      "ticket": {
        "ticketType": {
          "name": "VIP",
          "event": {
            "name": "Music Festival 2025"
          }
        }
      }
    }
  }
}
```

---

### 3.7 Get Resale Listings

**GET** `/tickets/resale/listings?eventId=uuid`

Get available resale listings.

**Query Parameters:**
- `eventId` (optional) - Filter by event

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "uuid",
        "price": 600000,
        "status": "ACTIVE",
        "ticket": {
          "ticketType": {
            "name": "VIP",
            "event": {
              "name": "Music Festival 2025"
            }
          }
        },
        "seller": {
          "username": "seller_user",
          "displayName": "Seller Name"
        }
      }
    ]
  }
}
```

---

## 4. User Endpoints

### 4.1 Get My Transactions

**GET** `/users/transactions`

Get transaction history.

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
        "createdAt": "2025-01-01T00:00:00.000Z",
        "event": {
          "id": "uuid",
          "name": "Music Festival 2025",
          "bannerUrl": "https://example.com/banner.jpg"
        }
      }
    ]
  }
}
```

---

### 4.2 Get My Revenue Receivers

**GET** `/users/revenue-receivers`

Get revenue receiver records for current user.

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
        "email": "user@example.com",
        "percentage": 60,
        "approvalStatus": "APPROVED",
        "walletAddress": "0x...",
        "event": {
          "id": "uuid",
          "name": "Music Festival 2025",
          "status": "COMPLETED"
        },
        "withdrawals": []
      }
    ]
  }
}
```

---

### 4.3 Get Dashboard Stats

**GET** `/users/dashboard`

Get user dashboard statistics.

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

## 5. Admin Endpoints (SUPERADMIN only)

### 5.1 Get Platform Stats

**GET** `/admin/stats`

Get platform-wide statistics.

**Headers:**
```
Authorization: Bearer <superadmin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalEvents": 10,
    "totalTickets": 150,
    "totalRevenue": 75000000,
    "totalUsers": 200
  }
}
```

---

### 5.2 Update Platform Config

**POST** `/admin/config`

Update platform configuration.

**Headers:**
```
Authorization: Bearer <superadmin_token>
```

**Request Body:**
```json
{
  "key": "max_resale_percentage",
  "value": "120"
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
      "key": "max_resale_percentage",
      "value": "120"
    }
  }
}
```

---

### 5.3 Get Revenue Report

**GET** `/admin/revenue-report/:eventId`

Get detailed revenue report for an event.

**Headers:**
```
Authorization: Bearer <superadmin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "report": {
      "eventId": "uuid",
      "eventName": "Music Festival 2025",
      "totalRevenue": 50000000,
      "receivers": [
        {
          "email": "artist@example.com",
          "walletAddress": "0x...",
          "percentage": 60,
          "expectedAmount": 30000000,
          "withdrawals": []
        }
      ]
    }
  }
}
```

---

### 5.4 Process Receiver Withdrawal

**POST** `/admin/withdrawal/receiver`

Process withdrawal for a revenue receiver.

**Headers:**
```
Authorization: Bearer <superadmin_token>
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
      "amount": 30000000,
      "status": "COMPLETED"
    },
    "withdrawTxHash": "0xabcdef...",
    "burnTxHash": "0x123456..."
  }
}
```

---

### 5.5 Process Tax Withdrawal

**POST** `/admin/withdrawal/tax`

Withdraw accumulated tax to government account.

**Headers:**
```
Authorization: Bearer <superadmin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tax withdrawal processed",
  "data": {
    "amount": 5000000,
    "transfer": {
      "success": true,
      "method": "bank_transfer",
      "transferId": "TRF-123456",
      "bankAccount": {
        "bankName": "Bank BRI",
        "accountNumber": "1234567890",
        "accountHolder": "Kementerian Keuangan RI"
      }
    }
  }
}
```

---

### 5.6 Process Platform Withdrawal

**POST** `/admin/withdrawal/platform`

Withdraw platform fees.

**Headers:**
```
Authorization: Bearer <superadmin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Platform fee withdrawal processed",
  "data": {
    "amount": 1250000,
    "transfer": {
      "success": true,
      "method": "bank_transfer",
      "transferId": "TRF-789012",
      "bankAccount": {
        "bankName": "Bank BCA",
        "accountNumber": "0987654321",
        "accountHolder": "PT MyMineTicketKu"
      }
    }
  }
}
```

---

## 6. Scan Endpoints

### 6.1 Download Offline Package

**GET** `/scan/download-package/:eventId`

Download offline ticket scanning package for event (EO only).

**Headers:**
```
Authorization: Bearer <eo_token>
```

**Response (200):**
```json
{
  "event_id": "uuid",
  "event_name": "Music Festival 2025",
  "event_date": "2025-12-01T18:00:00.000Z",
  "tickets": [
    {
      "ticket_id": "uuid",
      "signature": "hmac-signature",
      "status": "unused",
      "owner_name": "johndoe",
      "pdf_version": 1
    }
  ],
  "blacklisted": [],
  "generated_at": "2025-01-01T00:00:00.000Z"
}
```

---

### 6.2 Scan Ticket

**POST** `/scan/scan`

Scan ticket QR code (online or offline mode).

**Request Body:**
```json
{
  "ticketId": "uuid",
  "eventId": "uuid",
  "signature": "hmac-signature",
  "scannerDevice": "Scanner-1"
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
    "event": "Music Festival 2025"
  }
}
```

**Response (200) - Already Used:**
```json
{
  "success": false,
  "result": "ALREADY_USED",
  "message": "Ticket already used at 2025-12-01T18:30:00.000Z",
  "usedAt": "2025-12-01T18:30:00.000Z"
}
```

---

### 6.3 Upload Scan Logs

**POST** `/scan/upload-logs`

Upload offline scan logs after event (EO only).

**Headers:**
```
Authorization: Bearer <eo_token>
```

**Request Body:**
```json
{
  "logs": [
    {
      "ticketId": "uuid",
      "eventId": "uuid",
      "scanResult": "SUCCESS",
      "scannerDevice": "Scanner-1",
      "scannedAt": "2025-12-01T18:30:00.000Z"
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

## Error Responses

All endpoints may return error responses in this format:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["Field X is required"]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
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
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Rate Limiting

No rate limiting implemented yet (TODO for production).

## Pagination

List endpoints support pagination via query parameters:
- `page` (default: 1)
- `limit` (default: 10)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```