import frappe

def before_save(doc,method):
  item_group_range_check(doc,method)
  
def item_group_range_check(doc,method):
  if doc.custom_from and doc.custom_to_range:
    # Fetch the item groups where the range exists in the parent group
    existing_range = frappe.db.sql("""
        SELECT name FROM `tabItem Group` 
        WHERE 
            ((custom_from <= %s AND custom_to_range >= %s) OR (custom_from <= %s AND custom_to_range >= %s))
            AND
            (parent_item_group = %s)
    """, (doc.custom_from, doc.custom_from, doc.custom_to_range, doc.custom_to_range, doc.parent_item_group))

    if existing_range:
        frappe.throw(f"An existing range already overlaps with the range from {doc.custom_from} to {doc.custom_to_range} in Item Group.")
