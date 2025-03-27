import frappe
import frappe.utils

def before_save(doc, method):
    sales_person_issue(doc, method)
    sales_person_issue_total_calculation(doc,method)

def sales_person_issue(doc, method):
    if doc.returned == 1:
        pass  # If returned is 1, do nothing
    else:
        if frappe.utils.getdate(doc.issue_date) < frappe.utils.getdate(frappe.utils.nowdate()):
            frappe.throw("Date cannot be in the past")

def sales_person_issue_total_calculation(doc,method):
  total_weight = 0
  total_amount = 0
  rounded_amount = 0
  total_net_weight=0

  for item in doc.items:
      total_weight = total_weight + item.gross_weight_gram
      total_amount = total_amount + item.amount
      total_net_weight=total_net_weight+item.weightgramct

  doc.total_weights = total_weight
  doc.total_net_weight_grams=total_net_weight
  doc.total_amount = total_amount
  doc.rounded_amount = round(total_amount)
    
