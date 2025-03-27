import frappe


def before_save(doc, method):

  transfer_goods_for_huid(doc,method)
  fine_weight_in_estimate_order(doc,method)
  item_warehouse_and_spi_validation(doc,method)

def transfer_goods_for_huid(doc, method):
  if doc.custom_transfer_for_huid == 1:
    # Check if there's any item with custom_huid_ as "None" or ""
    items_needing_huid = [item for item in doc.items if item.custom_huid_ is None or item.custom_huid_ == ""]
    
    if items_needing_huid:
        # Create a new entry in HUID Processing doctype
        huid_processing = frappe.get_doc({
            'doctype': 'HUID Processing',
            'estimate_order': doc.name,
            'process_start_date': frappe.utils.nowdate(),  # Current date as start date
        })

        for item in items_needing_huid:
            # Add each item to the HUID Processing items child table
            huid_processing.append('items', {
                'item_code': item.item_code,  # Add the relevant fields from the Estimate Order items table
                'item_name': item.item_name,
                'gross_weight_grams': item.qty,
                'net_weight_grams': item.custom_net_weight,
                'purity': item.custom_purity,
                'pcs': item.custom_pcs,
                'batch_no': item.custom_bch_no,
                'packet': item.custom_packet_number_,
            })

        # Insert the HUID Processing document into the database
        huid_processing.insert()
        
        new_doc = frappe.new_doc('Stock Entry')
        new_doc.stock_entry_type = 'Material Transfer'
        new_doc.from_warehouse = 'Sales Person Issue - SK'
        new_doc.set('items',[])
        new_doc.custom_estimate_order_ = doc.name
        
        for item in doc.items:
            # frappe.msgprint(item.item_code)
            child_table_item = new_doc.append('items',{
                't_warehouse': 'HUID  - SK',
                'item_code': item.item_code,
                'qty': item.qty,
                'custom_net_weight': item.custom_net_weight,  
                'uom': item.uom,
                'custom_purity': item.custom_purity, # Purity not added correctly
                'custom_pcs':item.pcs,
                'use_serial_batch_fields':1,
                'batch_no':item.custom_bch_no,
            })
    


        new_doc.insert()
        new_doc.submit()
    else:
        # Throw a message if no items need HUID processing
        frappe.throw("No items require HUID processing.")
        
        
def fine_weight_in_estimate_order(doc,method):
  if doc.items:
    for item in doc.items:
        if item.custom_item_labour_charges:
            purity_percentage=frappe.db.get_value("Purity Master",item.custom_purity,"purity_percentage")
            item.custom_item_fine_weight_=item.qty*(purity_percentage/100)+(item.qty*(item.custom_item_labour_charges/100))
            
            
def item_warehouse_and_spi_validation(doc,method):
  def get_spi_from_batch(batch_no, item_code):
      """
      Fetch the sales person issue for a given batch number and item code.
      """
      result = frappe.db.sql("""
          SELECT
              spii.parent
          FROM 
              `tabSales Person Issue Item` AS spii
          JOIN
              `tabSales Person Issue` as spi ON spi.name = spii.parent
          WHERE 
              spii.parenttype = 'Sales Person Issue' AND spii.batch_no = %s AND spii.item_code = %s AND spi.returned = 0
          ORDER BY
              spii.modified DESC
          LIMIT 1
          """, (batch_no, item_code), as_dict=True)
      
      return result


  def get_qty_from_warehouse(batch_no):
      qty_huid = frappe.call('erpnext.stock.doctype.batch.batch.get_batch_qty', batch_no = batch_no, warehouse='HUID  - SK')
      qty_sel = frappe.call('erpnext.stock.doctype.batch.batch.get_batch_qty', batch_no = batch_no, warehouse='Selection Ornaments  - SK')
      
      return (qty_huid, qty_sel)
      

  for item in doc.items:
      result = get_spi_from_batch(item.custom_bch_no, item.item_code)
      qty = get_qty_from_warehouse(item.custom_bch_no)
      qty_huid = qty[0]
      qty_sel = qty[1]
      
      if not result and qty_huid != item.qty and qty_sel != item.qty:
          if qty_huid != item.qty and qty_sel != item.qty:
              frappe.throw(
                  title=f"Row #{item.idx} {item.item_code} is not available for sale", 
                  msg=f"Could not find Sales Person Issue for {item.custom_external_item_code} ({item.custom_bch_no}) <br>Qty in HUID - {qty_huid} <br>Qty in Selection - {qty_sel}")

    
            
    

    