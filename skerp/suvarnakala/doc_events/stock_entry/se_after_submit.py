import frappe

def after_submit(doc,method):
  sle_net_weight(doc,method)
  stock_entry_work_order_close(doc,method)
  se_work_order_non_stock_items_from_transfer(doc,method)
  se_wo_packet_produced_qty_update(doc,method)

def sle_net_weight(doc,method):
  voucher_no = doc.name

  item_dict = dict()
  for item in doc.items:
      item_code = item.get('item_code')  # Assuming item_code is a key in each item dictionary
      purity = item.get('custom_purity')  # Assuming purity is a key in each item dictionary
      net_weight = item.get('custom_net_weight')  # Assuming net_weight is a key in each item dictionary
      gross_weight = item.get('qty')
      
      if (item_code, gross_weight) not in item_dict:
          item_dict[(item_code, gross_weight)] = [[net_weight, purity]]
      else:
          item_dict[(item_code, gross_weight)].append([net_weight, purity])
          
          
  # Fetch the name of the stock ledger entry based on the voucher_no and item_code
  for item, net_purity in item_dict.items():
      # Positive Weight 
      sle_pos_list = frappe.db.get_list('Stock Ledger Entry',
          filters={"voucher_no": voucher_no, "item_code": item[0], "actual_qty": item[1]},
          pluck='name',
          order_by='creation desc',
      )
      
      for stock_ledger_entry_name_p, (net_weight, purity) in zip(sle_pos_list, net_purity):
          # Update the purity and net_weight fields in the stock ledger entry
          frappe.db.set_value(
              "Stock Ledger Entry", 
              stock_ledger_entry_name_p, 
              {"custom_purity": purity, "custom_net_weight": net_weight}
          )
      
      
      
      # Negative Weight    
      sle_neg_list = frappe.db.get_list('Stock Ledger Entry',
          filters={"voucher_no": voucher_no, "item_code": item[0], "actual_qty": 0-item[1]},
          pluck='name',
          order_by='creation desc',
      )
          
      for stock_ledger_entry_name_n, (net_weight, purity) in zip(sle_neg_list, net_purity):
          # Update the purity and net_weight fields in the stock ledger entry
          frappe.db.set_value(
              "Stock Ledger Entry", 
              stock_ledger_entry_name_n, 
              {"custom_purity": purity, "custom_net_weight": 0-net_weight}
          )
          
def stock_entry_work_order_close(doc,method):
  if doc.stock_entry_type == "Manufacture" and doc.work_order:
    work_order = frappe.get_doc("Work Order", doc.work_order)
    frappe.db.set_value("Work Order",doc.work_order,"status","Closed")
        # work_order.status = "Closed"
        # work_order.save()
        # frappe.db.commit()
        
        
def se_work_order_non_stock_items_from_transfer(doc,method):
  if len(doc.custom_non_stock_item_in_wo) > 0:
    wo_doc = frappe.get_doc('Work Order',doc.work_order)
    
    for ns_item in doc.custom_non_stock_item_in_wo:
        
        for wo_ns_item in wo_doc.custom_non_stock_item_in_wo:
            
            if ns_item.item == wo_ns_item.item:
                
                # frappe.throw(f'{ns_item.item}: {ns_item.net_weight}')
                # wo_ns_item.transferred_qty = ns_item.transferred_qty
                if doc.stock_entry_type == 'Material Transfer for Manufacture':
                    frappe.db.set_value('Non Stock item in WO',wo_ns_item.name,'transferred_qty',ns_item.net_weight)
                elif doc.stock_entry_type == 'Manufacture':
                    frappe.db.set_value('Non Stock item in WO',wo_ns_item.name,'consumed_qty',ns_item.net_weight)
                    
                    
    
def se_wo_packet_produced_qty_update(doc,method):
  if doc.stock_entry_type == 'Manufacture':
    if doc.work_order != None:
        
        wo_doc = frappe.get_doc('Work Order',doc.work_order)
        packet_doc = frappe.get_doc('Packet Master',wo_doc.custom_packet)
        mf_item = wo_doc.production_item
        mf_item_index = -1
        
        
        for index, item in enumerate(doc.items):
            
            if (item.item_code == mf_item and item.is_finished_item == 1):
                mf_item_index = index
        
        produced_qty = doc.items[mf_item_index].qty
        frappe.db.set_value('Work Order', wo_doc.name,'produced_qty',doc.items[mf_item_index].qty)
        frappe.db.set_value('Work Order', wo_doc.name, 'custom_adjustment', doc.custom_adjustment)
        packet_doc.items[0].net_weight = doc.items[mf_item_index].qty
        packet_doc.items[0].gross_weight = doc.items[mf_item_index].custom_net_weight
        packet_doc.jadtar_charges = packet_doc.jadtar_charges + doc.custom_total_jadtar_charges
        # packet_doc.items[0].mani_moti_weight = wo_doc.custom_mani_moti_total
        # packet_doc.items[0].moti_weight = wo_doc.custom_moti_total
        # packet_doc.items[0].mani_weight = wo_doc.custom_mani_total
        
        
        
        packet_doc.save()
  
  
  
    