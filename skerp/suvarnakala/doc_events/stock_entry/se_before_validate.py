import frappe

def before_validate(doc,method):
  source_warehouse_on_qr_scan(doc,method)

def source_warehouse_on_qr_scan(doc,method):
    def get_latest_warehouse(batch_no):
      result = frappe.db.sql("""
          SELECT * 
          FROM `tabSerial and Batch Entry`
          WHERE batch_no = %s AND docstatus = 1
          ORDER BY modified DESC
          LIMIT 1
      """, (batch_no,), as_dict=True)
          
      if result:
          return result[0].warehouse
      else:
          return None
      
      
    for item in doc.items:
      if item.batch_no:
          warehouse = get_latest_warehouse(item.batch_no)
          if warehouse:
              item.s_warehouse = warehouse
          else:
              frappe.throw(f"No warehouse found for batch number {item.batch_no}")
      
    