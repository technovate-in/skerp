import frappe
@frappe.whitelist()
def get_spi_from_batch(batch_no):
    """
    Fetch the sales person issue for a given batch number and item code.
    """
    return frappe.db.sql("""
        SELECT
            spii.parent
        FROM 
            `tabSales Person Issue Item` AS spii
        JOIN
            `tabSales Person Issue` as spi ON spi.name = spii.parent
        WHERE 
            spii.parenttype = 'Sales Person Issue' AND spii.batch_no = %s AND spi.returned = 0
        ORDER BY
            spii.modified DESC
        LIMIT 1
        """, (batch_no), as_dict=True)
    
    return result
    
batch_no = frappe.form_dict.get('batch_no')
frappe.response['message'] = get_spi_from_batch(batch_no)