import frappe

def before_save(doc, method):
  internal_code_rename(doc,method)
  generate_qr_for_item(doc,method)

def internal_code_rename(doc,method):
  if doc.custom_design:
    design_range=frappe.db.get_value("Design",doc.custom_design,"range_assigned")
    subgroup_code = frappe.db.get_value("Item Group", doc.custom_sub_group, "custom_item_group_code")
    # frappe.throw(f'{subgroup_code}')
    item_exists_number = str(design_range).zfill(4) 
    doc.custom_external_code=subgroup_code+ '-' +item_exists_number
    
    
def generate_qr_for_item(doc,method):
  title =  f"""{doc.item_code}
  {doc.item_group}
  {doc.weight_per_unit} {doc.weight_uom}"""

  exists = frappe.db.exists('QR Demo', title)

  if(exists):
    qr_demo = frappe.get_doc("QR Demo", title)
    doc.custom_qr_input = qr_demo.title
    doc.custom_qr_data = qr_demo.qr_code

  else:
    
    qr_demo = frappe.new_doc("QR Demo")
    qr_demo.title = title
    qr_demo.insert()

    doc.custom_qr_input = qr_demo.title
    doc.custom_qr_data = qr_demo.qr_code
  