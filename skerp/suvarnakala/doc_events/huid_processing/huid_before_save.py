import frappe

def before_save(doc,method):
  huid_status_update(doc,method)
  
  
def huid_status_update(doc,method):
  doc.status = 'Completed'
  for huid_item in doc.items:
      if(huid_item.huid == None):
          doc.status = 'Processing'
          break
  