import frappe

def after_insert(doc, method):
  daily_rate_master(doc,method)
  
  
def daily_rate_master(doc,method):
  frappe.db.set_value('Daily Rate Master', {'name': ['!=', doc.name]}, 'active', 0);

  