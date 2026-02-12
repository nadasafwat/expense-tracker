# CSV Import Feature - Complete Guide

## Overview
The CSV Import feature allows users to bulk import expense data from a CSV file into the Expense Tracker. This is perfect for migrating from other applications or batch adding historical expenses.

---

## File Format Requirements

### Required Columns:
- **Date** - Format: `YYYY-MM-DD` (e.g., 2024-01-15)
- **Amount** - Positive number (decimals allowed, e.g., 150.50)
- **Category** - Text field (e.g., Food, Transportation)

### Optional Column:
- **Description** - Additional notes about the expense

### CSV Example:
```csv
Date,Amount,Category,Description
2024-01-15,150,Food,Groceries
2024-01-16,500,Transportation,Car payment
2024-01-17,200,Entertainment,Movies
2024-01-18,75.50,Utilities,Electric bill
2024-01-20,350,Healthcare,Doctor visit
```

---

## How to Use

### Step 1: Prepare Your CSV File
Create a CSV file with the required columns. You can:
- Use Excel/Google Sheets and export as CSV
- Use a text editor
- Use the provided `IMPORT_TEMPLATE.csv` as reference

### Step 2: Open Import Dialog
1. Click the **⬆️Import** button in the controls bar
2. The CSV Import modal will open

### Step 3: Select File
1. Click on the file input area
2. Choose your CSV file from your computer
3. Click **Import** button

### Step 4: Automatic Processing
- File is parsed and validated
- Valid records are imported
- Duplicates are skipped
- Success message shows count imported

---

## Validation Rules

The system validates each row automatically:

### Valid Entry:
```
Date: 2024-01-15 | Amount: 150.50 | Category: Food ✓
```

### Invalid Examples:

| Issue | Example | Error |
|-------|---------|-------|
| Missing field | `Date: \| Amount: 150 \| Category: Food` | Missing required field |
| Bad date format | `Date: 15/01/2024 \| Amount: 150 \| Category: Food` | Invalid date format |
| Invalid date | `Date: 2024-02-30 \| Amount: 150 \| Category: Food` | Invalid date "2024-02-30" |
| Non-numeric amount | `Date: 2024-01-15 \| Amount: abc \| Category: Food` | Must be a positive number |
| Zero/negative amount | `Date: 2024-01-15 \| Amount: -50 \| Category: Food` | Must be a positive number |
| Empty category | `Date: 2024-01-15 \| Amount: 150 \| Category:` | Category cannot be empty |

---

## Duplicate Detection

The system automatically skips duplicates. A duplicate is defined as:
- **Same Date** AND **Same Amount** AND **Same Category**

### Example:
If you import 10 records and 2 already exist:
- **Result**: "✓ Imported 8 expenses (2 duplicates skipped)"

---

## Success Messages

### Full Import Success:
```
✓ Imported 15 expenses
```

### Partial Success (with duplicates):
```
✓ Imported 8 expenses (2 duplicates skipped)
```

### All Duplicates:
```
⚠️ All 10 rows were duplicates
```

---

## Error Handling

### File Format Error:
```
⚠️ Please select a CSV file
```

### Parse Error:
```
⚠️ Validation errors: Row 2: Invalid date format. Expected YYYY-MM-DD
```

### No Valid Data:
```
⚠️ No valid records found in CSV
```

### File Read Error:
```
⚠️ Error reading file
```

---

## Technical Details

### CSV Parsing:
- **Library**: PapaParse v5.4.1 (CDN)
- **Delimiter**: Comma (`,`)
- **Headers**: First row contains column names
- **Skips**: Empty rows automatically

### Data Structure:
```javascript
{
    Date: "2024-01-15",
    Amount: 150,
    Category: "Food",
    Description: "Optional notes"
}
```

### Validation Algorithm:
1. Check required fields exist
2. Validate date format (regex: YYYY-MM-DD)
3. Validate date is real
4. Validate amount is positive number
5. Validate category is non-empty

### Duplicate Detection:
```javascript
// Triple comparison
exp.Date === newExp.Date &&
exp.Amount === newExp.Amount &&
exp.Category === newExp.Category
```

---

## Tips & Best Practices

1. **Test First**: Import a small batch first to verify format
2. **Date Consistency**: Always use YYYY-MM-DD format
3. **Category Naming**: Be consistent (Food ≠ food)
4. **Sample File**: Use IMPORT_TEMPLATE.csv as reference
5. **Regular Exports**: Export periodically as backup
6. **Check Duplicates**: Review source data before import

---

## Troubleshooting

### Error: "Please select a CSV file"
- **Solution**: Ensure file has `.csv` extension

### Error: "Invalid date format"
- **Solution**: Use YYYY-MM-DD format (e.g., 2024-01-15)

### Error: "Amount must be a positive number"
- **Solution**: Remove currency symbols, use only numbers

### Error: "Category cannot be empty"
- **Solution**: Add category for all rows

### Some records not importing
- **Solution**: Check error messages for validation issues
- These records failed validation; fix and try again

---

## File Compatibility

The import feature works with CSV files from:
- Microsoft Excel
- Google Sheets
- Apple Numbers
- LibreOffice Calc
- Any text editor

Just ensure:
- Comma delimiter
- Proper column headers
- YYYY-MM-DD date format

---

**Last Updated:** February 12, 2026
**Feature Status:** Ready to Use
