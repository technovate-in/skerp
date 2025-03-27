import frappe

def after_insert(doc,method):
  sales_person_issue_warehouse_entry(doc,method)

def sales_person_issue_warehouse_entry(doc,method):
  new_doc = frappe.new_doc('Stock Entry')
  new_doc.stock_entry_type = 'Material Transfer'
  new_doc.set('items',[])
  new_doc.custom_from_sales_person = True
  new_doc.custom_sales_person_issue = doc.name

  for item in doc.items:
      source_w = "HUID  - SK" if item.weightgramct == frappe.call('erpnext.stock.doctype.batch.batch.get_batch_qty', batch_no = item.batch_no, warehouse='HUID  - SK') else "Inventory Ornaments  - SK"
      # frappe.msgprint(item.item_code)
      child_table_item = new_doc.append('items',{
          't_warehouse': 'Sales Person Issue - SK',
          's_warehouse': source_w,
          'item_code': item.item_code,
          'qty': item.weightgramct,
          'custom_net_weight': item.gross_weight_gram,  
          'uom': item.uom,
          'custom_purity': item.purity,
          'custom_pcs':item.pcs,
          'use_serial_batch_fields':1,
          'batch_no':item.batch_no,
      })
      
  new_doc.insert()

  for packet in doc.packet_master:
      frappe.db.set_value('Packet Master',packet.packet_master,'issued',1 )

  new_doc.submit()

