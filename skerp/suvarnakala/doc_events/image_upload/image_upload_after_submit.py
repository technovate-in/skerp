import frappe

def after_submit(doc,method):
  image_upload_to_cdn(doc,method)
  
def image_upload_to_cdn(doc,method):
  # Get BunnyCDN Config
  config = frappe.get_doc('BunnyCDN Settings')

  api_key = config.get_password(fieldname='bunny_storage_api_key', raise_exception=False)
  storage_zone_name = config.storage_zone_name

  if doc.upload_type == 'Packet Master':
      storage_zone_folder = config.packet_master_storage_zone_folder
  elif doc.upload_type == 'Design':
      storage_zone_folder = config.design_storage_zone_folder
  elif doc.upload_type == 'Item':
      storage_zone_folder = config.item_storage_zone_folder
  else:
      frappe.throw("Folder Not Set")

  base_url = "storage.bunnycdn.com"

  for item in doc.upload_images:
      # Get File doc
      name = frappe.db.get_value("File", {"file_url": item.image})
      file = frappe.get_doc("File", name)
      
      url = f"https://{base_url}/{storage_zone_name}/{storage_zone_folder}/{item.docname}.{file.file_type.lower()}"

      headers = {
          "AccessKey": api_key,
          "Content-Type": "application/octet-stream",
          "accept": "application/json"
      }

      try:
          response = frappe.make_put_request(url, headers=headers, data=file.get_content())
      except Exception as e:
          frappe.throw(title=f'Packet({item.docname}) Image Upload Failed', msg=str(e))

    