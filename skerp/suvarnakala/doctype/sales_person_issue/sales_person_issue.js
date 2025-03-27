frappe.ui.form.on("Sales Person Issue", {
///// Sales Person Issue 
  before_save: function(frm){
      frm.set_value('issued_by',frappe.user.full_name());
  },
  // before_save: function(frm) {
  //     // Initialize total_weights when the form is refreshed
  //     // calculate_total_weights(frm);
  //     // calculate_total_amount(frm);
  //     // calculate_rounded_amount(frm);
  // },
  sales_person: function(frm) {
      // Set the value of 'received_by' same as 'sales_person'
      frm.set_value('received_by', frm.doc.sales_person);
      
  },


  refresh(frm) {

  /// SP Issue Table Pagination
		frm.get_field('packet_master').grid.grid_pagination.page_length = 4;
    frm.get_field('packet_master').grid.reset_grid();
    

  //// Sales Person Issue Packets Filter  
    frm.set_query('packet_master', 'packet_master', () => {
      return {
          filters: {
           "issued":0
          }
      };  
    });

//// Sales Person Issue from Packet Master
    frm.updateItems = function() {
      // Fetch the last active 'Daily Rate Master'
      frappe.call({
          method: 'frappe.client.get_list',
          args: {
              doctype: 'Daily Rate Master',
              filters: { 'active': 1 },
              fields: ['name', 'rate_per_gram'],
              order_by: 'creation desc',
              limit_page_length: 1
          },
          callback: function(response) {
              if (response.message && response.message.length > 0) {
                  var lastActiveRate = response.message[0].rate_per_gram;

                  // Clear the 'items' table
                  frm.clear_table('items');

                  // Process each packet master
                  frm.doc.packet_master.forEach(function(packet) {
                      frappe.call({
                          method: 'frappe.client.get',
                          args: {
                              doctype: 'Packet Master',
                              name: packet.packet_master
                          },
                          callback: function(r) {
                              if (r.message) {
                                  var packet_master_items = r.message.items;

                                  // Process each item in the packet master
                                  packet_master_items.forEach(function(item) {
                                      // Fetch the purity percentage
                                      frappe.db.get_value('Purity Master', item.purity, 'purity_percentage')
                                          .then(response => {
                                              if (response.message) {
                                                  let purity_percentage = response.message.purity_percentage;

                                                  // Adjust purity percentage if it's 99.999
                                                  if (purity_percentage == "99.999") {
                                                      purity_percentage = 100.0;
                                                  }

                                                  // Fetch the Serial and Batch Bundle
                                                  frappe.call({
                                                      method: 'frappe.client.get_value',
                                                      args: {
                                                          doctype: 'Serial and Batch Entry',
                                                          filters: { 'batch_no': item.batch_no },
                                                          fieldname: 'parent',
                                                          parent: 'Serial and Batch Bundle'
                                                      },
                                                      callback: function(response) {
                                                          if (response.message && response.message.parent) {
                                                              var serial_batch_bundle = response.message.parent;

                                                              // Fetch the warehouse from Stock Ledger Entry
                                                              frappe.db.get_value('Stock Ledger Entry', { 'serial_and_batch_bundle': serial_batch_bundle }, 'warehouse')
                                                                  .then(response => {
                                                                      if (response.message) {
                                                                          var warehouse = response.message.warehouse;

                                                                          // Fetch the external code from the Item
                                                                          frappe.db.get_value('Item', item.item_code, 'custom_external_code')
                                                                              .then(response => {
                                                                                  if (response.message) {
                                                                                      var external_code = response.message.custom_external_code;

                                                                                      // Add fetched packet_master_items to the 'items' table
                                                                                      frm.add_child('items', {
                                                                                          'item_code': item.item_code,
                                                                                          'external_item_code': external_code,
                                                                                          'gross_weight_gram': item.gross_weight,
                                                                                          'weightgramct': item.net_weight,
                                                                                          'uom': item.uom,
                                                                                          'rate': lastActiveRate * (purity_percentage / 100),
                                                                                          'amount': (lastActiveRate * (purity_percentage / 100)) * item.net_weight,
                                                                                          'purity': item.purity,
                                                                                          'pcs': item.pcs,
                                                                                          'quantity': item.quantity,
                                                                                          'labour_touch': item.labour_touch,
                                                                                          'labour_grams': item.labour_grams,
                                                                                          'linked_packet': packet.packet_master, // Link back to the packet master
                                                                                          'batch_no': item.batch_no,
                                                                                          'purity_percentage': purity_percentage, // Add purity percentage to child table
                                                                                          'warehouse': warehouse // Add warehouse to child table
                                                                                      });

                                                                                      frm.refresh_field('items');
                                                                                  }
                                                                              })
                                                                              .catch(error => {
                                                                                  console.error('Error fetching external code:', error);
                                                                              });
                                                                      }
                                                                  })
                                                                  .catch(error => {
                                                                      console.error('Error fetching warehouse:', error);
                                                                  });
                                                          } else {
                                                              console.error('Serial and Batch Bundle not found for batch:', item.batch_no);
                                                          }
                                                      }
                                                  });
                                              } else {
                                                  console.error('Purity percentage not found for purity:', item.purity);
                                              }
                                          })
                                          .catch(error => {
                                              console.error('Error fetching purity percentage:', error);
                                          });
                                  });
                              } else {
                                  console.error('Packet Master not found:', packet.packet_master);
                              }
                          }
                      });
                  });
              } else {
                  console.error('No active Daily Rate Master found.');
              }
          }
      });
  };

  // Call updateItems when the form is refreshed
    frm.updateItems();
    }, 

/// QR Scan for Sales Person Issue
  qr_scan: function(frm) {
    if (frm.doc.qr_scan) {
        var qr_data = frm.doc.qr_scan.split('||');
        
        if (qr_data.length >= 8) {
            var packet_no = qr_data[0].trim();
            var external_item_code = qr_data[1].trim();
            var gross_weight = parseFloat(qr_data[2].trim());
            var net_weight = parseFloat(qr_data[3].trim());
            var pcs = parseInt(qr_data[4].trim());
            var purity = qr_data[5].trim();
            var batch_no = qr_data[7].trim();

            // Fetch the item code from the Batch
            frappe.db.get_value('Batch', batch_no, 'item')
                .then(response => {
                    if (response.message) {
                        var item_code = response.message.item;

                        // Fetch the Packet document
                        frappe.db.get_doc('Packet Master', packet_no)
                            .then(packet_doc => {
                                if (!packet_doc) {
                                    frappe.throw(__('Packet {0} does not exist.', [packet_no]));
                                    frm.set_value('qr_scan', null); // Clearing qr_scan field after packet not found
                                    return;
                                }

                                // Check if the item with the same item_code and batch_no is already in the Packet's child table
                                var item_exists_in_packet = packet_doc.items.some(item => item.item_code === item_code && item.batch_no === batch_no);

                                if (!item_exists_in_packet) {
                                    frappe.throw(__('Item with code {0} and batch number {1} does not exist in the packet {2}.', [item_code, batch_no, packet_no]));
                                    frm.set_value('qr_scan', null); // Clearing qr_scan field after item not found
                                    return;
                                }

                                // Fetch rate from 'Daily Rate Master'
                                frappe.db.get_value('Daily Rate Master', {'active': 1}, 'rate_per_gram')
                                    .then(response => {
                                        if (response.message) {
                                            var ratePerGram = response.message.rate_per_gram;

                                            // Fetch the Serial and Batch Bundle
                                            frappe.call({
                                                method: 'frappe.client.get_value',
                                                args: {
                                                    doctype: 'Serial and Batch Entry',
                                                    filters: { 'batch_no': batch_no },
                                                    fieldname: 'parent',
                                                    parent: 'Serial and Batch Bundle'
                                                },
                                                callback: function(response) {
                                                    if (!response.message || !response.message.parent) {
                                                        frappe.throw(__('Serial and Batch Bundle not found for batch {0}.', [batch_no]));
                                                        frm.set_value('qr_scan', null); // Clearing qr_scan field after error
                                                        return;
                                                    }

                                                    var serial_batch_bundle = response.message.parent;

                                                    // Fetch the warehouse from Stock Ledger Entry
                                                    frappe.db.get_value('Stock Ledger Entry', { 'serial_and_batch_bundle': serial_batch_bundle }, 'warehouse')
                                                        .then(response => {
                                                            if (response.message) {
                                                                var warehouse = response.message.warehouse;

                                                                // Fetch the external code from the Item
                                                                frappe.db.get_value('Item', item_code, 'custom_external_code')
                                                                    .then(response => {
                                                                        if (response.message) {
                                                                            var external_code = response.message.custom_external_code;

                                                                            // Populating Child table fields
                                                                            frm.add_child('items', {
                                                                                'item_code': item_code,
                                                                                'external_item_code': external_code,
                                                                                'gross_weight_gram': gross_weight,
                                                                                'weightgramct': net_weight,
                                                                                'uom': 'Gram',
                                                                                'rate': ratePerGram,
                                                                                'amount': gross_weight * ratePerGram,
                                                                                'pcs': pcs,
                                                                                'purity': purity,
                                                                                'linked_packet': packet_no,
                                                                                'batch_no': batch_no,
                                                                                'warehouse': warehouse // Adding warehouse to the child table
                                                                            });
                                                                            frm.refresh_field('items');

                                                                            // Check if the packet already exists in the packet_master table
                                                                            var packet_exists = frm.doc.packet_master.some(packet => packet.packet_master === packet_no);
                                                                            if (!packet_exists) {
                                                                                frm.add_child('packet_master', {
                                                                                    'packet_master': packet_no,
                                                                                });
                                                                                frm.refresh_field("packet_master");
                                                                            }

                                                                            // Clear the qr_scan field after successful processing
                                                                            frm.set_value('qr_scan', null);
                                                                        }
                                                                    })
                                                                    .catch(error => {
                                                                        frappe.throw(__('Error fetching external code: {0}', [error.message]));
                                                                        frm.set_value('qr_scan', null); // Clearing qr_scan field after error
                                                                    });
                                                            }
                                                        })
                                                        .catch(error => {
                                                            frappe.throw(__('Error fetching warehouse: {0}', [error.message]));
                                                            frm.set_value('qr_scan', null); // Clearing qr_scan field after error
                                                        });
                                                }
                                            });
                                        }
                                    })
                                    .catch(error => {
                                        frappe.throw(__('Error fetching rate: {0}', [error.message]));
                                        frm.set_value('qr_scan', null); // Clearing qr_scan field after error
                                    });
                            })
                            .catch(error => {
                                frappe.throw(__('Error fetching packet: {0}', [error.message]));
                                frm.set_value('qr_scan', null); // Clearing qr_scan field after error
                            });
                    }
                })
                .catch(error => {
                    frappe.throw(__('Error fetching item code: {0}', [error.message]));
                    frm.set_value('qr_scan', null); // Clearing qr_scan field after error
                });
        } else {
            frappe.throw(__('QR code data is not in the expected format.'));
            frm.set_value('qr_scan', null); // Clearing qr_scan field after wrong format
        }
    }
},
});

frappe.ui.form.on("Sales Person Issue Item", {
  weightgramct: function(frm, cdt, cdn) {
      var child = locals[cdt][cdn];
      frappe.db.get_value("Daily Rate Master",
          { "active": 1 },
          "rate_per_gram",
          function(response) {
              if (response && response.rate_per_gram) {
                  var ratePerGram = response.rate_per_gram;
                  var amount = ratePerGram * child.weightgramct;
                  frappe.model.set_value(cdt, cdn, "rate", ratePerGram);
                  frappe.model.set_value(cdt, cdn, "amount", amount);
              }
          }
      );
  
  // calculate_total_weights(frm);
  }, 
});

/// Sales Person Issue from Packet Master
frappe.ui.form.on('Sales Person Issue Packets', { // Multiple Issue Items
  refresh(frm) {
      // Your code here
  },
  packet_master: function(frm, cdt, cdn) {
      // Call updateItems when packet_master is updated
      frm.updateItems();
  },
  before_packet_master_remove: function(frm, cdt, cdn) {
      // Remove items linked to the removed packet master
      var removedPacketMaster = locals[cdt][cdn].packet_master;
      var itemsToRemove = frm.doc.items.filter(item => item.linked_packet === removedPacketMaster);

      itemsToRemove.forEach(function(item) {
          frappe.model.clear_doc(item.doctype, item.name);
      });

      frm.refresh_field('items');
  }
});

// function calculate_total_weights(frm) {
//     var total_weights = 0;
//     frm.doc.items.forEach(function(item) {
//         total_weights += flt(item.weightgramct) || 0;
//     });
  
//     frm.set_value('total_weights', total_weights);
// }
// function calculate_total_amount(frm) {
//     var total_amount = 0;
//     frm.doc.items.forEach(function(item) {
//         total_amount += flt(item.amount) || 0;
//     });
  
//     frm.set_value('total_amount', total_amount);
// }
// function calculate_rounded_amount(frm) {
//     var rounded_amount = Math.round(frm.doc.total_amount);
//     frm.set_value('rounded_amount', rounded_amount);
// }

