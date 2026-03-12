# TriVerse ERP - User Guide

## Getting Started

### Logging In

1. Navigate to your TriVerse ERP URL
2. Enter your credentials:
   - Email: `admin@triverse.com`
   - Password: `admin123`
3. Click "Sign In"

### Dashboard Overview

After logging in, you'll see the main dashboard with:
- **Revenue Overview**: Total revenue, outstanding invoices
- **Recent Activity**: Latest transactions and updates
- **Quick Stats**: Customer count, active invoices, pending quotes
- **Charts**: Revenue trends, payment status breakdown

## Customer Management

### Adding a New Customer

1. Click **Customers** in the sidebar
2. Click the **"+ Add Customer"** button
3. Fill in customer details:
   - Name (required)
   - Email
   - Phone
   - Billing Address
   - Currency
   - Payment Terms (days)
   - Credit Limit
4. Click **"Save"**

### Editing a Customer

1. Go to **Customers**
2. Find the customer in the list (use search if needed)
3. Click the **Edit** icon
4. Update information
5. Click **"Save"**

### Viewing Customer Details

Click on any customer name to view:
- Contact information
- Billing/shipping addresses
- Invoice history
- Payment history
- Outstanding balance

## Product/Service Management

### Adding Items

1. Click **Products/Services** in the sidebar
2. Click **"+ Add Item"**
3. Choose type:
   - **Product**: Physical goods
   - **Service**: Services provided
4. Enter details:
   - Name and description
   - SKU/Code
   - Unit price
   - Cost price (for profit calculation)
   - Tax settings
5. Click **"Save"**

### Managing Inventory

For products with inventory tracking:
- Set "Track Inventory" to ON
- Enter current stock quantity
- Set reorder level for alerts
- View stock movements in item history

## Creating Invoices

### Step 1: Start New Invoice

1. Click **Invoices** in the sidebar
2. Click **"+ Create Invoice"**

### Step 2: Select Customer

- Search and select existing customer
- Or create new customer on the fly

### Step 3: Add Line Items

1. Click **"Add Item"**
2. Select product/service from dropdown
3. Enter quantity
4. Adjust price if needed
5. Add discount (percentage or amount)
6. Repeat for multiple items

### Step 4: Set Details

- Invoice date (defaults to today)
- Due date (calculated from payment terms)
- Invoice notes/terms
- Internal memo (not visible to customer)

### Step 5: Review and Save

- Review totals (subtotal, tax, discounts)
- Click **"Save as Draft"** or **"Finalize"**

### Finalizing Invoices

Once finalized, invoices:
- Cannot be edited (only voided)
- Get a permanent invoice number
- Can be sent to customers
- Create accounting entries

### Sending Invoices

1. Open a finalized invoice
2. Click **"Send Email"**
3. Verify email address
4. Customize email message
5. Click **"Send"**

The customer receives:
- Email with invoice PDF attached
- Link to view/pay online (if enabled)

## Creating Quotes

Quotes work similarly to invoices:

1. Click **Quotes** in the sidebar
2. Click **"+ Create Quote"**
3. Select customer and add items
4. Set quote date and expiry date
5. Save and send to customer

### Converting Quotes to Invoices

1. Open an accepted quote
2. Click **"Convert to Invoice"**
3. Review and finalize the new invoice

## Recording Payments

### Manual Payment Entry

1. Go to **Payments**
2. Click **"+ Record Payment"**
3. Select invoice
4. Enter:
   - Amount received
   - Payment date
   - Payment method (cash, check, transfer, card)
   - Reference number
   - Notes
5. Click **"Save"**

### Viewing Payment History

- **By Invoice**: Open invoice → Payments tab
- **By Customer**: Open customer → Payments tab
- **All Payments**: Payments page with filters

## Attendance Tracking

### Clocking In

1. Click **Attendance** in the sidebar
2. Click **"Clock In"**
3. Add notes if needed
4. Your location is recorded (if enabled)

### Clocking Out

1. Return to **Attendance**
2. Find your active session
3. Click **"Clock Out"**
4. Add notes about work completed

### Viewing Attendance Records

- View daily, weekly, or monthly attendance
- See total hours worked
- Export attendance reports

## KPI Dashboard

### Viewing Your KPIs

1. Click **My KPI** in the sidebar
2. View your performance metrics:
   - Tasks completed
   - Revenue generated
   - Customer satisfaction
   - Project milestones

### Managing Tasks

- Add new tasks with deadlines
- Mark tasks as complete
- Track progress on ongoing projects
- View team task board

## Reports

### Generating Reports

1. Click **Reports** in the sidebar
2. Choose report type:
   - **Sales Report**: Revenue analysis
   - **Income Statement**: P&L
   - **Balance Sheet**: Assets & liabilities
   - **Aged Receivables**: Outstanding invoices
   - **Tax Report**: Tax collected
   - **Customer Report**: Customer statistics

3. Select date range
4. Apply filters if needed
5. Click **"Generate"**

### Exporting Reports

- **PDF**: Click "Export PDF" for printing
- **Excel**: Click "Export Excel" for analysis
- **Email**: Send directly to stakeholders

## Settings

### Company Information

1. Click **Settings** in the sidebar
2. Update:
   - Company name and logo
   - Contact information
   - Tax IDs
   - Default currency
   - Fiscal year start

### Invoice Settings

Configure:
- Invoice numbering format
- Default payment terms
- Default notes/terms
- Email templates
- PDF layout

### User Management

Add team members:
1. Go to **Settings** → **Users**
2. Click **"+ Add User"**
3. Enter email and details
4. Assign role and permissions
5. Send invitation email

### Security

- Change your password regularly
- Enable two-factor authentication
- Review login history
- Set session timeout

## Tips & Best Practices

### Invoice Management
- Finalize invoices promptly
- Send reminders for overdue invoices
- Offer multiple payment methods
- Keep consistent invoice numbering

### Customer Relations
- Keep customer information up to date
- Add notes about customer preferences
- Track communication history
- Set up automatic payment reminders

### Reporting
- Generate monthly financial reports
- Review aged receivables weekly
- Monitor cash flow projections
- Export data for tax filing

### Data Security
- Regular database backups
- Limit user access appropriately
- Use strong passwords
- Log out when finished

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New invoice (on invoice page)
- `Ctrl/Cmd + S`: Save current form
- `Esc`: Close modal/cancel
- `/`: Focus search

## Troubleshooting

### Can't log in?
- Verify email and password
- Check Caps Lock
- Reset password if needed
- Contact administrator

### Invoice not sending?
- Verify customer email address
- Check SMTP configuration
- Review email logs

### Data not saving?
- Check internet connection
- Verify required fields filled
- Check for validation errors
- Try refreshing the page

### Reports not generating?
- Verify date range is valid
- Check if data exists for period
- Try smaller date range
- Clear browser cache

## Support

Need help?
- Email: support@your-domain.com
- Documentation: https://docs.your-domain.com
- Video Tutorials: https://tutorials.your-domain.com
- Community Forum: https://community.your-domain.com

## System Requirements

### Browser Support
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Access
- iOS 14+ (Safari)
- Android 10+ (Chrome)
- Responsive design works on tablets

### Recommended Setup
- Stable internet connection
- Modern browser with JavaScript enabled
- Screen resolution: 1366x768 or higher
- PDF reader for viewing invoices
