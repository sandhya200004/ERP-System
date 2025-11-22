# API Contracts & Schemas

Complete REST API specification for TriVerse ERP.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All endpoints (except `/auth/*` and `/public/*`) require authentication via JWT Bearer token.

```http
Authorization: Bearer <access_token>
```

### Enterprise API endpoints support API key authentication:

```http
X-API-Key: <api_key>
```

---

## 1. Authentication Endpoints

### POST /auth/register
Create a new user account (requires invitation token or super admin).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "active"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### POST /auth/login
Authenticate user and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "companies": [
      {
        "companyId": "uuid",
        "companyName": "Acme Inc",
        "role": "admin"
      }
    ]
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### POST /auth/logout
Revoke refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `204 No Content`

---

## 2. Customer Endpoints

### GET /customers
List all customers for current company.

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `search`: string
- `type`: "individual" | "business"
- `sortBy`: string (default: "created_at")
- `sortOrder`: "asc" | "desc" (default: "desc")

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "customerNumber": "CUST-00001",
      "name": "ABC Corporation",
      "type": "business",
      "email": "contact@abc.com",
      "phone": "+1234567890",
      "taxId": "12-3456789",
      "billingAddress": {
        "line1": "123 Main St",
        "line2": "Suite 100",
        "city": "New York",
        "state": "NY",
        "postalCode": "10001",
        "country": "US"
      },
      "defaultCurrency": "USD",
      "paymentTermsDays": 30,
      "creditLimit": 50000.00,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### POST /customers
Create a new customer.

**Request:**
```json
{
  "name": "ABC Corporation",
  "type": "business",
  "email": "contact@abc.com",
  "phone": "+1234567890",
  "website": "https://abc.com",
  "taxId": "12-3456789",
  "billingAddress": {
    "line1": "123 Main St",
    "line2": "Suite 100",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "shippingAddress": {
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "defaultCurrency": "USD",
  "paymentTermsDays": 30,
  "creditLimit": 50000.00,
  "notes": "VIP customer"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "customerNumber": "CUST-00001",
  "name": "ABC Corporation",
  ...
}
```

---

### GET /customers/:id
Get customer details.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "customerNumber": "CUST-00001",
  ...
}
```

---

### PUT /customers/:id
Update customer.

**Request:** Same as POST (all fields optional)

**Response:** `200 OK`

---

### DELETE /customers/:id
Soft delete customer.

**Response:** `204 No Content`

---

## 3. Item Endpoints

### GET /items
List all items.

**Query Parameters:** Same as customers

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "itemNumber": "ITEM-00001",
      "name": "Web Development Service",
      "description": "Custom web development",
      "type": "service",
      "unitPrice": 150.00,
      "costPrice": 80.00,
      "currency": "USD",
      "unitOfMeasure": "hour",
      "sku": "WEB-DEV-001",
      "isActive": true,
      "taxes": [
        {
          "id": "uuid",
          "name": "Sales Tax 10%",
          "rate": 10.00
        }
      ]
    }
  ],
  "meta": { ... }
}
```

---

### POST /items
Create item.

**Request:**
```json
{
  "name": "Web Development Service",
  "description": "Custom web development",
  "type": "service",
  "unitPrice": 150.00,
  "costPrice": 80.00,
  "currency": "USD",
  "unitOfMeasure": "hour",
  "sku": "WEB-DEV-001",
  "taxIds": ["uuid1", "uuid2"]
}
```

**Response:** `201 Created`

---

## 4. Quote Endpoints

### GET /quotes
List quotes.

**Query Parameters:**
- Standard pagination
- `status`: "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted"
- `customerId`: uuid
- `dateFrom`: date
- `dateTo`: date

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "quoteNumber": "QT-2024-00001",
      "customer": {
        "id": "uuid",
        "name": "ABC Corporation"
      },
      "quoteDate": "2024-01-15",
      "validUntil": "2024-02-15",
      "currency": "USD",
      "fxRate": 1.0,
      "subtotal": 1000.00,
      "taxTotal": 100.00,
      "discountAmount": 50.00,
      "total": 1050.00,
      "status": "sent",
      "createdBy": {
        "id": "uuid",
        "name": "John Doe"
      },
      "sentAt": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

### POST /quotes
Create quote.

**Request:**
```json
{
  "customerId": "uuid",
  "quoteDate": "2024-01-15",
  "validUntil": "2024-02-15",
  "currency": "USD",
  "notes": "Thank you for your business",
  "terms": "Net 30 days",
  "lines": [
    {
      "itemId": "uuid",
      "description": "Web Development",
      "quantity": 10,
      "unitPrice": 150.00,
      "discountPercent": 5,
      "taxIds": ["uuid1"]
    },
    {
      "description": "Custom Service",
      "quantity": 1,
      "unitPrice": 500.00,
      "taxIds": ["uuid1"]
    }
  ]
}
```

**Response:** `201 Created`

---

### POST /quotes/:id/send
Send quote to customer via email.

**Request:**
```json
{
  "to": "customer@example.com",
  "cc": ["manager@company.com"],
  "subject": "Quote QT-2024-00001",
  "message": "Please find attached your quote."
}
```

**Response:** `200 OK`

---

### POST /quotes/:id/convert
Convert quote to invoice.

**Request:**
```json
{
  "invoiceDate": "2024-01-20",
  "dueDate": "2024-02-20"
}
```

**Response:** `201 Created`
```json
{
  "invoice": {
    "id": "uuid",
    "invoiceNumber": "INV-2024-00001",
    ...
  }
}
```

---

## 5. Invoice Endpoints

### GET /invoices
List invoices.

**Query Parameters:**
- Standard pagination
- `status`: "draft" | "final" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled"
- `customerId`: uuid
- `dateFrom`: date
- `dateTo`: date

**Response:** Similar to quotes

---

### POST /invoices
Create invoice.

**Request:** Similar to quote creation

**Response:** `201 Created`

---

### POST /invoices/:id/finalize
Finalize invoice (makes it immutable and posts to GL).

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "final",
  "journalEntryId": "uuid",
  "finalizedAt": "2024-01-20T10:00:00Z"
}
```

---

### POST /invoices/:id/send
Send invoice via email.

**Request:** Same as quote send

**Response:** `200 OK`

---

## 6. Payment Endpoints

### GET /payments
List payments.

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "paymentNumber": "PAY-2024-00001",
      "customer": {
        "id": "uuid",
        "name": "ABC Corporation"
      },
      "paymentDate": "2024-01-25",
      "amount": 1050.00,
      "currency": "USD",
      "fxRate": 1.0,
      "paymentMethod": "bank_transfer",
      "referenceNumber": "TXN123456",
      "status": "completed",
      "applications": [
        {
          "invoiceNumber": "INV-2024-00001",
          "amount": 1050.00,
          "fxGainLoss": 0.00
        }
      ]
    }
  ],
  "meta": { ... }
}
```

---

### POST /payments
Create payment.

**Request:**
```json
{
  "customerId": "uuid",
  "paymentDate": "2024-01-25",
  "amount": 1050.00,
  "currency": "USD",
  "paymentMethod": "bank_transfer",
  "referenceNumber": "TXN123456",
  "notes": "Payment for January services"
}
```

**Response:** `201 Created`

---

### POST /payments/:id/apply
Apply payment to invoice(s).

**Request:**
```json
{
  "applications": [
    {
      "invoiceId": "uuid",
      "amount": 500.00
    },
    {
      "invoiceId": "uuid",
      "amount": 550.00
    }
  ]
}
```

**Response:** `200 OK`

---

## 7. Report Endpoints

### GET /reports/sales
Sales report.

**Query Parameters:**
- `dateFrom`: date (required)
- `dateTo`: date (required)
- `groupBy`: "day" | "week" | "month" | "customer" | "item"

**Response:** `200 OK`
```json
{
  "summary": {
    "totalSales": 50000.00,
    "totalTax": 5000.00,
    "totalDiscount": 500.00,
    "invoiceCount": 25
  },
  "breakdown": [
    {
      "period": "2024-01",
      "sales": 20000.00,
      "tax": 2000.00,
      "count": 10
    }
  ]
}
```

---

### GET /reports/aging
Accounts receivable aging report.

**Query Parameters:**
- `asOfDate`: date (default: today)
- `customerId`: uuid (optional)

**Response:** `200 OK`
```json
{
  "summary": {
    "totalOutstanding": 15000.00,
    "current": 8000.00,
    "days1_30": 4000.00,
    "days31_60": 2000.00,
    "days61_90": 1000.00,
    "over90": 0.00
  },
  "customers": [
    {
      "customerId": "uuid",
      "customerName": "ABC Corporation",
      "totalOutstanding": 5000.00,
      "current": 3000.00,
      "days1_30": 2000.00,
      "invoices": [...]
    }
  ]
}
```

---

### GET /reports/tax
Tax summary report.

**Query Parameters:**
- `dateFrom`: date (required)
- `dateTo`: date (required)

**Response:** `200 OK`
```json
{
  "summary": {
    "totalTaxCollected": 5000.00
  },
  "breakdown": [
    {
      "taxId": "uuid",
      "taxName": "Sales Tax 10%",
      "taxableAmount": 45000.00,
      "taxAmount": 4500.00
    }
  ]
}
```

---

## 8. Organization Endpoints

### GET /companies
List companies (for current user).

### POST /companies
Create company (admin only).

### GET /branches
List branches for current company.

### POST /branches
Create branch.

---

## 9. Public Endpoints (No Auth Required)

### POST /public/leads
Submit lead from public quote request form.

**Request:**
```json
{
  "companyId": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "companyName": "XYZ Corp",
  "message": "Interested in your services",
  "source": "website"
}
```

**Response:** `201 Created`

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email must be valid"
    }
  ],
  "timestamp": "2024-01-15T10:00:00Z",
  "path": "/api/v1/customers"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error
