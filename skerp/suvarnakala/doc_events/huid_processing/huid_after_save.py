import frappe

def after_save(doc, method):
  huid_packet_update(doc,method)
  
def huid_packet_update(doc,method):
  # packet master update on huid update
  for huid_item in doc.items:
          if(huid_item.huid != None):
              # frappe.msgprint('hello')
              huid_packet = frappe.get_doc('Packet Master',huid_item.packet)
              for packet_item in huid_packet.items:
                  if(huid_item.item_code == packet_item.item_code and huid_item.batch_no == packet_item.batch_no):
                      if(packet_item.huid == None or packet_item.huid == ""):
                          # frappe.msgprint('Hooray!!')
                          packet_item.huid = huid_item.huid
              
              huid_packet.save()
          
          
          # if(huid_item.huid == None):
          #     frappe.msgprint('jello')

  # When HUID completed then updating Sales order and creating stock entry
  if doc.status == 'Completed': 
      # frappe.msgprint('completed ready for stock entry')
      
      new_doc = frappe.new_doc('Stock Entry')
      new_doc.stock_entry_type = 'Material Transfer'
      new_doc.from_warehouse = 'HUID  - SK'
      new_doc.set('items',[])
      new_doc.custom_estimate_order_ = doc.name
        
      
      estimate_order = frappe.get_doc('Sales Order',doc.estimate_order)
      estimate_order.custom_transfer_for_huid = 0
      # frappe.msgprint(estimate_order.customer)
      for order_item in estimate_order.items:
          for huid_item in doc.items:
              if(huid_item.item_code == order_item.item_code and huid_item.batch_no == order_item.custom_bch_no):

                  order_item.custom_huid_ = huid_item.huid
      
          child_table_item = new_doc.append('items',{
                      't_warehouse':'Sales Person Issue - SK',
                      'item_code': order_item.item_code,
                      'qty': order_item.qty,
                      'custom_net_weight': order_item.custom_net_weight,  
                      'uom': order_item.uom,
                      'custom_purity': order_item.custom_purity,
                      'custom_pcs':order_item.pcs,
                      'use_serial_batch_fields':1,
                      'batch_no':order_item.custom_bch_no,
                  })
                  
                  
      new_doc.insert()
      new_doc.submit()
      estimate_order.save()