
import frappe

def after_save(doc,method):
  item_code_renmae(doc,method)

def item_code_renmae(doc,method):
  # Check if design has changed
  previous_doc = doc.get_doc_before_save()

  if doc.custom_design and (not previous_doc or doc.custom_design != previous_doc.custom_design):
      item_manufacture = frappe.get_doc("Item Manufacturer", {"item_code": doc.item_code})
      item_manufac = item_manufacture.manufacturer
      # item_manufac-doc.custom_manufacture
      design_range = frappe.db.get_value("Design", doc.custom_design, "range_assigned")
      subgroup_code = frappe.db.get_value("Item Group", doc.custom_sub_group, "custom_item_group_code")
      
      item_exists_number = str(design_range).zfill(4)  # Pad with zeros to a width of 4
      item_code = item_manufac + '-' + subgroup_code + '-' + item_exists_number
      
      doc.custom_internal_code = subgroup_code + '-' + item_exists_number
    
      doc.maintain_stock = 1
      frappe.db.set_value('Item', {"item_code": doc.item_code}, "item_code", item_code)

      frappe.rename_doc('Item', doc.name, item_code)

  