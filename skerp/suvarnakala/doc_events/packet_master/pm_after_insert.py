import frappe

def after_insert(doc,method):
  packet_master_image(doc,method)

def packet_master_image(doc,method):
  doc.image = f'https://sk-erp-dev.b-cdn.net/Test/{doc.name}.jpg'
  doc.save()
  