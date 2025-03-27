import frappe

def before_save(doc,method):
  set_items(doc,method)
  
  
def set_items(doc,method):
  doc.items = []

  for packet in doc.packets:
      
      packet_doc = frappe.get_doc('Packet Master', packet.packet_master)
      for item in packet_doc.items:
          doc.append('items', {
              'item_code': item.item_code,
              'gross_weight': item.gross_weight,
              'net_weight': item.net_weight,
              'labour_touch': item.labour_touch,
              'item_labour_charges': item.item_labour_charges,
              'remarks': item.remarks,
              'labour_grams': item.labour_grams,
              'uom': item.uom,
              'purity': item.purity,
              'huid': item.huid,
              'rate': item.rate,
              'amount': item.amount,
              'pcs': item.pcs,
              'mani_moti_weight': item.mani_moti_weight,
              'batch_no': item.batch_no,
              'custom_qr_input': item.custom_qr_input,
              'custom_qr_data': item.custom_qr_data,
              'batch_no': item.batch_no,
              'serial_and_batch_bundle': item.serial_and_batch_bundle,
          })
    