import frappe

def before_insert(doc, method):
  item_warehouse_valudation(doc, method)
  
def item_warehouse_valudation(doc,method):
  for item in doc.items:
    qty_huid = frappe.call('erpnext.stock.doctype.batch.batch.get_batch_qty', batch_no = item.batch_no, warehouse='HUID  - SK')
    qty_inv = frappe.call('erpnext.stock.doctype.batch.batch.get_batch_qty', batch_no = item.batch_no, warehouse='Inventory Ornaments  - SK')
    
    if qty_huid != item.weightgramct and qty_inv != item.weightgramct:
        frappe.throw(
            title=f"Row #{item.idx} {item.item_code} is not available for Issue", 
            msg=f"Qty in HUID - {qty_huid} <br>Qty in Inventory - {qty_inv}")
        
    
    orders = frappe.db.sql(f"""
    SELECT parent 
    FROM `tabSales Order Item` 
    WHERE custom_bch_no = '{item.batch_no}' and item_code = '{item.item_code}' 
    ORDER BY creation DESC""", as_dict=1)
    
    for order in orders:
        if frappe.db.get_value('Sales Order', order.parent, 'docstatus') == 1:
            frappe.throw(f"Item: {item.item_code} ({item.batch_no}) is already sold in {order.parent}.")

# finished_goods_warehouse = 'Finished Goods - SK'
    
#     # Loop through each item in the items table
# for item in doc.items:
#     # Call the get_batch_qty method to get the quantity in the specified warehouse
#     qty = frappe.call('erpnext.stock.doctype.batch.batch.get_batch_qty', batch_no=item.batch_no, warehouse=finished_goods_warehouse)
    
#     # Convert qty to float and compare with item.qty
#     if float(qty or 0) != float(item.qty):
#         frappe.throw(f"{item.item_code} is not present in warehouse '{finished_goods_warehouse}' with the required quantity.")
  