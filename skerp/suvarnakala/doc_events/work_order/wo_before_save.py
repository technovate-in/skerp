import frappe
from frappe import _

def before_save(doc,method):
  add_item_from_packet(doc,method)
  work_order_non_stock_item_rate_validation(doc,method)
  
def add_item_from_packet(doc,method):
  item = frappe.get_doc("Packet Master", doc.custom_packet).items[0]

  item_list = []
  for req_item in doc.required_items:
      item_list.append(req_item.item_code == doc.production_item)
      
  item_detail = frappe.call('erpnext.stock.doctype.item.item.get_item_details', item_code = item.item_code, company = doc.company)

  if not any(item_list):
      # frappe.msgprint(item.item_code)
      doc.append("required_items", {
          "item_code": item.item_code,
          "custom_purity": item.custom_item_purity,
          "required_qty": item.net_weight,
          'custom_gross_weight': item.gross_weight,
          'custom_bch_no': item.batch_no,
          "amount": item.amount,
          "rate": item.rate,
          "item_name": item_detail.item_name,
          "description": item_detail.description,
          "source_warehouse": item_detail.default_warehouse,
          "allow_alternative_item": item_detail.allow_alternative_item,
          "include_item_in_manufacturing": item_detail.include_item_in_manufacturing,
      })

  # Calculate Total

  # if doc.custom_jadtar_selection_ == 'In-house Jadtar Process':
  #     old_work = frappe.get_last_doc('Work Order', filters={"Status": "Completed", "custom_packet": doc.custom_packet, "custom_jadtar_selection_": "Primary Process"})
      
  #     mani_moti_total = 0
  #     mani_total = 0
  #     moti_total = 0
  #     less_jadtar_weight = 0
      
  #     for item in old_work.required_items:
  #         if frappe.db.get_value('Item', item.item_code, 'custom_sub_group') == 'Mani':
  #             mani_total = mani_total + item.consumed_qty
              
  #         if frappe.db.get_value('Item', item.item_code, 'custom_sub_group') == 'Moti':
  #             moti_total = moti_total + item.consumed_qty
          
  #         if item.item_code == doc.production_item:
  #             less_jadtar_weight = item.custom_gross_weight - item.required_qty
      
  #     mani_moti_total = mani_total + moti_total
  #     doc.custom_less_jadtar_weight = less_jadtar_weight
  #     doc.custom_mani_moti_total = mani_moti_total * (doc.custom_mani_moti_adjustment / 100)
  #     doc.custom_mani_total = mani_total * (doc.custom_mani_moti_adjustment / 100)
  #     doc.custom_moti_total = moti_total * (doc.custom_mani_moti_adjustment / 100)
      
  #     for item in doc.required_items:
  #         if item.item_code == doc.production_item:
  #             doc.custom_jadtar_finishing_gold_adjustment = (item.custom_gross_weight - doc.custom_mani_moti_total - doc.custom_less_jadtar_weight) - item.required_qty
  
def work_order_non_stock_item_rate_validation(doc,method):
  for idx, item in enumerate(doc.custom_non_stock_item_in_wo, start=1):
        if item.rate == 0:
            frappe.throw(_(f'Rate cannot be zero for the item {item.item} at row {idx} in Non Stock Items'))
        else:
            item.amount=item.net_weight*item.rate
  

    