import frappe

def before_save(doc,method):
  purchase_order_daily_master(doc,method)

def purchase_order_daily_master(doc,method):
  if doc.items:
    for item in doc.items:
        daily_rate=frappe.db.get_value("Daily Rate Master", { "active": 1 }, "rate_per_gram")
        item.rate = daily_rate
  