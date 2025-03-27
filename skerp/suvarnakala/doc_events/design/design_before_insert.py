import frappe

def before_insert(doc,method):
  design_range_assigned(doc,method)
  
  
def design_range_assigned(doc,method):
  if not doc.range_assigned:
    from_range = frappe.db.get_value("Item Group", doc.item_sub_group, "custom_from")

    # Fetch all assigned ranges and sort them in descending order
    last_range_assigned = frappe.get_all("Design",
        filters={"item_sub_group": doc.item_sub_group},
        fields=["range_assigned"],
        limit=10000
    )

    # Extract the range_assigned values as integers and sort them
    assigned_ranges = [int(d['range_assigned']) for d in last_range_assigned]


    if assigned_ranges:
        max_assigned_range = max(assigned_ranges)
        final_range_count = max_assigned_range + 1
    else:
        final_range_count = from_range

    
    doc.range_assigned = int(final_range_count)

  else:
      from_range = frappe.db.get_value("Item Group", doc.item_sub_group, "custom_from_range")
      to_range = frappe.db.get_value("Item Group", doc.item_sub_group, "custom_to_range")
      
      if from_range is not None and to_range is not None:
          if  doc.range_assigned < int(from_range) or  doc.range_assigned >int(to_range):
              frappe.throw(f"Error: The range assigned ({doc.range_assigned}) is outside the design range for {doc.item_sub_group}")
      
      existing_range_assigned = frappe.get_all("Design",
      filters={"range_assigned": doc.range_assigned}
      )
      frappe.throw(f'{existing_range_assigned}')
      if existing_range_assigned:
          frappe.throw("Error: These range is already assigned to a design. Please assign a different value to these.")



  