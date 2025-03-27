

import frappe

def after_rename(doc,method):
 item_image_after_rename(doc,method)

def item_image_after_rename(doc,method):
  frappe.db.set_value('Item', doc.name, 'image', f'https://sk-erp-dev.b-cdn.net/Item/{doc.name}.jpg')
  