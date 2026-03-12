# Invoice Builder Component - User Guide

## Overview
The Invoice Builder is a comprehensive invoice creation and PDF generation system integrated into the TriVerse ERP/CRM system.

## Features

### 1. **Invoice Creation**
- **Customer Selection**: Dropdown with search functionality to select from existing customers
- **Date Management**: 
  - Invoice Date (defaults to today)
  - Due Date (defaults to 30 days from invoice date)
- **Line Items Management**:
  - Add unlimited line items
  - Item selection from product catalog
  - Manual description entry
  - Quantity and unit price adjustments
  - Automatic amount calculation per line
  - Remove individual line items

### 2. **Automatic Calculations**
- **Subtotal**: Sum of all line item amounts
- **Tax**: 10% automatic calculation
- **Total**: Subtotal + Tax
- Real-time updates as you edit quantities and prices

### 3. **Professional Invoice Preview**
- **Header Section**:
  - TriVerse logo
  - Company name and branding
  - Invoice number (DRAFT for new invoices)
- **Billing Information**:
  - Customer name
  - Email and phone
  - Billing address
- **Date Information**:
  - Invoice date
  - Due date
- **Line Items Table**:
  - Description
  - Quantity
  - Unit price
  - Amount
- **Totals Summary**:
  - Subtotal
  - Tax (10%)
  - Total amount (highlighted)
- **Notes Section**:
  - Additional notes
  - Payment terms
- **Footer**:
  - Thank you message

### 4. **PDF Generation**
- **Download PDF**: One-click PDF download with professional formatting
- **Print Option**: Direct print to printer
- **File Naming**: Automatically names as `invoice-{number}.pdf` or `invoice-draft.pdf`
- **Features**:
  - High-quality rendering
  - Includes TriVerse logo
  - Professional layout matching preview
  - A4 page format

### 5. **Workflow**
1. Click "Create Invoice" button on Invoices page
2. Select customer from dropdown
3. Adjust invoice date and due date if needed
4. Add line items:
   - Select from product catalog OR
   - Enter custom description manually
   - Set quantity and unit price
5. Add optional notes or payment terms
6. Click "Preview" to see formatted invoice
7. Review invoice preview
8. Options:
   - "Back to Edit" to make changes
   - "Print" to print directly
   - "Download PDF" to save as PDF
   - "Save Invoice" to create in system
9. Invoice is saved to database and list refreshes

## Technical Implementation

### Frontend Components
- **InvoiceBuilder.tsx**: Main invoice creation modal component
- **InvoicesPage.tsx**: Invoice list page with create button
- **Dependencies**:
  - `html2canvas`: For rendering HTML to canvas
  - `jsPDF`: For PDF generation (loaded via CDN)
  - `antd`: UI components
  - `dayjs`: Date handling

### Integration Points
- **Customer Service**: Fetches customer list for selection
- **Item Service**: Fetches product/service catalog
- **Invoice Service**: Creates invoice in database

### API Payload
```json
{
  "customerId": "uuid",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "notes": "Optional notes",
  "lines": [
    {
      "itemId": "uuid",
      "description": "Product/Service name",
      "quantity": 1,
      "unitPrice": 100.00
    }
  ]
}
```

## Design Features

### Colors & Branding
- **Primary Color**: #2c3e7d (TriVerse blue)
- **Logo**: TriVerse Solutions logo prominently displayed
- **Layout**: Clean, professional, modern design
- **Typography**: Clear hierarchy with bold totals

### User Experience
- **Responsive Design**: Works on different screen sizes
- **Real-time Calculations**: Instant updates as you edit
- **Validation**: Required fields enforced
- **Error Handling**: Friendly error messages
- **Success Feedback**: Confirmation messages on actions

## Future Enhancements

### Potential Features
1. **Tax Rate Configuration**: Allow different tax rates per item or customer
2. **Discount Support**: Add line-level and invoice-level discounts
3. **Multiple Currencies**: Support for different currencies
4. **Templates**: Multiple invoice template designs
5. **Email Integration**: Send invoice directly to customer via email
6. **Recurring Invoices**: Auto-generate invoices on schedule
7. **Payment Tracking**: Link payments to invoices
8. **Late Fee Calculation**: Automatic late fees for overdue invoices
9. **Custom Fields**: Add custom fields to invoices
10. **Multi-language Support**: Invoices in different languages

## Usage Tips

### Best Practices
1. **Always preview** before saving to ensure layout is correct
2. **Add notes** for payment terms and conditions
3. **Use product catalog** for consistent pricing
4. **Review customer details** before sending
5. **Download PDF** immediately after creation for records

### Common Issues
- **PDF not downloading**: Ensure popup blocker is disabled
- **Logo not showing**: Check logo file exists in `/public/triverse-logo.png`
- **Print not working**: Check browser print settings
- **Calculation errors**: Ensure quantity and price are numbers

## Support
For issues or feature requests, contact your system administrator.

---

**TriVerse ERP/CRM System**  
Invoice Builder v1.0  
Last Updated: June 2025
