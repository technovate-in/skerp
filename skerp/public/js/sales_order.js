frappe.ui.form.on('Sales Order', {
/// Sales Order Total Net Weight, Fine Weight	
  before_save(frm) {
	    total_net_weight(frm);
	    fine_weight(frm);
	    gross_weight(frm);
	},

////Estimate Order
  custom_tokarigar(frm){
    if(frm.doc.custom_tokarigar==1){
        frm.set_df_property("custom_karigar_order_","hidden",0);
        frm.set_df_property("custom_karigar_order_","reqd",1);
    }
    else{
        frm.set_df_property("custom_karigar_order_","hidden",1);
        frm.set_df_property("custom_karigar_order_","reqd",0);
    }
  },

  refresh(frm){
    if(frm.doc.custom_tokarigar==1){
        frm.set_df_property("custom_karigar_order_","hidden",0);
        frm.set_df_property("custom_karigar_order_","reqd",1);
    }
    else{
        frm.set_df_property("custom_karigar_order_","hidden",1);
        frm.set_df_property("custom_karigar_order_","reqd",0);
    }
     
  },

  custom_karigar_order_(frm){
    //   console.log("HEllo");
    //   console.log(frm.doc.custom_karigar_order_);
       var karigar=frappe.db.get_value("Purchase Order",frm.doc.custom_karigar_order_,"supplier",
       function(response) {
                if (response && response.supplier) {
                    var supplier = response.supplier;
                    frappe.model.set_value(frm.doctype, frm.docname, "customer", supplier);
                    
                }
            });

   },

   onload: function(frm) {
    if(frm.doc.__islocal){
     if (frm.doc.custom_karigar_order_) {
         frm.set_value("custom_tokarigar", 1);

         frappe.call({
             method: 'frappe.client.get',
             args: {
                 doctype: 'Purchase Order',
                 name: frm.doc.custom_karigar_order_
             },
             callback: function(response) {
                 var karigar_order = response.message;
                 if (karigar_order && karigar_order.items) {
                     karigar_order.items.forEach(function(item) {
                          frm.clear_table("items");
                         // Add the item to the Sales Order's items table
                         var sales_order_item = frm.add_child("items");
                         // Set the item details
                         sales_order_item.item_code = "Gold 999";
                         sales_order_item.item_name='Raw Material';
                         sales_order_item.uom='Gram';
                         // sales_order_item.qty = item.qty;
                         // Set other item details as needed
                     });

                     // Refresh the Sales Order's items table
                     frm.refresh_field("items");
                 }
             }
         });
     }
    }
   },
//// Sales Order from Sales Person Issue
   custom_sales_person: function(frm) {
    const salesPerson = frm.doc.custom_sales_person;
    
    frm.set_query('custom_sales_person_issue', () => {
        return {
            filters: {
                'sales_person': salesPerson,
                'returned': 0,
            }
        };
    });
    // clearing sales_person_issue when sales_person is changed
    frm.set_value('custom_sales_person_issue', '');
  },

  custom_sales_person_issue: function(frm) {
        
    if (frm.doc.custom_sales_person_issue) {
        // Fetch the last active 'Daily Rate Master'
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Daily Rate Master',
                filters: {'active': 1},
                fields: ['name', 'rate_per_gram'],
                order_by: 'creation desc',
                limit_page_length: 1
            },
            callback: function(response) {
                var lastActiveRate = response.message[0].rate_per_gram;
                console.log('Last active rate',lastActiveRate);

                // Fetch the 'Sales Person Issue' items
                frappe.call({
                    method: 'frappe.client.get',
                    args: {
                        doctype: 'Sales Person Issue',
                        name: frm.doc.custom_sales_person_issue
                    },
                    callback: function(r) {
                        var spi_items = r.message.items;
                        console.log('spi items',spi_items);
                        
                      
                        frm.clear_table('items');

                        $.each(spi_items, function(i, item) {
                            // console.log(item);
                            frm.add_child('items', {
                                'item_code': item.item_code,
                                'item_name': item.item_code,
                                'qty': item.gross_weight_gram,
                                'custom_net_weight': item.weightgramct,
                                'uom': item.uom,
                                'rate': lastActiveRate,
                                'amount': lastActiveRate * item.gross_weight_gram,
                                'custom_purity': item.purity,
                                'custom_pcs': item.pcs,
                                'custom_quantity': item.quantity,
                                'custom_labour_touch': item.labour_touch,
                                'custom_labour_grams': item.labour_grams,
                                'custom_bch_no' : item.batch_no,
                            });
                        });
                        frm.set_value('set_warehouse','Sales Person Issue - SK');
                        frm.refresh_field('items');
                    }
                });
            }
        });
     }
    },


////Parent Wise Touch
    custom_labour_touch: function(frm, cdt, cdn) {
	    let child_doc = locals[cdt][cdn];
		for(var item of frm.doc.items) {
		    if (item.item_group == child_doc.item_group) {
		        item.custom_labour_touch = child_doc.custom_labour_touch;
		    }
		}
		frm.refresh_field("items");
	},

///Search with Packet Number in Estimate Order
  custom_packet_number_: function(frm) {
    if (frm.doc.custom_packet_number_) {
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Packet Master",
                name: frm.doc.custom_packet_number_
            },
            callback: function(r) {
                if (r.message && r.message.items) {
                    // console.log("Fetched items:", r.message.items);

                    let index = 0;

                    function setNextQR() {
                        if (index < r.message.items.length) {
                            let qr_value = r.message.items[index].custom_qr_input;

                            frm.set_value("custom_qr_scan", qr_value);
                            index++;

                            // Wait for a short delay before setting the next value
                            setTimeout(setNextQR, 500); // Adjust timing as needed
                        }
                    }

                    setNextQR();
                    frm.set_value('custom_packet_number_', '');
                }
            }
        });
    }
   },

 /// Fetch from Stock Entry
 
 custom_stock_entry: function(frm) {
  if (!frm.doc.custom_stock_entry) {
      frappe.msgprint(__('Please select a Stock Entry first.'));
      return;
  }

  frappe.dom.freeze(__('Processing data, please wait...')); // Show freeze popup

  frappe.call({
      method: 'frappe.client.get',
      args: {
          doctype: 'Stock Entry',
          name: frm.doc.custom_stock_entry
      },
      callback: function(response) {
          if (response.message) {
              let stock_entry = response.message;
              frm.clear_table('items');

              let promises = stock_entry.items.map(row => {
                  return frappe.db.get_value('Purity Master', row.custom_purity, 'purity_percentage')
                      .then(purity_response => {
                          let purity_percentage = purity_response.message ? parseFloat(purity_response.message.purity_percentage) || 0 : 0;
                          purity_percentage = (purity_percentage === 99.999) ? 100.0 : purity_percentage;

                          return frappe.db.get_value('Daily Rate Master', { 'active': 1 }, 'rate_per_gram')
                              .then(rate_response => {
                                  let rate_per_gram = rate_response.message ? parseFloat(rate_response.message.rate_per_gram) || 0 : 0;
                                  let rate = rate_per_gram * (purity_percentage / 100);

                                  let child = frm.add_child('items', {
                                      'custom_packet_number_': row.custom_packet_number,
                                      'item_code': row.item_code,
                                      'custom_external_item_code': row.custom_external_item_code,
                                      'item_name': row.item_name,
                                      'qty': row.qty,
                                      'custom_net_weight': row.custom_net_weight || 0,
                                      'uom': row.uom || 'Gram',
                                      'rate': rate,
                                      'amount': row.qty * rate,
                                      'custom_pcs': row.custom_pcs || 0,
                                      'custom_purity': row.custom_purity || '',
                                      'custom_bch_no': row.batch_no || '',
                                      'warehouse': row.t_warehouse
                                  });

                                  return child;
                              });
                      });
              });

              Promise.all(promises).then(() => {
                  frm.refresh_field('items');
                  frappe.dom.unfreeze(); // Remove freeze popup
                  frappe.msgprint(__('Data processing completed successfully!'));
              }).catch(err => {
                  frappe.dom.unfreeze(); // Ensure freeze popup is removed even in case of error
                  frappe.msgprint(__('An error occurred while processing data.'));
                  console.error(err);
              });
          }
      }
   });
 },
//// QR scan in Sales Order 
 custom_qr_scan: function(frm) {
  console.log('QR Scanned');

  // Check if qr_scan field has value
  if (frm.doc.custom_qr_scan) {
      var qr_data = frm.doc.custom_qr_scan.split('||');
      console.log('QR Data:', qr_data);

      if (qr_data.length >= 8) {
          var packet_no = qr_data[0].trim();
          var gross_weight = parseFloat(qr_data[2].trim());
          var net_weight = parseFloat(qr_data[3].trim());
          var pcs = parseInt(qr_data[4].trim());
          var purity = qr_data[5].trim();
          var batch_no = qr_data[7].trim();

          // Fetch the item code from the Batch
          frappe.db.get_value('Batch', batch_no, 'item')
              .then(response => {
                  console.log('Batch Response:', response);

                  if (!response.message || !response.message.item) {
                      frappe.throw(__('Item not found for batch number {0}', [batch_no]));
                      frm.set_value('custom_qr_scan', null); // Clear qr_scan field after error
                      return;
                  }

                  var item_code = response.message.item;

                  // Fetch the purity percentage from 'Purity Master'
                  frappe.db.get_value('Purity Master', purity, 'purity_percentage')
                      .then(response => {
                          console.log('Purity Percentage Response:', response);
                          var purity_percentage = response.message ? response.message.purity_percentage : null;

                          if (!purity_percentage) {
                              frappe.throw(__('Purity percentage not found for {0}', [purity]));
                              frm.set_value('custom_qr_scan', null); // Clear qr_scan field after purity not found
                              return;
                          }

                          // Adjusting purity percentage
                          if (purity_percentage === "99.999") {
                              purity_percentage = 100.0;
                          }

                          // Fetch rate from 'Daily Rate Master'
                          frappe.db.get_value('Daily Rate Master', { 'active': 1 }, 'rate_per_gram')
                              .then(response => {
                                  console.log('Daily Rate Response:', response);
                                  var ratePerGram = response.message ? response.message.rate_per_gram : null;

                                  if (!ratePerGram) {
                                      frappe.throw(__('Rate per gram not found in Daily Rate Master.'));
                                      frm.set_value('custom_qr_scan', null); // Clear qr_scan field after error
                                      return;
                                  }

                                  // Fetch custom external code from Item
                                  frappe.db.get_value('Item', item_code, 'custom_external_code')
                                      .then(response => {
                                          console.log('Custom External Code Response:', response);
                                          var external_code = response.message ? response.message.custom_external_code : null;

                                          // Fetch the Serial and Batch Bundle
                                          frappe.call({
                                              method: 'frappe.client.get_list',
                                              args: {
                                                  doctype: 'Serial and Batch Entry',
                                                  filters: { 'batch_no': batch_no },
                                                  fields: ['parent'],
                                                  order_by:'creation desc',
                                                  parent: 'Serial and Batch Bundle'
                                              },
                                              callback: function(response) {
                                                  if (response.message && response.message.length > 0) {
                                                      var serial_batch_bundle = response.message[0].parent;
                                                      console.log(response.message);

                                                      //  Fetch the warehouse from Stock Ledger Entry
                                                      frappe.db.get_value('Stock Ledger Entry', { 'serial_and_batch_bundle': serial_batch_bundle }, 'warehouse')
                                                          .then(response => {
                                                              if (response.message) {
                                                                  var warehouse = response.message.warehouse;

                                                                  // Check if the first row is empty and remove it
                                                                  if (frm.doc.items && frm.doc.items[0] && !frm.doc.items[0].item_code) {
                                                                      frm.doc.items = [];
                                                                  }

                                                                  // Populating Child table fields
                                                                  var child = frm.add_child('items', {
                                                                      'custom_packet_number_': packet_no,
                                                                      'item_code': item_code,
                                                                      'custom_external_item_code': external_code,
                                                                      'item_name': item_code,
                                                                      'qty': net_weight,
                                                                      'custom_net_weight': gross_weight,
                                                                      'uom': 'Gram',
                                                                      'rate': ratePerGram,
                                                                      'amount': net_weight * ratePerGram * (purity_percentage / 100),
                                                                      'custom_pcs': pcs,
                                                                      'custom_purity': purity,
                                                                      'custom_bch_no': batch_no,
                                                                      'warehouse': warehouse // Assign warehouse from Stock Ledger Entry
                                                                  });

                                                                  // frm.set_value('set_warehouse', warehouse); // Set warehouse in the main form
                                                                  frm.refresh_field('items');
                                                              }
                                                          })
                                                          .catch(error => {
                                                              console.error('Error fetching warehouse:', error);
                                                              frappe.throw(__('Error fetching warehouse. Please try again.'));
                                                              frm.set_value('custom_qr_scan', null); // Clear qr_scan field after error
                                                          });
                                                  } else {
                                                      console.error('Serial and Batch Bundle not found for batch:', batch_no);
                                                      frappe.throw(__('Serial and Batch Bundle not found for batch {0}.', [batch_no]));
                                                      frm.set_value('custom_qr_scan', null); // Clear qr_scan field after error
                                                  }
                                              }
                                          });
                                      })
                                      .catch(error => {
                                          console.error('Error fetching custom external code:', error);
                                          frappe.throw(__('Error fetching custom external code. Please try again.'));
                                          frm.set_value('custom_qr_scan', null); // Clear qr_scan field after error
                                      });
                              })
                              .catch(error => {
                                  console.error('Error fetching rate from Daily Rate Master:', error);
                                  frappe.throw(__('Error fetching rate from Daily Rate Master. Please try again.'));
                                  frm.set_value('custom_qr_scan', null); // Clear qr_scan field after error
                              });
                      })
                      .catch(error => {
                          console.error('Error fetching purity percentage:', error);
                          frappe.throw(__('Error fetching purity percentage. Please try again.'));
                          frm.set_value('custom_qr_scan', null); // Clear qr_scan field after error
                      });
              })
              .catch(error => {
                  console.error('Error fetching item from Batch:', error);
                  frappe.throw(__('Error fetching item from Batch. Please try again.'));
                  frm.set_value('custom_qr_scan', null); // Clear qr_scan field after error
              });
      } else {
          // Handle error or unexpected format
          frappe.msgprint(__('QR code data is not in the expected format.'));
          frm.set_value('custom_qr_scan', null); // Clear qr_scan field after wrong format
      }
  }
  frm.set_value('custom_qr_scan', null);
},
});

frappe.ui.form.on('Sales Order Item', {
    items_remove: function(frm, cdt, cdn) {
	    total_net_weight(frm);
	    fine_weight(frm);
	},
	
	qty: function(frm, cdt, cdn) {
	    total_net_weight(frm);
	    fine_weight(frm);	    
	},
	
	custom_net_weight: function(frm, cdt, cdn) {
	    total_net_weight(frm);
	    fine_weight(frm);
	}, 
	
	custom_purity: function(frm, cdt, cdn) {
	    total_net_weight(frm);
	    fine_weight(frm);	    
	},
  custom_refund_ledger : function(frm,cdt,cdn){
    var child = locals[cdt][cdn];
    var gross_final= 0;
    
    if(child.custom_refund_ledger && child.qty){
        gross_final = child.qty + child.custom_refund_ledger;
        frappe.model.set_value(cdt,cdn,'qty',gross_final);
    }
},  
});

function total_net_weight(frm){
    var total = 0;
    for (const item of frm.doc.items){
        total += item.custom_net_weight;
    }
    frappe.msgprint();
    var total_quantity=frm.doc.items.length;
    frm.set_value('custom_total_quantity_pcs',total_quantity);
    frm.set_value('custom_total_net_weighttt', total);
}

function fine_weight(frm) {
    var fine_weight = 0;
    for (const item of frm.doc.items){
        fine_weight += (item.qty*item.custom_purity_percentage/100);
    }
    frm.set_value('custom_fine_weight', fine_weight);
 
}
function gross_weight(frm){
    var gross_weight = 0;
    for (const item of frm.doc.items){
        gross_weight += item.qty;
    }
    console.log(gross_weight);
    frm.set_value('custom_total_gross_weight_grams', gross_weight);
}
    
