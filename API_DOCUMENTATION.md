# TriVerse ERP - API Documentation

## Base URL
```
Development: http://localhost:3000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

All API endpoints (except /auth/login and /auth/register) require a valid JWT token.

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@triverse.com",
  "password": "admin123"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@triverse.com",
    "firstName": "Admin",
    "lastName": "User"
  },
  "company": {
    "id": "uuid",
    "name": "TriVerse Enterprise"
  }
}
```

### Using the Token
Include the access token in the Authorization header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Customers API

### List Customers
```http
GET /customers?page=1&limit=10&search=john
Authorization: Bearer {token}
```

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "customerNumber": "CUST001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "currencyCode": "USD",
      "creditLimit": 10000,
      "paymentTerms": 30,
      "isActive": true
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Get Customer
```http
GET /customers/{id}
Authorization: Bearer {token}
```

### Create Customer
```http
POST /customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "currencyCode": "USD",
  "creditLimit": 10000,
  "paymentTerms": 30,
  "billingAddress": {
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  }
}
```

### Update Customer
```http
PATCH /customers/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Smith",
  "creditLimit": 15000
}
```

### Delete Customer
```http
DELETE /customers/{id}
Authorization: Bearer {token}
```

## Items/Products API

### List Items
```http
GET /items?page=1&limit=10&search=laptop&type=product
Authorization: Bearer {token}
```

### Create Item
```http
POST /items
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "MacBook Pro",
  "description": "15-inch laptop",
  "itemType": "product",
  "sku": "MBP-15-2024",
  "unitPrice": 2499.99,
  "costPrice": 1800.00,
  "currencyCode": "USD",
  "taxable": true,
  "isActive": true
}
```

## Invoices API

### List Invoices
```http
GET /invoices?page=1&limit=10&status=draft&fromDate=2024-01-01&toDate=2024-12-31
Authorization: Bearer {token}
```

### Create Invoice
```http
POST /invoices
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "uuid",
  "invoiceDate": "2024-11-19",
  "dueDate": "2024-12-19",
  "currencyCode": "USD",
  "items": [
    {
      "itemId": "uuid",
      "description": "MacBook Pro",
      "quantity": 2,
      "unitPrice": 2499.99,
      "taxRate": 8.5,
      "discountPercent": 5
    }
  ],
  "notes": "Thank you for your business"
}
```

### Finalize Invoice
```http
POST /invoices/{id}/finalize
Authorization: Bearer {token}
```

### Download Invoice PDF
```http
GET /invoices/{id}/pdf
Authorization: Bearer {token}
```

### Send Invoice Email
```http
POST /invoices/{id}/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "to": "customer@example.com",
  "subject": "Invoice INV-001",
  "message": "Please find attached your invoice."
}
```

## Quotes API

### Create Quote
```http
POST /quotes
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "uuid",
  "quoteDate": "2024-11-19",
  "expiryDate": "2024-12-19",
  "currencyCode": "USD",
  "items": [
    {
      "itemId": "uuid",
      "description": "MacBook Pro",
      "quantity": 2,
      "unitPrice": 2499.99,
      "taxRate": 8.5,
      "discountPercent": 10
    }
  ]
}
```

### Convert Quote to Invoice
```http
POST /quotes/{id}/convert-to-invoice
Authorization: Bearer {token}
```

## Payments API

### Record Payment
```http
POST /payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "invoiceId": "uuid",
  "amount": 5000.00,
  "paymentDate": "2024-11-19",
  "paymentMethod": "bank_transfer",
  "referenceNumber": "TXN123456",
  "notes": "Payment received via wire transfer"
}
```

### List Payments
```http
GET /payments?page=1&limit=10&invoiceId=uuid
Authorization: Bearer {token}
```

## Reports API

### Income Statement
```http
GET /reports/income-statement?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}
```

### Balance Sheet
```http
GET /reports/balance-sheet?asOfDate=2024-12-31
Authorization: Bearer {token}
```

### Sales Report
```http
GET /reports/sales?startDate=2024-01-01&endDate=2024-12-31&groupBy=month
Authorization: Bearer {token}
```

### Aged Receivables
```http
GET /reports/aged-receivables?asOfDate=2024-12-31
Authorization: Bearer {token}
```

## Attendance API

### Clock In
```http
POST /attendance/clock-in
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "Started work"
}
```

### Clock Out
```http
POST /attendance/clock-out/{attendanceId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "End of day"
}
```

### Get My Attendance
```http
GET /attendance/my-attendance?startDate=2024-11-01&endDate=2024-11-30
Authorization: Bearer {token}
```

## Error Responses

All errors follow this format:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "email must be a valid email"
    }
  ]
}
```

Common Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate resource)
- 429: Too Many Requests (rate limit)
- 500: Internal Server Error

## Rate Limiting

- Default: 100 requests per minute
- Applies per IP address
- Returns 429 status code when exceeded

## Pagination

All list endpoints support pagination:
```
?page=1&limit=10
```

Response includes:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "pages": 10
}
```

## Filtering & Sorting

```http
GET /invoices?status=paid&sortBy=invoiceDate&sortOrder=desc
```

## Interactive Documentation

Visit Swagger UI for interactive API testing:
```
http://localhost:3000/api/docs
```
