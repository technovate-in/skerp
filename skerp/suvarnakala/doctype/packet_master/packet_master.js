frappe.ui.form.on('Packet Master', { 
  //// Filter For Items Child Table
    inward_no: async function(frm){
        filter_items(frm);
  
       //// Fetch From Purchase Receipt 
        if (frm.doc.inward_no) {
          // First, fetch the last active 'Daily Rate Master'
  
                  // Then, fetch the 'Purchase Receipt' items
                  await frappe.call({
                      method: 'frappe.client.get',
                      args: {
                          doctype: 'Purchase Receipt',
                          name: frm.doc.inward_no
                      },
                      callback: function(r) {
                          if (!r.exc) {
                              var purchase_receipt_items = r.message.items;
  
                              // Set LBR Rate, LBR Amount
                              const gst_taxes = ['CGST', 'IGST', 'SGST'];
                              var lbr_rate = r.message.taxes.reduce((acc, tax) => {
                                  if (gst_taxes.includes(tax.description)) return acc;
                                  else if (tax.add_deduct_tax == 'Add') return acc + tax.tax_amount;
                                  else return acc - tax.tax_amount;
                              }, 0);
                              frm.set_value('lbr_rate', lbr_rate);
                              frm.set_value('lbr_amount', lbr_rate);
  
                              // Clear the items table before processing
                              frm.clear_table('items');
  
                              // Process all items
                              purchase_receipt_items.forEach(function(item) {
  
                                              frm.add_child('items', {
                                                  'item_code': item.item_code,
                                                  'gross_weight': item.custom_net_weight,
                                                  'net_weight': item.qty,
                                                  'uom': item.uom,
                                                  'rate': item.rate,
                                                  'amount': item.amount,
                                                  'pcs': item.custom_pcs,
                                                  'purity': item.custom_purity_master,
                                                  'labour_touch': item.custom_labour_touch,
                                                  'labour_grams': item.custom_labour_weight_999,
                                                  'serial_and_batch_bundle': item.serial_and_batch_bundle,
                                              });
                                              frm.refresh_field('items');
                                          
  
                                          // After processing all items, update the form fields
                                          var total_gross = 0, total_net = 0, total_amount = 0, total_pcs = 0;
  
                                          frm.doc.items.forEach(function(child) {
                                              total_gross += child.gross_weight || 0;
                                              total_net += child.net_weight || 0;
                                              total_amount += child.amount || 0;
                                              total_pcs += child.pcs || 0;
                                          });
                                          frm.set_value('gross_weight', total_gross);
                                          frm.set_value('net_weight', total_net);
                                          frm.set_value('item_amount', total_amount);
                                          frm.set_value('total_pcs', total_pcs);
                                          frm.set_value('avg_rate', total_gross ? (total_amount / total_gross) : 0);
                              });
                          }
                      }
                  });
        }
        
        /// Packet Master: Item Batch no. Fetch
        process_items(frm);
    },
  
  /// Packet Master
    onload(frm) {

      // Get the roles of the current logged-in user
      const allowed_roles = ['PS Sales User', 'PS Sales Manager'];
      const user_roles = frappe.user_roles;

  
      // Check if user has any of the allowed roles
      const has_allowed_role = user_roles.some(role => allowed_roles.includes(role));
  
      // Toggle visibility of 'item_code' field in the child table
      frm.fields_dict['items'].grid.toggle_display('item_code', has_allowed_role);
     },
  
  
  //// PM: Inward No. Query
     refresh: function(frm) {
      // frm.set_query('inward_no', function() {
      //     return {
      //         query: 'purchase_receipt_in_packet_master'
      //     };
      // });

      frappe.call({
          method: 'skerp.suvarnakala.api.pm_inward_no.purchase_receipt_in_packet_master',
          callback: function(response) {
            //   console.log(response.message);
              
              frm.set_query('inward_no', function() {
                  return{
                      filters: {
                              name: ['in', response.message]
                          }
                  }
              });
          }
      });
  }
  });
  
  
  let filter_items = function(frm){
    if (frm.doc.inward_no){
        frappe.db.get_doc('Purchase Receipt', frm.doc.inward_no)
        .then(pr => {
           
            let item_codes = pr.items.map(item => item.item_code);
           
  
            // Set the query inside the .then block to ensure it's set after item_codes is populated
            frm.set_query('item_code', 'items', function(){
                return {
                    "filters": [
                        ['item_code', 'in', item_codes]
                    ]
                };
            });
        });
    }
  };
  
  async function process_items(frm) {
    console.log("Hello");
    if (!frm.doc.items || frm.doc.items.length === 0) return; // Skip if no items
  
    let promises = frm.doc.items.map(item => 
        item.serial_and_batch_bundle ? update_batch_no(item) : frappe.throw(`Batch No. Error: Serial and Batch Bundle is missing for item ${item.item_code}`)
    );
    console.log("Hello");
    console.log(promises)
  
    try {
        await Promise.all(promises); // Wait for all API calls
        frm.refresh_field('items'); // Refresh once after all updates
    } catch (error) {
        frappe.msgprint({ title: "Error", message: error.message, indicator: "red" });
    }
  }
  
  async function update_batch_no(item) {
    try {
        let { message } = await frappe.call({
            method: 'frappe.client.get',
            args: { doctype: 'Serial and Batch Bundle', name: item.serial_and_batch_bundle }
        });
  
        if (message?.entries?.length) {
            item.batch_no = message.entries[0].batch_no;
        } else {
            throw new Error(`No entries found in Serial and Batch Bundle: ${item.serial_and_batch_bundle}`);
        }
    } catch (error) {
        throw new Error(`Error fetching Serial and Batch Bundle: ${item.serial_and_batch_bundle}`);
    }
  }