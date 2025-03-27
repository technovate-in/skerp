import frappe

def after_submit(doc,method):
  stock_ledger_entry(doc,method)
  

def stock_ledger_entry (doc,method):
  voucher_no = doc.name
  item_dict = dict()

  for item in doc.items:
      item_code = item.get('item_code')  # Assuming item_code is a key in each item dictionary
      purity = item.get('custom_purity_master')  # Assuming purity is a key in each item dictionary
      net_weight = item.get('custom_net_weight')  # Assuming net_weight is a key in each item dictionary
      gross_weight = item.get('qty')
      
      if(item_code,gross_weight) not in item_dict:
          item_dict[(item_code, gross_weight)] = [[net_weight,purity]]
      else:
          item_dict[(item_code,gross_weight)].append([net_weight,purity])



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
      
      # # Fetch the name of the stock ledger entry based on the voucher_no and item_code
      # stock_ledger_entry_name = frappe.db.get_value(
      #     "Stock Ledger Entry", 
      #     {"voucher_no": voucher_no, "item_code": item_code, "actual_qty": gross_weight,}, 
      #     "name"
      # )
      
      # if stock_ledger_entry_name:
      #     # Update the purity and net_weight fields in the stock ledger entry
      #     frappe.db.set_value(
      #         "Stock Ledger Entry", 
      #         stock_ledger_entry_name, 
      #         {"custom_purity": purity, "custom_net_weight": net_weight}
      #     )
      #     # frappe.msgprint(f'Stock Ledger Entry {stock_ledger_entry_name} updated with purity: {purity} and net_weight: {net_weight}')
      # else:
      #     frappe.msgprint(f'No matching stock ledger entry found for item {item_code}.')

    
