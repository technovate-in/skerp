import frappe

def cron_monthly(doc,method):
  def mail_status(sub, title, msg):
    # recipients = [
    #     'khush.ramani@technovate.in',
    #     'pratham.shah@technovate.in',
    #     'tushar.thakkar@technovate.in'
    # ]
    
    # frappe.sendmail(
    #     recipients=recipients,
    #     subject=sub,
    #     header=title,
    #     message=msg
    # )
    pass


  def generate_new_name():
      month_map = {
          '04': 'a',
          '06': 'c',
          '07': 'd',
          '08': 'i',
          '11': 'k',
          '05': 'n',
          '03': 'p',
          '10': 'r',
          '09': 's',
          '02': 'w',
          '01': 'x',
          '12': 'z'
      }
      
      year_map = {
          '8': 'a',
          '3': 'b',
          '0': 'c',
          '1': 'd',
          '2': 'g',
          '7': 'k',
          '6': 'm',
          '4': 'r',
          '5': 's',
          '9': 'x'
      }
      
      # Get the curr date and split
      curr_date = frappe.utils.today().split('-')     #[year, month, date]
      
      # Generate new prefix
      # mm/yy => mm + y + y 
      # Ex. 07/2024 : 07: d + 2: g + 4: r = dgr

      generated_name = month_map[curr_date[1]]
      for char in curr_date[0][2:]:
          generated_name = generated_name + year_map[char]
      generated_name = generated_name
      
      frappe.log(f"New Generated Name - {generated_name}")
      return generated_name


  def set_new_naming_rule(new_prefix):
      # Get last naming rule for Packet Master
      old_naming_rule = frappe.get_last_doc('Document Naming Rule', filters={"document_type": "Packet Master"})
      
      # Send Mail Starting Name Change
      mail_status('Starting SKERP DEV Packet Master Name Change', 
                  'Starting SKERP DEV Packet Master Name Change', 
                  f'Setting new name - {new_prefix} \n Removing Old Name - {old_naming_rule.prefix}')
      
      # Create New Naming Rule Document
      new_naming_rule = frappe.get_doc({
                              'doctype': 'Document Naming Rule',
                              'document_type': 'Packet Master',
                              'disabled': 1,
                              'prefix': new_prefix,
                              'prefix_digits': 5
                          })
      new_naming_rule.conditions = old_naming_rule.conditions
      new_naming_rule.insert()
      
      # Disable Old Rule Only AFTER New name is inserted
      old_naming_rule.disabled = 1
      old_naming_rule.save()
      
      new_naming_rule.disabled = 0
      new_naming_rule.save()


  try:
      new_prefix = generate_new_name()
      set_new_naming_rule(new_prefix)
      mail_status('Successfully Completed SKERP DEV Name Change', 
                  'Starting SKERP DEV Name Change',
                  f'Date - {frappe.utils.today()} \n New prefix - {new_prefix}')
  except Exception as e:
      frappe.log_error(e)
      mail_status('Packet Master Monthly Job Failed', 
                  'Packet Master Monthly Job Failed',
                  f'Error - {repr(e)} \n View Error Log for more Details')
