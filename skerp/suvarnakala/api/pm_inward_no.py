

import frappe
@frappe.whitelist()
def purchase_receipt_in_packet_master():
    query="""select pr.name from `tabPurchase Receipt` pr
LEFT JOIN `tabPacket Master` pm ON pr.name = pm.inward_no
WHERE pm.inward_no IS NULL AND pr.docstatus = 1"""
    return frappe.db.sql(query, pluck='name')
    

    

    
    
    
#     exists = frappe.db.exists('Packet Master', {'inward_no': inward_no})
#     return bool(exists)

# warehouse = frappe.form_dict.get('inward_no')
# frappe.response['message'] = check_packet_master_exists