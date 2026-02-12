# CSV Import - Quick Reference

## 🚀 Quick Start (30 seconds)

1. Click **⬆️Import** button
2. Select your CSV file
3. Click **Import** button
4. Done! ✨

---

## 📋 CSV Format (Required)

```csv
Date,Amount,Category,Description
2024-01-15,150,Food,Groceries
2024-01-16,500,Transportation,Car payment
```

**Must have:** Date (YYYY-MM-DD), Amount (number), Category (text)  
**Optional:** Description

---

## ✅ Valid Example

```csv
Date,Amount,Category
2024-01-15,150.50,Food
2024-01-16,500,Transportation
2024-01-17,200,Entertainment
```

✓ Date format correct  
✓ Amounts are positive numbers  
✓ Categories are non-empty  

---

## ❌ Invalid Example & Fix

```csv
WRONG:
Date,Amount,Category
15/01/2024,150,Food        ← Wrong date format

RIGHT:
Date,Amount,Category
2024-01-15,150,Food
```

---

## 🛠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Please select a CSV file" | Ensure file has `.csv` extension |
| "Invalid date format" | Use YYYY-MM-DD (e.g., 2024-01-15) |
| "Amount must be positive" | Remove $, no negative numbers |
| "Category cannot be empty" | Add category for all rows |
| File doesn't import | Check for required columns |

---

## 📊 Success Messages

✓ **"Imported 10 expenses"**  
✓ **"Imported 8 expenses (2 duplicates skipped)"**  
✓ **"All 5 rows were duplicates"** (no new imports)

---

## 🎯 Features

- ✅ Bulk import expenses
- ✅ Automatic validation
- ✅ Duplicate detection
- ✅ Error reporting
- ✅ Instant dashboard update
- ✅ Works offline

---

## 📁 Sample File

Use `IMPORT_TEMPLATE.csv` in your tracker folder as a reference.

---

## 📞 Support

Check `CSV_IMPORT_GUIDE.md` for detailed instructions  
Check `CSV_TECHNICAL.md` for technical details

---

**That's it! You're ready to import expenses.** 🎉
