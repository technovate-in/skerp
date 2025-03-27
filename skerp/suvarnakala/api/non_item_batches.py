import frappe
import json
@frappe.whitelist()

def non_empty_item_batch_count_execute():
  item_list = frappe.form_dict.get('items')  # Get the item list from the request parameters
  frappe.response['message'] = non_empty_item_batch_count(item_list)  
  
@frappe.whitelist()
def non_empty_item_batch_count(item_list):
    values = {'items': tuple(json.loads(item_list))}
    
    return frappe.db.sql("""
    SELECT item, Count(*) as batch_count
    FROM `tabBatch`
    WHERE batch_qty > 0 and item in %(items)s
    GROUP BY item
    """, values=values, as_dict=1)
