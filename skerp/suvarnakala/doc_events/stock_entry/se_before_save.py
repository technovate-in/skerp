import frappe

def before_save(doc,method):
  stock_entry(doc,method)
  additional_cost_calc_for_non_stock_items(doc,method)
  ps_user_restriction_for_work_order(doc,method)
  stock_entry_packet_number(doc,method)

def stock_entry(doc,method):
  total_gross_weight=0
  tottal_net_weight=0
  for item in doc.items:
      if item.qty:
          total_gross_weight=total_gross_weight+item.qty
      if item.custom_net_weight:
          tottal_net_weight=tottal_net_weight+item.custom_net_weight
  doc.custom_total_gross_weight=total_gross_weight
  doc.custom_total_net_weight=tottal_net_weight
  
  
def additional_cost_calc_for_non_stock_items(doc,method):
  
  # Non-Stock item table amount calculation
  if len(doc.custom_non_stock_item_in_wo) > 0:
      for ns_item in doc.custom_non_stock_item_in_wo:
          if isinstance(ns_item.net_weight, (int, float)) and isinstance(ns_item.rate, (int, float)):
              ns_item.amount = ns_item.net_weight * ns_item.rate
          else:
              ns_item.amount = 0
              frappe.throw(f"Invalid values for net_weight or rate in non-stock item: {ns_item}", "Calculation Error")

  # Additional Cost Calculation
  if doc.stock_entry_type == 'Manufacture':
      if len(doc.custom_non_stock_item_in_wo) > 0:
          total_cost = 0
          for ns_item in doc.custom_non_stock_item_in_wo:
              total_cost = total_cost + ns_item.amount
          
          # doc.additional_costs = []
          # Frappe dosent allow filter or reduce not my fault
          mani_moti_added = False
          for cost in doc.additional_costs:
              if cost.description == "Mani Moti Adjustment":
                  cost.amount = total_cost
                  cost.base_amount = total_cost
                  mani_moti_added = True
                  break
          
          if not mani_moti_added:
              doc.append('additional_costs', {
                  'expense_account': 'Mani Moti - SK',
                  'description': 'Mani Moti Adjustment',
                  'amount': total_cost,
                  'base_amount': total_cost,
              })
    

def ps_user_restriction_for_work_order(doc,method):
  if frappe.session.user == "admin@example.com":
    # Skip further execution if the user is an admin
    pass

  else:
      # Get the roles of the current user
      # user_roles = frappe.get_roles(frappe.session.user)
      user_doc = frappe.get_doc("User", frappe.session.user)
      user_roles = [role.role for role in user_doc.roles]
      
      # If the user has the "PS USER" role
      if "PS User" in user_roles:
          # Check if the stock entry type is restricted
          restricted_types = ['Manufacture', 'Material Transfer for Manufacture']
          if doc.stock_entry_type in restricted_types:
              frappe.throw(
                  f"As a 'PS User', you are not allowed to save Stock Entries with the type '{doc.stock_entry_type}'."
              )
  
def stock_entry_packet_number(doc,method):
  for item in doc.items:  # Assuming 'items' is the child table fieldname
        if not item.custom_packet_number and item.batch_no:
            packet_number = frappe.db.get_value(
                "Packet master item",
                {"batch_no": item.batch_no, 'parenttype': 'Packet Master'},
                "parent"
            )
            if packet_number:
                item.custom_packet_number = packet_number
        
        if not item.custom_external_item_code and item.item_code:
            external_code_parts = item.item_code.split("-")  
            if len(external_code_parts) > 1:  
                external_code = "-".join(external_code_parts[1:]) 
                item.custom_external_item_code = external_code 

            
  