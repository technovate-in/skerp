import frappe

def before_insert(doc, method):
  warehouse_validation(doc,method)
  validation_for_return(doc,method)

def warehouse_validation(doc,method):
  for item in doc.items:
    qty = frappe.call('erpnext.stock.doctype.batch.batch.get_batch_qty', batch_no = item.batch_no, warehouse='Sales Person Issue - SK')
    
    if qty != item.weightgramct:
        frappe.throw(f"Item: {item.item_code} ({item.batch_no}) is not available for Issue. (Error: Not in Warehouse)")
    
    orders = frappe.db.sql(f"""
    SELECT parent 
    FROM `tabSales Order Item` 
    WHERE custom_bch_no = '{item.batch_no}' and item_code = '{item.item_code}' 
    ORDER BY creation DESC""", as_dict=1)
    
    for order in orders:
        if frappe.db.get_value('Sales Order', order.parent, 'docstatus') == 1:
            frappe.throw(f"Item: {item.item_code} ({item.batch_no}) is already sold in {order.parent}.")
  
def validation_for_return(doc,method):
      # sales_person_items_return = doc.sales_person

    # if not doc.packets_issued:
    #     frappe.throw(_("Packet Master table is empty or not initialized."))

    # # Iterate Packets
    # for packet in doc.packets_issued:
    #     packet_no = packet.packet_master
        
    #     # sql query to fetch sales person
    #     result = frappe.db.sql("""
    #         SELECT
    #             spi.sales_person
    #         FROM
    #             `tabSales Person Issue Packets` AS spip
    #         JOIN
    #             `tabSales Person Issue` AS spi ON spip.parent = spi.name
    #         WHERE 
    #             spip.packet_master = %s
    #         ORDER BY
    #             spip.modified DESC
    #         LIMIT 1
    #     """, (packet_no,), as_dict=True)
        
    #     # Check if the result is empty
    #     if not result:
    #         frappe.throw(_("Could not find Sales Person Issue for Packet Master: ") + packet_no)
        
    #     # Get the sales_person from the result
    #     sales_person_issue = result[0].get('sales_person')
        
    #     # Compare the sales_person values
    #     if sales_person_issue != sales_person_items_return:
    #         frappe.throw(_("Packet ") + packet_no + _(" was not issued by ") + sales_person_items_return)









    def get_sales_person_for_packet(packet_no):
        # """
        # Fetch the sales person for a given packet number.
        # """
        result = frappe.db.sql("""
            SELECT
                spi.sales_person
            FROM
                `tabSales Person Issue Packets` AS spip
            JOIN
                `tabSales Person Issue` AS spi ON spip.parent = spi.name
            WHERE 
                spip.packet_master = %s
            ORDER BY
                spip.modified DESC
            LIMIT 1
        """, (packet_no,), as_dict=True)
        
        if not result:
            frappe.throw(_("Could not find Sales Person Issue for Packet Master: ") + packet_no)
        
        return result[0].get('sales_person')


    if not doc.packets_issued:
        frappe.throw(_("Packet Master table is empty or not initialized."))

    # Get the sales person from the first packet
    first_packet = doc.packets_issued[0]
    sales_person_items_return = get_sales_person_for_packet(first_packet.packet_master)

    # Set the sales person in the doctype
    doc.sales_person = sales_person_items_return
    # frappe.throw(doc.sales_person)

    # Iterate over the rest of the packets and validate the sales person
    for packet in doc.packets_issued[1:]:
        sales_person_issue = get_sales_person_for_packet(packet.packet_master)
        
        # Compare the sales person values
        if sales_person_issue != sales_person_items_return:
            frappe.throw(_("Packet {0} was not issued by {1}").format(packet.packet_master, sales_person_items_return))
            

    # Iterate Packets  