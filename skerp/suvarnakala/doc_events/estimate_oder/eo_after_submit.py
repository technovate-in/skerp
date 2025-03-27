import frappe

def after_submit(doc, method):
  estimate_order_to_delivery_note(doc,method)
  
def estimate_order_to_delivery_note(doc,method):
  if doc.items:
    dn = frappe.new_doc("Delivery Note")
    dn.customer = doc.customer
   

        # Fetch all items from Estimate Order
    for item in doc.items:
        dn.append("items", {
                "item_code": item.item_code,
                "qty": item.qty,
                "custom_net_weight":item.custom_net_weight,
                "uom":item.uom,
                "custom_purity":item.custom_purity,
                "custom_pcs":item.custom_pcs,
                "use_serial_batch_fields":1,
                "batch_no":item.custom_bch_no,
                "rate": item.rate,
                "warehouse": item.warehouse,
                "against_sales_order":doc.name,
                "so_detail":item.name,
                "uom": item.uom,
                "custom_item_labour_charges":item.custom_item_labour_charges
            })

        # Save and submit Delivery Note
    dn.insert(ignore_permissions=True)
    dn.submit()
    frappe.msgprint(f"Delivery Note {dn.name} created successfully")
        
        
  