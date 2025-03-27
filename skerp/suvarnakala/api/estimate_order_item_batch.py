import frappe
@frappe.whitelist()
def get_sales_order_from_batch(batch_no):
    """
    Fetch the sales order for a given batch number.
    """
    return frappe.db.sql("""
        SELECT
            soi.parent
        FROM 
            `tabSales Order Item` AS soi
        JOIN
            `tabSales Order` as so ON so.name = soi.parent
        WHERE 
            soi.parenttype = 'Sales Order' AND soi.custom_bch_no = %s AND so.docstatus = 1
        ORDER BY
            so.modified DESC
        LIMIT 1
        """, (batch_no), as_dict=True)
    
    return result
    
batch_no = frappe.form_dict.get('batch_no')
frappe.response['message'] = get_sales_order_from_batch(batch_no)