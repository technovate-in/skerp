import frappe

def after_insert(doc, method):
  item_image_after_insert(doc, method)
  batch_number_for_item(doc,method)

def item_image_after_insert(doc, method):
  doc.image = f'https://sk-erp-dev.b-cdn.net/Item/{doc.name}.jpg'
  doc.save()
  
def batch_number_for_item(doc,method):
  current_date=frappe.utils.nowdate()
  current_year=current_date.split("-")[0]
  current_month=current_date.split("-")[1]

  reversed_year = current_year[-2:][::-1]
  reversed_month = current_month[::-1]
  new_item_code=reversed_year+reversed_month

  # frappe.msgprint("Batch number")

  if not doc.has_batch_no:
      doc.has_batch_no = 1
      doc.create_new_batch = 1
      doc.batch_number_series = f"{new_item_code}.####"
      
  doc.save()

  