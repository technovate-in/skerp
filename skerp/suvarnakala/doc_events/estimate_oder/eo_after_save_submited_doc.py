import frappe


def after_save_submited_doc(doc, method):
    estimate_order_cancel_delivery_note_cancel(doc, method)
    
def estimate_order_cancel_delivery_note_cancel(doc,method):
  if doc.custom_is_return==1:
    delivery_notes = frappe.db.get_all(
        "Delivery Note Item",
        filters={"against_sales_order": doc.name},
        pluck="parent"
    )
    
    for dn in set(delivery_notes):
        return_dn = frappe.call("erpnext.stock.doctype.delivery_note.delivery_note.make_sales_return", source_name=dn)
        return_dn.save()
        return_dn.submit()
        
        frappe.msgprint(f"Return Delivery Note {return_dn.name} created successfully against {dn}")
    frappe.db.set_value('Sales Order', doc.name, "status", "Is Returned", update_modified=False)
    
        # # Choose the first Delivery Note (or modify logic as needed)
        # return_against_dn = delivery_notes[0]
        
        # dn = frappe.new_doc("Delivery Note")
        # dn.customer = doc.customer
        # dn.return_against = return_against_dn  # Assign a single Delivery Note
        # dn.is_return = 1  # Mark as return entry
        
        # for item in doc.items:
        #     dn.append("items", {
        #         "item_code": item.item_code,
        #         "qty": -item.qty,
        #         "custom_net_weight": item.custom_net_weight,
        #         "uom": item.uom,
        #         "custom_purity": item.custom_purity,
        #         "custom_pcs": item.custom_pcs,
        #         "use_serial_batch_fields": 1,
        #         "batch_no": item.custom_bch_no,
        #         "rate": item.rate,
        #         "warehouse": item.warehouse,
        #         "against_sales_order":doc.name,
        #         "so_detail":item.name,
        #         "uom": item.uom,
        #         "custom_item_labour_charges": item.custom_item_labour_charges
        #     })
        
        #  # Save and submit the Delivery Note
        # dn.insert(ignore_permissions=True)
        # dn.submit()

  