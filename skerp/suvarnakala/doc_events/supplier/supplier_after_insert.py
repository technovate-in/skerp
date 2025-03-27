import frappe

def after_insert(doc,method):
  supplier_gst_number(doc,method)

def supplier_gst_number(doc,method):
  if doc.gst_category=="Unregistered":
    frappe.msgprint(f'Please Note,The GST number for the supplier {doc.name}  is not entered.')
  