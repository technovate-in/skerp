import frappe

def before_save(doc,method):
  qr_for_packet_master_items(doc,method)
  packet_master_total_calculation(doc,method)
  

def qr_for_packet_master_items(doc,method):
  doc.packet_no = doc.name[5:] # only Number from doc.name

  for item in doc.items:
      
      external_code = frappe.db.get_value('Item', item.item_code, 'custom_external_code')



      title = f"""{doc.name}||
      {external_code}||
      {item.gross_weight}||
      {item.net_weight}||
      {item.pcs}||
      {item.purity}||
      {item.huid}||
      {item.batch_no}"""



      # Check if QR Demo already exists
      exists = frappe.db.exists('QR Demo', title)

      if exists:
              qr_demo = frappe.get_doc("QR Demo", title)
              # frappe.msgprint(qr_demo.title)
              
      else:
              qr_demo = frappe.new_doc("QR Demo")
              qr_demo.title = title
              qr_demo.insert()

          
      item.custom_qr_input = qr_demo.title
      item.custom_qr_data = qr_demo.qr_code

      # doc.save()


def packet_master_total_calculation(doc,method):  
    total_items = int(len(doc.items))
    total_gross = 0
    total_net = 0
    total_rate = 0
    total_amount = 0
    total_pcs = 0
    total_quantity=0
    total_mani_moti = 0

    for item in doc.items:
        total_gross = total_gross + item.gross_weight
        total_net = total_net + item.net_weight
        total_rate = total_rate + item.rate
        total_amount = total_amount + item.amount
        total_pcs = total_pcs + item.pcs
        total_mani_moti = total_mani_moti + item.mani_moti_weight

    if len(doc.items) > 0:
        doc.gross_weight = total_gross
        doc.net_weight = total_net
        doc.avg_rate = total_rate/total_items
        doc.item_amount = total_amount
        doc.total_pcs = total_pcs
        doc.total_quantity=len(doc.items)
        doc.total_mani_moti_weight = total_mani_moti
    else:
        doc.gross_weight = 0
        doc.net_weight = 0
        doc.avg_rate = 0
        doc.item_amount = 0
        doc.total_pcs = 0
        doc.total_mani_weight = 0
        doc.total_mani_moti_weight = 0