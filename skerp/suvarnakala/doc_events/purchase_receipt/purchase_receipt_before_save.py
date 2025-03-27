import frappe

def before_save(doc, method):
    payement_of_labour_in_pr(doc, method)
    pr_labour_amount(doc, method)
    

    # check if the payment is for labour
def payement_of_labour_in_pr(doc,method):
     if doc.custom_payment_of_labour == "--Select--":
        frappe.throw(f'Please select type of payment of labour')
        
def pr_labour_amount(doc,method):
  if doc.custom_payment_of_labour == 'Cash':
    total_labour_amount = 0

    # Calculate total labour amount
    for item in doc.items:
        labour_rate = item.custom_labour_rate
        labour_amount = item.custom_labour_rate * item.custom_item_weight_999
        item.custom_labour_amount = labour_amount
        total_labour_amount = total_labour_amount + labour_amount

    doc.custom_total_labour = total_labour_amount

    # Check if 'Labour Cost - SK' exists in taxes table
    labour_cost_index = -1
    # labour_cost_exists = any(tax.account_head == 'Labour Cost - SK' for tax in doc.taxes)
    
    for index, tax in enumerate(doc.taxes):
        if tax.account_head == 'Labour Cost - SK':
            labour_cost_index = index
    
    if labour_cost_index != -1:
        # 'Labour Cost - SK' exists
        print(f'labour cost found at {labour_cost_index}')
        existing_tax = doc.taxes[labour_cost_index]
        print(f'existing tax : {existing_tax.tax_amount}')
        print(f'item labour charge {doc.custom_total_labour}')
        if existing_tax.tax_amount == total_labour_amount:
            print("Labour Charges are correct according to individual item charges.")
        else:
           print("Labour Charges have been manually added.")
        
    else:
        # Add a new row if 'Labour Cost - SK' does not exist
        doc.append('taxes', {
            'category': 'Total',
            'charge_type': 'Actual',
            'account_head': 'Labour Cost - SK',
            'add_deduct_tax': 'Add',
            'description': 'Labour Cost',
            'tax_amount': total_labour_amount,
            'total': doc.total + total_labour_amount
        })

  
      
       