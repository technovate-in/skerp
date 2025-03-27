import frappe

def after_insert(doc, method):
  design_image(doc,method)
  
def design_image(doc,method):
  doc.image = f'https://sk-erp-dev.b-cdn.net/Design/{doc.name}.jpg'
  doc.save()
  