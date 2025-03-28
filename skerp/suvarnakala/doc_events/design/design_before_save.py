import frappe
from frappe import _

def before_save(doc,method):
  design_before_validation(doc,method)
  
  
def design_before_validation(doc,method):
  # Validation for Pcs field (Cannot be 0)
  if doc.pcs == 0:
      frappe.throw(_('The pcs field cannot be 0. Please enter a valid number.'))
  