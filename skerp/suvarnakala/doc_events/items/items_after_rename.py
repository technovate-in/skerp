

import frappe

def after_rename(doc, method, old_name, new_name, force=False):
 item_image_after_rename(doc,method)

def item_image_after_rename(doc,method):
  frappe.db.set_value('Item', doc.name, 'image', f'https://sk-erp-dev.b-cdn.net/Item/{doc.name}.jpg')
  