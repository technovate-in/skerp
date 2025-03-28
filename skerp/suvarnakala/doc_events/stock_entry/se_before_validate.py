import frappe

def before_validate(doc,method):
  source_warehouse_on_qr_scan(doc,method)
  wo_jadtar_step2(doc,method)
  wo_jadtar_step1(doc,method)

def wo_jadtar_step2(doc,method):
  if doc.stock_entry_type == 'Manufacture':
    jadtar_wo = frappe.get_doc('Work Order',doc.work_order)
    
    packet = frappe.get_doc('Packet Master', jadtar_wo.custom_packet)
    
    for idx, item in enumerate(doc.items):
        if item.item_code == jadtar_wo.production_item and item.is_finished_item == 0 and item.is_scrap_item == 0:
            packet_item = packet.items[0]
            if item.qty != packet_item.net_weight or item.custom_net_weight != packet_item.gross_weight or item.custom_purity != packet_item.purity:
                frappe.throw( title=f'Manufactured Item <strong>({item.item_code})</strong> Changed', msg=f'Packet Weight for {item.item_code}: </br>GW - {packet_item.gross_weight}</br>NW - {packet_item.net_weight}</br>Change Item Weight in ROW #{idx+1}')
    
    if jadtar_wo.custom_jadtar_selection == '2-Mani Moti':
        
        prod_item_index = None
        scrap_item_index = None
        loss_item_index = None
        old_net_w = 0
        # old_fine_w = 0
        old_gross_w = 0
        # raw_w = 0
        new_gross_w = 0
        # new_fine_w = 0
        new_net_w = 0
        # scrap_w = 0
        item_purity = 0 
        moti_weight = 0
        
        last_rate_master = task = frappe.get_last_doc('Daily Rate Master', filters={"active": 1})
        rate = last_rate_master.rate_per_gram
        
        for index,item in enumerate(doc.items):
            
            if item.item_code == jadtar_wo.production_item and item.is_finished_item == 0 and item.is_scrap_item == 0:
                old_gross_w = item.custom_net_weight
                old_net_w = item.qty
                new_net_w  = new_net_w + item.qty 
                new_gross_w = new_gross_w + item.custom_net_weight
                
                if item.custom_purity:
                    item_purity = frappe.db.get_value('Purity Master',item.custom_purity,'purity_percentage')
                else:
                    frappe.throw('Item Purity Not Found.')
            
            elif item.item_code != jadtar_wo.production_item and item.is_finished_item == 0 and item.is_scrap_item == 0:
                new_net_w = new_net_w + item.qty
                new_gross_w = new_gross_w + item.qty
                
        #         raw_w = raw_w + item.qty
            
            # elif item.item_code == jadtar_wo.production_item and item.is_finished_item == 1:
            #     prod_item_index = index
                
            # elif item.item_code != jadtar_wo.production_item and item.is_scrap_item == 1:
            #     scrap_item_index = index
            
            elif item.item_code == jadtar_wo.production_item and item.is_finished_item == 1:
                prod_item_index = index
                
            elif item.item_code != jadtar_wo.production_item and item.is_scrap_item == 1:
                if item.item_code == 'Scrap 99':
                    # frappe.msgprint('scrap')
                    item.t_warehouse = 'Scrap Loss - SK'
                    item.basic_rate = rate
                    item.custom_purity = '24K'
                    loss_item_index = index
                else:
                    scrap_item_index = index
        
        
        
        for index,item in enumerate(doc.custom_non_stock_item_in_wo):
            if item.net_weight > item.transferred_qty:
                frappe.throw(msg=f"{item.item} greater than Transferred Quantity", title="Invalid Net Weight")
            
            new_gross_w = new_gross_w + item.net_weight
            moti_weight = moti_weight + item.net_weight
        
        adj_new_net_w = (new_net_w * item_purity / 100) / doc.custom_adjustment
        # frappe.throw(f"{new_net_w} - {adj_new_net_w} - {new_gross_w}")
        if doc.items[prod_item_index].custom_net_weight == old_gross_w:
            doc.items[prod_item_index].custom_net_weight = round(new_gross_w,3)
            frappe.msgprint(msg="Please set new gross weight", title="Gross Weight", indicator="yellow")
        doc.items[prod_item_index].qty = round(adj_new_net_w,3)
        # doc.items[scrap_item_index].qty = adj_new_net_w - new_net_w
        doc.items[loss_item_index].qty = round((adj_new_net_w - new_net_w),3)
        
        frappe.db.set_value("Work Order", doc.work_order, "custom_refund_value", adj_new_net_w - new_net_w)
        # # Set Difference Percent in WO
        diff_percent = ((doc.items[prod_item_index].custom_net_weight - adj_new_net_w)/(moti_weight + (old_gross_w - old_net_w))) * 100
        # frappe.throw(f'({doc.items[prod_item_index].custom_net_weight} - {adj_new_net_w}) / ({moti_weight} + ({old_gross_w} + {old_net_w})) = {diff_percent}')
        doc.custom_difference = diff_percent
        frappe.db.set_value("Work Order", doc.work_order, "custom_difference", diff_percent)
        
        
        
        #jadtar charges
        prod_item = doc.items[prod_item_index]
        uom_type = doc.custom_jadtar_uom
        jadtar_rate = doc.custom_jadtar_rate
        
        if uom_type != frappe.db.get_value('Stock Entry',doc.name,'custom_jadtar_uom'):
            doc.custom_total_jadtar_charges = 0
        # Calculate amounts based on UOM type
        amount = prod_item.qty * jadtar_rate if uom_type == 'Grams' else prod_item.custom_pcs * jadtar_rate
        
        # Clear charges if total charges mismatch
        if doc.custom_total_jadtar_charges != 0 and doc.custom_total_jadtar_charges != amount:
            doc.custom_jadtar_charges = []
            doc.custom_jadtar_rate = 0
        else:
            # Clear existing charges
            doc.custom_jadtar_charges = []
            # Add new charge entry
            doc.append('custom_jadtar_charges', {
                'item_code': prod_item.item_code,
                'quantity': prod_item.qty if uom_type == 'Grams' else prod_item.custom_pcs,
                'jadtar_rate': jadtar_rate,
                'jadtar_amount': amount,
            })
            # Update total charges
            doc.custom_total_jadtar_charges = amount
  
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
def wo_jadtar_step1(doc,method):
  if doc.stock_entry_type == 'Manufacture':
    jadtar_wo = frappe.get_doc('Work Order',doc.work_order)
    
    packet = frappe.get_doc('Packet Master', jadtar_wo.custom_packet)
    
    for idx, item in enumerate(doc.items):
        if item.item_code == jadtar_wo.production_item and item.is_finished_item == 0 and item.is_scrap_item == 0:
            packet_item = packet.items[0]
            if item.qty != packet_item.net_weight or item.custom_net_weight != packet_item.gross_weight or item.custom_purity != packet_item.purity:
                frappe.throw( title=f'Manufactured Item <strong>({item.item_code})</strong> Changed', msg=f'Packet Weight for {item.item_code}: </br>GW - {packet_item.gross_weight}</br>NW - {packet_item.net_weight}</br>Change Item Weight in ROW #{idx+1}')
    
    if jadtar_wo.custom_jadtar_selection == '1-Kundan':
        
        prod_item_index = None
        scrap_item_index = None
        loss_item_index = None
        old_net_w = 0
        old_fine_w = 0
        gross_w = 0
        raw_w = 0
        new_fine_w = 0
        new_net_w = 0
        scrap_w = 0
        
        last_rate_master = task = frappe.get_last_doc('Daily Rate Master', filters={"active": 1})
        rate = last_rate_master.rate_per_gram
        # frappe.throw(f'{rate}')
        
        for index,item in enumerate(doc.items):
            if item.item_code == jadtar_wo.production_item and item.is_finished_item == 0 and item.is_scrap_item == 0:
                if item.custom_purity:
                    purity = frappe.db.get_value('Purity Master',item.custom_purity,'purity_percentage')
                else:
                    frappe.throw('Item Purity Not Found.')
                # frappe.throw(f"{item.custom_purity}")
                old_net_w = item.qty
                gross_w = item.custom_net_weight
                # frappe.throw(f'{purity}')
                old_fine_w = old_net_w * purity/100
                # new_fine_w = new_fine_w + old_fine_w
            
            elif item.item_code != jadtar_wo.production_item and item.is_finished_item == 0 and item.is_scrap_item == 0:
                raw_w = raw_w + item.qty
            
            elif item.item_code == jadtar_wo.production_item and item.is_finished_item == 1:
                prod_item_index = index
                
            elif item.item_code != jadtar_wo.production_item and item.is_scrap_item == 1:
                if item.item_code == 'Scrap 99':
                    # frappe.msgprint('scrap')
                    item.t_warehouse = 'Scrap Loss - SK'
                    item.basic_rate = rate
                    item.custom_purity = '24K'
                    loss_item_index = index
                else:
                    scrap_item_index = index
                
        
        # Calculating new Net Weight    
        new_net_w = round((raw_w + old_fine_w) / doc.custom_adjustment, 3)
        # frappe.msgprint(f"Calc : {new_net_w}")
        # frappe.msgprint(f"{doc.items[prod_item_index].qty}")
        print(new_net_w)
        doc.items[prod_item_index].qty = new_net_w
        doc.items[prod_item_index].transfer_qty = new_net_w
        # doc.fg_completed_qty = round(new_net_w, 3)
        # frappe.msgprint(f"{doc.items[prod_item_index].qty}")
        
        # Calculating Bhukko/Scrap Weight
        scrap_w = (new_net_w - old_net_w) - raw_w
        # doc.items[scrap_item_index].qty = scrap_w
        doc.items[loss_item_index].qty = scrap_w
        
        frappe.db.set_value("Work Order", doc.work_order, "custom_refund_value", scrap_w)
        
        # frappe.throw(f'New Net: {new_net_w}, Scrap: {scrap_w}')
        # frappe.throw(f'{old_fine_w}')
        
        # Set Difference Percent in WO
        new_gross_wt = doc.items[prod_item_index].custom_net_weight
        diff_percent = ((new_gross_wt - new_net_w) / (new_gross_wt - raw_w - old_net_w)) * 100
        # frappe.throw(f'{gross_w - new_net_w}/{gross_w - raw_w - old_net_w} = {diff_percent}')
        
        doc.custom_difference = diff_percent
        frappe.db.set_value("Work Order", doc.work_order, "custom_difference", diff_percent)
        
        
        
        #jadtar charges
        prod_item = doc.items[prod_item_index]
        uom_type = doc.custom_jadtar_uom
        jadtar_rate = doc.custom_jadtar_rate
        
        if uom_type != frappe.db.get_value('Stock Entry',doc.name,'custom_jadtar_uom') or jadtar_rate != frappe.db.get_value('Stock Entry',doc.name,'custom_jadtar_rate'):
            doc.custom_total_jadtar_charges = 0
        # Calculate amounts based on UOM type
        amount = prod_item.qty * jadtar_rate if uom_type == 'Grams' else prod_item.custom_pcs * jadtar_rate
        
        # Clear charges if total charges mismatch
        if doc.custom_total_jadtar_charges != 0 and doc.custom_total_jadtar_charges != amount:
            doc.custom_jadtar_charges = []
            doc.custom_jadtar_rate = 0
        else:
            # Clear existing charges
            doc.custom_jadtar_charges = []
            # Add new charge entry
            doc.append('custom_jadtar_charges', {
                'item_code': prod_item.item_code,
                'quantity': prod_item.qty if uom_type == 'Grams' else prod_item.custom_pcs,
                'jadtar_rate': jadtar_rate,
                'jadtar_amount': amount,
            })
            # Update total charges
            doc.custom_total_jadtar_charges = amount


def source_warehouse_on_qr_scan(doc,method):
    def get_latest_warehouse(batch_no):
      result = frappe.db.sql("""
          SELECT * 
          FROM `tabSerial and Batch Entry`
          WHERE batch_no = %s AND docstatus = 1
          ORDER BY modified DESC
          LIMIT 1
      """, (batch_no,), as_dict=True)
          
      if result:
          return result[0].warehouse
      else:
          return None
      
      
    for item in doc.items:
      if item.batch_no:
          warehouse = get_latest_warehouse(item.batch_no)
          if warehouse:
              item.s_warehouse = warehouse
          else:
              frappe.throw(f"No warehouse found for batch number {item.batch_no}")
      
    