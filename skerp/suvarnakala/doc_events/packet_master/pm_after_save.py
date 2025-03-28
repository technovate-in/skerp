import frappe

def after_save(doc,method):
  packet_split(doc,method)

def packet_split(doc,method):
  def create_single_packet(original_doc, item):
      new_doc = frappe.get_doc({
          "doctype": "Packet Master",
          "packet_split": "No Split",
          "inward_no": original_doc.inward_no,
          "items": [item],
      })
      new_doc.insert()

  def create_multiple_packet(original_doc, items):
      new_doc = frappe.get_doc({
          "doctype": "Packet Master",
          "packet_split": "No Split",
          "inward_no": original_doc.inward_no,
          "items": items,
      })
      new_doc.insert()

  if doc.packet_split == "Single Packet":
      if len(doc.items) <= 1:
          frappe.throw("There should be more than one item to create new packets.")

      for item in doc.items[1:]:
          create_single_packet(doc, item)

      # Retain only the first item and update relevant fields
      doc.items = [doc.items[0]]
      doc.item_code=doc.items[0].item_code
      doc.gross_weight = doc.items[0].gross_weight
      doc.net_weight = doc.items[0].net_weight
      doc.total_pcs = doc.items[0].pcs
      doc.item_amount = doc.items[0].amount
      doc.packet_split = "No Split"
      doc.save()
      frappe.msgprint("Single Packets Created Successfully")
      

  elif doc.packet_split == "Multiple Packet":
      if len(doc.items) <= 1:
          frappe.throw("There should be more than one item to create new packets.")

      item_groups = {}
      for item in doc.items:
          item_groups.setdefault(item.item_code, []).append(item)

      if len(item_groups) == 1:
          frappe.throw("All items have the same item code. Cannot create new packets.")

      # Store original items before deleting the document
      original_items = doc.items[:]
      doc.packet_split = "No Split"
      frappe.delete_doc("Packet Master", doc.name, force=True)

      for item_code, items in item_groups.items():
          create_multiple_packet(doc, items)
      
      frappe.msgprint("Packets created successfully.")
      

  elif doc.packet_split == "Multiple Packet (Split)":
      if doc.number_of_packets <= 1:
          frappe.throw("Number of packets should be greater than 1.")
      
      if len(doc.items) < doc.number_of_packets:
          frappe.throw('Number of packets cannot be more than total items.')
          
      # Store original items before deleting the document
      original_items = doc.items[:]
      doc.packet_split = "No Split"
      total_packets = doc.number_of_packets
      
      # Delete the original Packet Master document
      frappe.delete_doc("Packet Master", doc.name, force=True)

      # Calculate how many items per packet
      items_per_packet = len(original_items) // total_packets
      extra_items = len(original_items) % total_packets

      index = 0
      for i in range(total_packets):
          current_items = []
          count = items_per_packet + (1 if i < extra_items else 0)  # Distribute extra items

          for _ in range(count):
              if index < len(original_items):
                  current_items.append(original_items[index])
                  index = index + 1
          
          create_multiple_packet(doc, current_items)

      frappe.msgprint("Packets created successfully.")
      
    