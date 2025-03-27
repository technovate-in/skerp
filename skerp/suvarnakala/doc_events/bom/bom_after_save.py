import frappe

def before_save(doc,method):
  add_scrap_items(doc,method)
  
def add_scrap_items(doc,method):
  # Check if "Scrap 99" is already in the scrap_items table
  scrap_item_code = "Scrap 99"
  exists = any(item.item_code == "Scrap 99" for item in doc.scrap_items)


  # Get the rate from "Daily Rate Master" where active == 1
  rate = frappe.db.get_value("Daily Rate Master", {"active": 1}, "rate_per_gram")  # Adjust the field name if necessary

  # If "Scrap 99" does not exist, add it to the scrap_items table
  if not exists:
      new_item = doc.append("scrap_items")  # Append a new row to scrap_items
      new_item.item_code = scrap_item_code  # Set the item_code to "Scrap 99"
      new_item.stock_qty = 1  # Set the stock quantity
      new_item.rate = rate if rate is not None else 0 
      new_item.item_name="Scrap 99"

  
  