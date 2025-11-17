# MyMineTicketKu API - Complete Testing Guide

## Base URL
```
http://localhost:5000
```

---

## 1. AUTHENTICATION

### 1.1 Register User (Buyer)
**Method:** `POST`  
**Endpoint:** `/api/auth/register`  
**Headers:** 
```json
Content-Type: application/json
```

**Body:**
```json
{
  "username": "buyer_test",
  "displayName": "Test Buyer",
  "email": "buyer@test.com",
  "password": "password123",
  "role": "USER"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "buyer_test",
      "email": "buyer@test.com",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.2 Register Event Organizer
**Method:** `POST`  
**Endpoint:** `/api/auth/register`  
**Headers:** 
```json
Content-Type: application/json
```

**Body:**
```json
{
  "username": "eo_test",
  "displayName": "Test Event Organizer",
  "email": "eo@test.com",
  "password": "password123",
  "role": "EO"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "eo_test",
      "email": "eo@test.com",
      "role": "EO",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.3 Register SuperAdmin
**Method:** `POST`  
**Endpoint:** `/api/auth/register`  
**Headers:** 
```json
Content-Type: application/json
```

**Body:**
```json
{
  "username": "admin_test",
  "displayName": "Test Admin",
  "email": "admin@test.com",
  "password": "password123",
  "role": "SUPERADMIN"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "admin_test",
      "email": "admin@test.com",
      "role": "SUPERADMIN",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.4 Login
**Method:** `POST`  
**Endpoint:** `/api/auth/login`  
**Headers:** 
```json
Content-Type: application/json
```

**Body:**
```json
{
  "identifier": "buyer@test.com",
  "password": "password123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "buyer_test",
      "email": "buyer@test.com",
      "role": "USER",
      "walletAddress": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.5 Get Profile
**Method:** `GET`  
**Endpoint:** `/api/auth/profile`  
**Headers:** 
```json
Authorization: Bearer {token}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "buyer_test",
      "displayName": "Test Buyer",
      "email": "buyer@test.com",
      "role": "USER",
      "walletAddress": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 1.6 Connect Wallet
**Method:** `POST`  
**Endpoint:** `/api/auth/connect-wallet`  
**Headers:** 
```json
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Wallet connected successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "buyer_test",
      "email": "buyer@test.com",
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  }
}
```

---

## 2. EVENT MANAGEMENT (EO Only)

### 2.1 Create Event with Revenue Receivers
**Method:** `POST`  
**Endpoint:** `/api/events`  
**Headers:** 
```json
Authorization: Bearer {eoToken}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Summer Music Festival 2024",
  "bannerUrl": "https://example.com/banner.jpg",
  "location": "Jakarta Convention Center",
  "startDate": "2024-08-15T18:00:00.000Z",
  "endDate": "2024-08-15T23:00:00.000Z",
  "receivers": [
    {
      "email": "receiver1@test.com",
      "percentage": 60
    },
    {
      "email": "receiver2@test.com",
      "percentage": 40
    }
  ]
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Event created successfully. Platform Fee (2.5%) will be automatically deducted.",
  "data": {
    "event": {
      "id": "event-uuid",
      "name": "Summer Music Festival 2024",
      "bannerUrl": "https://example.com/banner.jpg",
      "location": "Jakarta Convention Center",
      "startDate": "2024-08-15T18:00:00.000Z",
      "endDate": "2024-08-15T23:00:00.000Z",
      "status": "PENDING_APPROVAL",
      "creatorId": "eo-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 2.2 Approve Revenue Split (Receiver)
**Method:** `POST`  
**Endpoint:** `/api/events/{eventId}/approve/{email}`  
**Headers:** 
```json
Content-Type: application/json
```

**Body:**
```json
{
  "approved": true,
  "bankAccount": "1234567890",
  "bankName": "Bank Mandiri",
  "accountHolder": "John Doe"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Revenue split approved"
}
```

**Body (Rejection):**
```json
{
  "approved": false,
  "rejectionReason": "I don't want to participate"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Revenue split rejected"
}
```

---

### 2.3 Configure Ticket Types
**Method:** `POST`  
**Endpoint:** `/api/events/{eventId}/tickets`  
**Headers:** 
```json
Authorization: Bearer {eoToken}
Content-Type: application/json
```

**Body:**
```json
{
  "ticketTypes": [
    {
      "name": "VIP",
      "price": 500000,
      "stock": 100,
      "saleStartDate": "2024-07-01T00:00:00.000Z",
      "saleEndDate": "2024-08-15T17:00:00.000Z"
    },
    {
      "name": "Regular",
      "price": 250000,
      "stock": 500,
      "saleStartDate": "2024-07-01T00:00:00.000Z",
      "saleEndDate": "2024-08-15T17:00:00.000Z"
    }
  ]
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Tickets configured successfully",
  "data": {
    "ticketTypes": [
      {
        "id": "ticket-type-uuid-1",
        "eventId": "event-uuid",
        "name": "VIP",
        "price": 500000,
        "stock": 100,
        "sold": 0,
        "saleStartDate": "2024-07-01T00:00:00.000Z",
        "saleEndDate": "2024-08-15T17:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "ticket-type-uuid-2",
        "eventId": "event-uuid",
        "name": "Regular",
        "price": 250000,
        "stock": 500,
        "sold": 0,
        "saleStartDate": "2024-07-01T00:00:00.000Z",
        "saleEndDate": "2024-08-15T17:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 2.4 Get All Events (Public)
**Method:** `GET`  
**Endpoint:** `/api/events?page=1&limit=10&status=ACCEPTED&location=Jakarta`  
**Headers:** None

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event-uuid",
        "name": "Summer Music Festival 2024",
        "bannerUrl": "https://example.com/banner.jpg",
        "location": "Jakarta Convention Center",
        "startDate": "2024-08-15T18:00:00.000Z",
        "endDate": "2024-08-15T23:00:00.000Z",
        "status": "ACCEPTED",
        "creatorId": "eo-uuid",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "creator": {
          "username": "eo_test",
          "displayName": "Test Event Organizer"
        },
        "ticketTypes": [
          {
            "id": "ticket-type-uuid-1",
            "name": "VIP",
            "price": 500000,
            "stock": 100,
            "sold": 0
          }
        ],
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
**Method:** `GET`  
**Endpoint:** `/api/events/{eventId}`  
**Headers:** None

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event-uuid",
      "name": "Summer Music Festival 2024",
      "bannerUrl": "https://example.com/banner.jpg",
      "location": "Jakarta Convention Center",
      "startDate": "2024-08-15T18:00:00.000Z",
      "endDate": "2024-08-15T23:00:00.000Z",
      "status": "ACCEPTED",
      "creatorId": "eo-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "creator": {
        "username": "eo_test",
        "displayName": "Test Event Organizer"
      },
      "ticketTypes": [
        {
          "id": "ticket-type-uuid-1",
          "name": "VIP",
          "price": 500000,
          "stock": 100,
          "sold": 0
        }
      ],
      "revenueReceivers": [
        {
          "email": "receiver1@test.com",
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

### 2.6 Get My Events (EO)
**Method:** `GET`  
**Endpoint:** `/api/events/my-events`  
**Headers:** 
```json
Authorization: Bearer {eoToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event-uuid",
        "name": "Summer Music Festival 2024",
        "status": "ACCEPTED",
        "ticketTypes": [...],
        "revenueReceivers": [...],
        "_count": {
          "transactions": 5
        }
      }
    ]
  }
}
```

---

### 2.7 Complete Event (EO)
**Method:** `POST`  
**Endpoint:** `/api/events/{eventId}/complete`  
**Headers:** 
```json
Authorization: Bearer {eoToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Event completed and revenue split initiated",
  "data": {
    "txHash": "0x1234567890abcdef..."
  }
}
```

---

### 2.8 Export Event Audit (EO)
**Method:** `GET`  
**Endpoint:** `/api/events/{eventId}/export-audit`  
**Headers:** 
```json
Authorization: Bearer {eoToken}
```

**Body:** None

**Expected Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename=audit-Summer-Music-Festival-2024-1234567890.pdf

[PDF Binary Data]
```

---

## 3. TICKET PURCHASE & MANAGEMENT

### 3.1 Purchase Ticket
**Method:** `POST`  
**Endpoint:** `/api/tickets/purchase`  
**Headers:** 
```json
Authorization: Bearer {userToken}
Content-Type: application/json
```

**Body:**
```json
{
  "ticketTypeId": "ticket-type-uuid-1",
  "paymentMethod": "BANK_TRANSFER"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Transaction initiated",
  "data": {
    "transactionId": "transaction-uuid",
    "paymentToken": "midtrans-token-123",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/midtrans-token-123"
  }
}
```

---

### 3.2 Payment Webhook (Midtrans)
**Method:** `POST`  
**Endpoint:** `/api/tickets/payment-webhook`  
**Headers:** 
```json
Content-Type: application/json
```

**Body:**
```json
{
  "transaction_status": "settlement",
  "order_id": "transaction-uuid",
  "gross_amount": "500000",
  "fraud_status": "accept"
}
```

**Expected Response (200):**
```json
{
  "success": true
}
```

---

### 3.3 Get My Tickets
**Method:** `GET`  
**Endpoint:** `/api/tickets/my-tickets`  
**Headers:** 
```json
Authorization: Bearer {userToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket-uuid",
        "ticketTypeId": "ticket-type-uuid-1",
        "ownerId": "user-uuid",
        "purchasePrice": 500000,
        "nftTokenId": "0",
        "nftMetadataUri": "https://ipfs.io/ipfs/QmXxx...",
        "eligibleForResale": true,
        "isUsed": false,
        "usedAt": null,
        "qrSignature": "abc123...",
        "pdfVersion": 1,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "ticketType": {
          "id": "ticket-type-uuid-1",
          "name": "VIP",
          "price": 500000,
          "event": {
            "id": "event-uuid",
            "name": "Summer Music Festival 2024",
            "bannerUrl": "https://example.com/banner.jpg",
            "location": "Jakarta Convention Center",
            "startDate": "2024-08-15T18:00:00.000Z",
            "endDate": "2024-08-15T23:00:00.000Z"
          }
        }
      }
    ]
  }
}
```

---

### 3.4 Get Ticket Detail
**Method:** `GET`  
**Endpoint:** `/api/tickets/{ticketId}`  
**Headers:** 
```json
Authorization: Bearer {userToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "ticket-uuid",
      "ticketTypeId": "ticket-type-uuid-1",
      "ownerId": "user-uuid",
      "purchasePrice": 500000,
      "nftTokenId": "0",
      "nftMetadataUri": "https://ipfs.io/ipfs/QmXxx...",
      "eligibleForResale": true,
      "isUsed": false,
      "usedAt": null,
      "qrSignature": "abc123...",
      "pdfVersion": 1,
      "ticketType": {
        "name": "VIP",
        "price": 500000,
        "event": {
          "name": "Summer Music Festival 2024",
          "location": "Jakarta Convention Center"
        }
      },
      "owner": {
        "username": "buyer_test",
        "displayName": "Test Buyer",
        "email": "buyer@test.com",
        "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
      }
    }
  }
}
```

---

### 3.5 Claim NFT
**Method:** `POST`  
**Endpoint:** `/api/tickets/{ticketId}/claim-nft`  
**Headers:** 
```json
Authorization: Bearer {userToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "message": "NFT claimed successfully",
  "data": {
    "txHash": "0x1234567890abcdef...",
    "nftTokenId": "0",
    "explorerUrl": "https://sepolia.etherscan.io/tx/0x1234567890abcdef..."
  }
}
```

---

## 4. TICKET RESALE

### 4.1 Create Resale Listing
**Method:** `POST`  
**Endpoint:** `/api/tickets/{ticketId}/resale`  
**Headers:** 
```json
Authorization: Bearer {userToken}
Content-Type: application/json
```

**Body:**
```json
{
  "price": 550000
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Ticket listed for resale",
  "data": {
    "listing": {
      "id": "listing-uuid",
      "ticketId": "ticket-uuid",
      "sellerId": "user-uuid",
      "price": 550000,
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 4.2 Get Resale Listings
**Method:** `GET`  
**Endpoint:** `/api/tickets/resale/listings?eventId={eventId}`  
**Headers:** None

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "listing-uuid",
        "ticketId": "ticket-uuid",
        "sellerId": "user-uuid",
        "price": 550000,
        "status": "ACTIVE",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "ticket": {
          "id": "ticket-uuid",
          "purchasePrice": 500000,
          "ticketType": {
            "name": "VIP",
            "price": 500000,
            "event": {
              "name": "Summer Music Festival 2024",
              "location": "Jakarta Convention Center",
              "startDate": "2024-08-15T18:00:00.000Z"
            }
          }
        }
      }
    ]
  }
}
```

---

### 4.3 Purchase Resale Ticket
**Method:** `POST`  
**Endpoint:** `/api/tickets/resale/{listingId}/purchase`  
**Headers:** 
```json
Authorization: Bearer {userToken}
Content-Type: application/json
```

**Body:**
```json
{
  "paymentMethod": "BANK_TRANSFER"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Resale transaction initiated",
  "data": {
    "transactionId": "resale-transaction-uuid",
    "paymentToken": "midtrans-token-456",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/midtrans-token-456"
  }
}
```

---

### 4.4 Resale Payment Webhook
**Method:** `POST`  
**Endpoint:** `/api/tickets/resale/payment-webhook`  
**Headers:** 
```json
Content-Type: application/json
```

**Body:**
```json
{
  "transaction_status": "settlement",
  "order_id": "resale-transaction-uuid",
  "gross_amount": "550000",
  "fraud_status": "accept"
}
```

**Expected Response (200):**
```json
{
  "success": true
}
```

---

## 5. TICKET SCANNING

### 5.1 Scan Ticket (QR Code)
**Method:** `POST`  
**Endpoint:** `/api/scan/scan`  
**Headers:** 
```json
Content-Type: application/json
```

**Body:**
```json
{
  "ticketId": "ticket-uuid",
  "eventId": "event-uuid",
  "signature": "abc123..."
}
```

**Expected Response - Valid (200):**
```json
{
  "success": true,
  "result": "SUCCESS",
  "message": "WELCOME - TICKET VALID",
  "ticket": {
    "owner": "Test Buyer",
    "ticketType": "VIP",
    "event": "Summer Music Festival 2024"
  }
}
```

**Expected Response - Already Used (200):**
```json
{
  "success": false,
  "result": "ALREADY_USED",
  "message": "Ticket already used at 2024-01-01T10:30:00.000Z",
  "usedAt": "2024-01-01T10:30:00.000Z"
}
```

**Expected Response - Invalid Signature (200):**
```json
{
  "success": false,
  "result": "INVALID_SIGNATURE",
  "message": "QR code signature is invalid or tampered"
}
```

**Expected Response - Blacklisted (200):**
```json
{
  "success": false,
  "result": "BLACKLISTED",
  "message": "This ticket has been blacklisted"
}
```

---

### 5.2 Get Scan Logs (EO)
**Method:** `GET`  
**Endpoint:** `/api/scan/logs/{eventId}`  
**Headers:** 
```json
Authorization: Bearer {eoToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-uuid",
        "ticketId": "ticket-uuid",
        "eventId": "event-uuid",
        "scannedAt": "2024-01-01T10:30:00.000Z",
        "scannerDevice": null,
        "scanResult": "SUCCESS",
        "ticket": {
          "id": "ticket-uuid",
          "owner": {
            "username": "buyer_test",
            "displayName": "Test Buyer"
          },
          "ticketType": {
            "name": "VIP"
          }
        }
      }
    ]
  }
}
```

---

## 6. USER DASHBOARD

### 6.1 Get My Tickets
**Method:** `GET`  
**Endpoint:** `/api/users/tickets`  
**Headers:** 
```json
Authorization: Bearer {userToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "tickets": [...]
  }
}
```

---

### 6.2 Get My Transactions
**Method:** `GET`  
**Endpoint:** `/api/users/transactions`  
**Headers:** 
```json
Authorization: Bearer {userToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "transaction-uuid",
        "ticketTypeId": "ticket-type-uuid-1",
        "ticketId": "ticket-uuid",
        "buyerId": "user-uuid",
        "eventId": "event-uuid",
        "amount": 500000,
        "paymentMethod": "BANK_TRANSFER",
        "paymentStatus": "PAID",
        "externalTxId": "midtrans-token-123",
        "txHash": "0x1234...",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "event": {
          "id": "event-uuid",
          "name": "Summer Music Festival 2024",
          "bannerUrl": "https://example.com/banner.jpg"
        }
      }
    ]
  }
}
```

---

### 6.3 Get My Revenue Receivers
**Method:** `GET`  
**Endpoint:** `/api/users/revenue-receivers`  
**Headers:** 
```json
Authorization: Bearer {userToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "receivers": [
      {
        "id": "receiver-uuid",
        "eventId": "event-uuid",
        "email": "receiver1@test.com",
        "percentage": 60,
        "approvalStatus": "APPROVED",
        "walletAddress": "0x...",
        "event": {
          "id": "event-uuid",
          "name": "Summer Music Festival 2024",
          "status": "COMPLETED"
        },
        "withdrawals": [
          {
            "id": "withdrawal-uuid",
            "amount": 3000000,
            "status": "COMPLETED",
            "createdAt": "2024-01-01T00:00:00.000Z"
          }
        ]
      }
    ]
  }
}
```

---

### 6.4 Get Dashboard Stats
**Method:** `GET`  
**Endpoint:** `/api/users/dashboard`  
**Headers:** 
```json
Authorization: Bearer {userToken}
```

**Body:** None

**Expected Response (200):**
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

## 7. ADMIN OPERATIONS

### 7.1 Get Platform Stats
**Method:** `GET`  
**Endpoint:** `/api/admin/stats`  
**Headers:** 
```json
Authorization: Bearer {adminToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "totalEvents": 10,
    "totalTickets": 150,
    "totalRevenue": 75000000,
    "totalUsers": 250
  }
}
```

---

### 7.2 Get Revenue Report
**Method:** `GET`  
**Endpoint:** `/api/admin/revenue-report/{eventId}`  
**Headers:** 
```json
Authorization: Bearer {adminToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "report": {
      "eventId": "event-uuid",
      "eventName": "Summer Music Festival 2024",
      "totalRevenue": 50000000,
      "receivers": [
        {
          "email": "receiver1@test.com",
          "walletAddress": "0x...",
          "percentage": 60,
          "expectedAmount": 30000000,
          "withdrawals": [
            {
              "id": "withdrawal-uuid",
              "amount": 30000000,
              "status": "COMPLETED",
              "createdAt": "2024-01-01T00:00:00.000Z"
            }
          ]
        }
      ]
    }
  }
}
```

---

### 7.3 Process Receiver Withdrawal
**Method:** `POST`  
**Endpoint:** `/api/admin/withdrawal/receiver`  
**Headers:** 
```json
Authorization: Bearer {adminToken}
Content-Type: application/json
```

**Body:**
```json
{
  "receiverId": "receiver-uuid"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Withdrawal processed successfully",
  "data": {
    "withdrawal": {
      "id": "withdrawal-uuid",
      "receiverId": "receiver-uuid",
      "amount": 30000000,
      "wIDRAmount": 30000000,
      "status": "COMPLETED",
      "txHash": "0x1234...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "withdrawTxHash": "0x1234...",
    "burnTxHash": "0x5678..."
  }
}
```

---

### 7.4 Process Tax Withdrawal
**Method:** `POST`  
**Endpoint:** `/api/admin/withdrawal/tax`  
**Headers:** 
```json
Authorization: Bearer {adminToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Tax withdrawal processed",
  "data": {
    "amount": 5000000,
    "transfer": {
      "success": true,
      "method": "bank_transfer",
      "transferId": "TRF-1234567890",
      "amount": 5000000,
      "bankAccount": {
        "bankName": "Bank Mandiri",
        "accountNumber": "9876543210",
        "accountHolder": "Tax Authority"
      },
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 7.5 Process Platform Fee Withdrawal
**Method:** `POST`  
**Endpoint:** `/api/admin/withdrawal/platform`  
**Headers:** 
```json
Authorization: Bearer {adminToken}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Platform fee withdrawal processed",
  "data": {
    "amount": 1250000,
    "transfer": {
      "success": true,
      "method": "bank_transfer",
      "transferId": "TRF-0987654321",
      "amount": 1250000,
      "bankAccount": {
        "bankName": "Bank BCA",
        "accountNumber": "1234567890",
        "accountHolder": "MyMineTicketKu Platform"
      },
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 7.6 Update Platform Config
**Method:** `POST`  
**Endpoint:** `/api/admin/config`  
**Headers:** 
```json
Authorization: Bearer {adminToken}
Content-Type: application/json
```

**Body:**
```json
{
  "key": "platform_fee_percentage",
  "value": "2.5"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Configuration updated",
  "data": {
    "config": {
      "id": "config-uuid",
      "key": "platform_fee_percentage",
      "value": "2.5",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 8. HEALTH CHECK

### 8.1 Check API Health
**Method:** `GET`  
**Endpoint:** `/health`  
**Headers:** None

**Body:** None

**Expected Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## TEST FLOW SEQUENCE

### Complete Testing Flow:

#### Phase 1: Setup & Authentication
1. Register User (Buyer) → Save `userToken`
2. Register EO → Save `eoToken`
3. Register SuperAdmin → Save `adminToken`
4. Login as User → Verify token
5. Connect Wallet (User) → Add wallet address

#### Phase 2: Event Creation & Approval
6. Create Event (EO) → Save `eventId`, Status should be `PENDING_APPROVAL`
7. Approve Revenue Split (Receiver 1) → Provide bank details
8. Approve Revenue Split (Receiver 2) → Provide bank details
9. Verify Event Status Changed to `ACCEPTED`
10. Configure Ticket Types (EO) → Save `ticketTypeId`

#### Phase 3: Ticket Purchase & Payment
11. Get All Events (Public) → Verify event is visible
12. Purchase Ticket (User) → Save `transactionId` and `paymentToken`
13. Simulate Payment Webhook → Order status = "settlement"
14. Get My Tickets (User) → Verify ticket received with `nftTokenId`
15. Get Ticket Detail → Verify all ticket info

#### Phase 4: NFT Claim
16. Claim NFT (User) → Get `txHash` and verify on blockchain
17. Verify NFT ownership changed

#### Phase 5: Ticket Resale
18. Create Resale Listing (User) → Save `listingId`
19. Get Resale Listings → Verify listing appears
20. Register Another User (Buyer 2) → Save `buyer2Token`
21. Purchase Resale Ticket (Buyer 2) → Save resale `transactionId`
22. Simulate Resale Payment Webhook
23. Verify Ticket Ownership Transfer
24. Verify Old QR is Blacklisted
25. Get My Tickets (Buyer 2) → Verify new ticket with new QR

#### Phase 6: Event Scanning
26. Scan Ticket (Valid QR) → Should return SUCCESS
27. Scan Ticket (Same QR Again) → Should return ALREADY_USED
28. Scan Ticket (Blacklisted QR) → Should return BLACKLISTED
29. Scan Ticket (Invalid Signature) → Should return INVALID_SIGNATURE
30. Get Scan Logs (EO) → Verify all scan attempts logged

#### Phase 7: Event Completion & Withdrawal
31. Complete Event (EO) → Trigger revenue split on blockchain
32. Get Revenue Report (Admin) → Verify split calculations
33. Process Receiver Withdrawal (Admin) → Withdraw to bank for Receiver 1
34. Process Receiver Withdrawal (Admin) → Withdraw to bank for Receiver 2
35. Get My Revenue Receivers (Receiver 1) → Verify withdrawal status

#### Phase 8: Admin Operations
36. Get Platform Stats (Admin) → Verify totals
37. Process Tax Withdrawal (Admin) → 10% tax withdrawal
38. Process Platform Fee Withdrawal (Admin) → 2.5% platform fee
39. Export Event Audit (EO) → Download PDF report

#### Phase 9: User Dashboard
40. Get My Transactions (User) → Verify purchase history
41. Get My Revenue Receivers (User if receiver) → Check earnings
42. Get Dashboard Stats (User) → Verify statistics

---

## ERROR CASES TO TEST

### Authentication Errors
- **401 Unauthorized:** Access protected endpoint without token
- **403 Forbidden:** User tries to access EO-only endpoint
- **400 Bad Request:** Register with existing email

### Event Errors
- **404 Not Found:** Get non-existent event
- **400 Bad Request:** Create event with percentage ≠ 100%
- **400 Bad Request:** Configure tickets before approval
- **400 Bad Request:** Complete event before end date

### Ticket Purchase Errors
- **400 Bad Request:** Purchase sold out ticket
- **400 Bad Request:** Purchase outside sale period
- **400 Bad Request:** EO purchases own event ticket
- **404 Not Found:** Purchase non-existent ticket type

### Resale Errors
- **400 Bad Request:** Resale price > 120% original price
- **400 Bad Request:** Resale NFT-claimed ticket
- **400 Bad Request:** Resale < 6 hours before event
- **400 Bad Request:** Buy own resale listing

### Scanning Errors
- **Invalid Signature:** Tampered QR code
- **Already Used:** Scan same ticket twice
- **Blacklisted:** Scan resold ticket's old QR
- **Not Found:** Scan non-existent ticket

### Withdrawal Errors
- **400 Bad Request:** Withdraw before event completion
- **400 Bad Request:** Withdraw twice
- **404 Not Found:** Withdraw non-existent receiver

---

## NOTES

### Important Variables to Track:
```
userToken: JWT token for buyer
eoToken: JWT token for event organizer
adminToken: JWT token for super admin
eventId: Created event ID
ticketTypeId: Ticket type ID
transactionId: Purchase transaction ID
ticketId: Generated ticket ID
listingId: Resale listing ID
receiverEmail: Revenue receiver email
walletAddress: Connected wallet address
```

### Payment Simulation:
For testing, you need to simulate Midtrans webhook. Use the following transaction_status values:
- `pending`: Payment pending
- `settlement`: Payment successful
- `capture`: Card payment captured
- `cancel`: Payment cancelled
- `deny`: Payment denied
- `expire`: Payment expired

### Blockchain Notes:
- Ensure you have test ETH for gas fees
- Use Sepolia testnet for testing
- Verify transactions on Sepolia Etherscan
- IPFS uploads might be slow, consider mock responses

### Testing Tools:
1. **Postman** - For API testing
2. **Postman Collection Runner** - For automated flow testing
3. **Postman Environment** - To store variables
4. **Postman Mock Server** - For webhook simulation

### Environment Variables Setup:
Create a Postman Environment with:
```
baseUrl: http://localhost:5000
userToken: (will be set automatically)
eoToken: (will be set automatically)
adminToken: (will be set automatically)
eventId: (will be set automatically)
ticketTypeId: (will be set automatically)
transactionId: (will be set automatically)
ticketId: (will be set automatically)
listingId: (will be set automatically)
```

### Auto-Save Variables (Add to Test Scripts):
```javascript
// After Register/Login
pm.collectionVariables.set('userToken', pm.response.json().data.token);

// After Create Event
pm.collectionVariables.set('eventId', pm.response.json().data.event.id);

// After Configure Tickets
pm.collectionVariables.set('ticketTypeId', pm.response.json().data.ticketTypes[0].id);

// After Purchase Ticket
pm.collectionVariables.set('transactionId', pm.response.json().data.transactionId);

// After Get My Tickets
pm.collectionVariables.set('ticketId', pm.response.json().data.tickets[0].id);

// After Create Resale Listing
pm.collectionVariables.set('listingId', pm.response.json().data.listing.id);
```