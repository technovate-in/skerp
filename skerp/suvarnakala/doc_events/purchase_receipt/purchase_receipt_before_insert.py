import frappe

def before_insert(doc,method):
   pr_data_import(doc,method)
   

def pr_data_import(doc,method):
  for item in doc.items:
        if item.custom_labour_touch:
                # Get purity percentage from Purity Master
            purity_percentage = frappe.db.get_value('Purity Master', item.custom_purity_master, 'purity_percentage')
            
            if purity_percentage:
                if purity_percentage == "99.999":
                    purity_percentage = 100.0
                    

                    # Get rate_per_gram from Daily Rate Master
                rate_per_gram = frappe.db.get_value('Daily Rate Master', {'active': 1}, 'rate_per_gram')
                    
                
 
                if rate_per_gram:
                    touch = item.qty * (float(purity_percentage) / 100)
                    labour_touch = (item.qty * (float(item.custom_labour_touch) / 100)) - touch
                    total_labour = touch + labour_touch
                    rate = rate_per_gram * (float(purity_percentage) / 100)

                    item.uom = "Gram"
                    item.custom_item_weight_999 = touch
                    item.custom_labour_weight_999 = labour_touch
                    item.custom_labour_ = total_labour
                    item.rate = rate
                   