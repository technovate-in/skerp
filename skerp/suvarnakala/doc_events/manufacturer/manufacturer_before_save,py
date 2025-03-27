import frappe

def before_save(doc,method):
  short_name_validation_for_manufacturer(doc,method)

def short_name_validation_for_manufacturer(doc,method):
  short_name = doc.short_name

  if not (len(short_name) == 3 and short_name[0].isalpha() and short_name[0].isupper() and short_name[1:].isdigit()):
      frappe.throw('Error:Short Name for the manufacturer should be of 3 letters only.( One alphabet and Two numberic)')
    