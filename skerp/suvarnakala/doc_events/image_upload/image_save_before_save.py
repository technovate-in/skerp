import frappe

def before_save(doc,method):
  image_upload_validation(doc,method)
  
def image_upload_validation(doc,method):
  for item in doc.upload_images:
    file_type = frappe.db.get_value("File", {"file_url": item.image}, 'file_type')
    if file_type != 'JPG':
        frappe.throw(msg=f'Please make sure the file uploaded for {item.docname} is JPG', title='Invalid File Format')
  
  