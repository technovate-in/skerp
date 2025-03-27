import frappe

def after_insert(doc, method):
  customer_gst_category(doc,method)
  
def customer_gst_category(doc,method):
  if doc.gst_category=="Unregistered":
    frappe.msgprint(f'Please Note,The GST number for the customer {doc.name} is not entered')