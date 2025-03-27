import frappe

def after_insert(doc, method):
  create_new_supplier(doc,method)
  
def create_new_supplier(doc,method):
  supplier = frappe.get_doc({
    'doctype': 'Supplier',
    'supplier_name': doc.full_name,
    'custom_supplier_code': doc.short_name,
    'website': doc.website,
    'country': doc.country,
    'custom_supplier_touch': [{
        'from_date': frappe.utils.today(),
        'to_date': '2099-12-31',
        'touch': doc.custom_labour_rate,
    }],
    'custom_manufacturer': doc.name,
})

  supplier.insert()
  