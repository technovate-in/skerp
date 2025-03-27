import frappe

def after_insert(doc,method):
  packet_edit_stock_edit(doc,method)

def packet_edit_stock_edit(doc,method):
  fully_returned_packets = []
  new_packet_items = []
  # Old Packet (remove items)
  for packet in doc.packets_issued:
      # frappe.msgprint(packet.packet_master)
      linked_items = []
      
      for item in doc.items:
          if item.linked_packet == packet.packet_master:
              linked_items.append((item.item_code, item.weightgramct, item.batch_no))
      
      if linked_items:
          existing_packet = frappe.get_doc('Packet Master',packet.packet_master)
          
          items_to_keep = []
          
          for item in existing_packet.items:
              
              if (item.item_code, item.net_weight, item.batch_no) not in linked_items:
                  items_to_keep.append(item)

          if items_to_keep:
              frappe.log(packet.packet_master)
              frappe.log(items_to_keep)
              for item in list(set(existing_packet.items) - set(items_to_keep)):
                  new_packet_items.append(item)
              existing_packet.items = items_to_keep
              existing_packet.save();
          else:
              fully_returned_packets.append(existing_packet.name)
              doc.append('packets_returned', {
                  'parent': doc.name, 
                  'parenttype': 'Sales Person Items Return', 
                  'parentfield': 'packets_returned',
                  'packet_master': existing_packet.name,
              })
              frappe.db.set_value('Packet Master', existing_packet.name, 'issued', 0)

  # New Packet (add items)
  if new_packet_items:
      new_packet = frappe.new_doc('Packet Master')
      for item in new_packet_items:
          new_packet_item = {
              'item_code' : item.item_code,
              'gross_weight' : item.gross_weight,
              'net_weight' : item.net_weight,
              'uom' : item.uom,
              'pcs' : item.pcs,
              'rate': item.rate,
              'purity' : item.purity,
              'amount' : item.gross_weight * item.rate,
              'batch_no' : item.batch_no
          }
          new_packet.append('items',new_packet_item)
          
      new_packet.insert()
      new_packet.save()
      doc.append('packets_returned', {
          'parent': doc.name, 
          'parenttype': 'Sales Person Items Return', 
          'parentfield': 'packets_returned',
          'packet_master': new_packet.name,
      })
      
      for item in doc.items:
          if item.linked_packet not in fully_returned_packets:
              item.linked_packet = new_packet.name

  # Stock Entry for Items from 'Sales Person Issue' to 'Finished Goods'
  new_stock_entry = frappe.new_doc('Stock Entry')
  new_stock_entry.stock_entry_type = 'Material Transfer'
  new_stock_entry.from_warehouse = 'Sales Person Issue - SK'
  new_stock_entry.to_warehouse = 'Finished Goods - SK'
  new_stock_entry.set('items',[])
  # new_stock_entry.custom_from_sales_person = True
  # new_stock_entry.custom_sales_person_issue = doc.name

  for item in doc.items:
      # frappe.msgprint(item.item_code)
      child_table_item = new_stock_entry.append('items',{
          # 't_warehouse': 'Sales Person Issue - SK',
          'item_code': item.item_code,
          'qty': item.weightgramct,
          'custom_net_weight': item.gross_weight_gram,
          'uom': item.uom,
          'custom_purity': item.purity,
          'custom_pcs':item.pcs,
          'use_serial_batch_fields':1,
          'batch_no':item.batch_no,
      })

  new_stock_entry.insert()
  new_stock_entry.submit()

  frappe.msgprint(f'New Stock Entry Created')

      
  def return_spi(spi):
      
      # Find all the sales orders which are made against the Sales Person Issue
      sales_orders = set()
      for order in frappe.db.sql(f"""SELECT DISTINCT parent from `tabSales Order Sales Person Issue Item` where sales_person_issue = '{spi}'""", as_dict=1):
          sales_orders.add(order.parent)
      frappe.log(f"Sales orders - {[sales_orders]}")
      
      # List all the items which are sold in the submitted sales orders
      sold_items = []
      for sales_order in sales_orders:
          if frappe.db.get_value('Sales Order', sales_order, 'docstatus') == 1:
              sales_order_doc = frappe.get_doc('Sales Order', sales_order)
              for item in sales_order_doc.items:
                  sold_items.append([item.item_code, item.custom_bch_no])
      frappe.log(sold_items)
      
      # Check if each item is available in the warehouse or has been sold
      to_return = 1
      spi_doc = frappe.get_doc('Sales Person Issue', spi)
      for item in spi_doc.items:
          if [item.item_code, item.batch_no] not in sold_items and frappe.call('erpnext.stock.doctype.batch.batch.get_batch_qty', batch_no=item.batch_no, warehouse='Sales Person Issue - SK') != 0:
              to_return = 0
              break
              
      if to_return:
          spi_doc.returned = 1
          spi_doc.save()
          frappe.msgprint(f'{spi} returned')


  for packet in doc.packets_issued:
      spi_child = frappe.get_last_doc('Sales Person Issue Packets', filters={"packet_master": packet.packet_master, "parenttype": 'Sales Person Issue'})
      return_spi(spi_child.parent)

  doc.save()

    