import frappe

def before_save(doc,method):
  check_items_in_warehouse (doc,method)
  
  
def check_items_in_warehouse(doc,method):
  items_not_scanned = []
  if doc.warehouse:
      # Fetch all batch numbers currently present in the selected warehouse
      warehouse_batches = frappe.db.sql(
          """
          SELECT
              entry.batch_no,
              bundle.item_code,
              SUM(entry.qty) AS net_weight
          FROM
              `tabSerial and Batch Bundle` AS bundle
          JOIN
              `tabSerial and Batch Entry` AS entry
          ON
              bundle.name = entry.parent
          WHERE
              bundle.docstatus = 1
              AND bundle.warehouse = %(warehouse)s
          GROUP BY
              entry.batch_no, bundle.item_code
          HAVING
              net_weight > 0
          ORDER BY
              bundle.creation DESC
          """,
          {"warehouse": doc.warehouse},
          as_dict=True
      )
  
  if len(doc.items_scanned) > 0:
      # Extract batch numbers from items_scanned for quick lookup
      scanned_batch_numbers = set(item.batch_no for item in doc.items_scanned)
  
      # Find batches not scanned
      items_not_scanned = []  # List to store missing batch details
      for batch in warehouse_batches:
          if batch['batch_no'] not in scanned_batch_numbers:
              # Add missing batch details to the list
              items_not_scanned.append({
                  "batch_no": batch['batch_no'],
                  "item_code": batch['item_code'],
                  "net_weight": batch.get('net_weight', 0)  # Use 'net_weight' for the child table
              })
  
      # Avoid duplicating entries in 'items_not_scanned'
      existing_batches = set(entry.batch_no for entry in doc.items_not_scanned)
      print(len(warehouse_batches))
      print(len(items_not_scanned))
      for item in items_not_scanned:
          if item['batch_no'] not in existing_batches:
              doc.append("items_not_scanned", {
                  "batch_no": item['batch_no'],
                  # "batch_no":'12345',
                  "item_code": item['item_code'],
                  # "net_weight":2,
                  "net_weight": item['net_weight']
              })
    