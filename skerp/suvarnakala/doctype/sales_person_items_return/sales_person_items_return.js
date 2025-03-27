frappe.ui.form.on('Sales Person Items Return', {
 
/// Sales Person Return Items 
  async onload(frm) {
      if(frm.is_new()){
      if (frm.doc.sales_person_issue_id) {
          try {
              // Fetch Sales Person Issue data
              let spiResponse = await frappe.call({
                  method: 'frappe.client.get',
                  args: {
                      doctype: 'Sales Person Issue',
                      name: frm.doc.sales_person_issue_id
                  }
              });

              if (spiResponse.message) {
                  console.log(frm.doc.sales_person_issue_id);
                  // Assign the packet_master data to packets_issued child table
                  spiResponse.message.packet_master.forEach(packet => {
                      let child = frm.add_child('packets_issued');
                      frappe.model.set_value(child.doctype, child.name, 'packet_master', packet.packet_master);
                      // Set other fields as needed
                  });
                  frm.refresh_field('packets_issued');
              }

              // Fetch related Sales Orders
              let soListResponse = await frappe.call({
                  method: 'frappe.client.get_list',
                  args: {
                      doctype: 'Sales Order',
                      filters: {
                          custom_sales_person_issue: frm.doc.sales_person_issue_id
                      },
                      fields: ['name']
                  }
              });

              console.log(soListResponse.message);

              if (soListResponse.message && soListResponse.message.length > 0) {
                  const salesOrderNames = soListResponse.message.map(so => so.name);
                  const salesOrderItems = [];

                  // Process each Sales Order
                  for (const name of salesOrderNames) {
                      const soResponse = await frappe.call({
                          method: 'frappe.client.get',
                          args: {
                              doctype: 'Sales Order',
                              name: name
                          }
                      });
                      salesOrderItems.push(...soResponse.message.items.map(item => ({
                          item_code: item.item_code,
                          qty: item.qty,
                          custom_bch_no:item.custom_bch_no
                      })));
                  }

                  // Process Sales Person Issue Items
                  const salesPersonIssueItems = spiResponse.message.items.map(item => ({
                      item_code: item.item_code,
                      gross_weight_gram: item.gross_weight_gram,
                      weightgramct: item.weightgramct,
                      uom: item.uom,
                      purity: item.purity,
                      pcs: item.pcs,
                      linked_packet: item.linked_packet,
                      rate: item.rate,
                      amount: item.amount,
                      batch:item.batch_no
                  }));

                  console.log('Sales Person Issue Items:', salesPersonIssueItems);

                  // Find items in Sales Person Issue that are not in Sales Orders
                  const itemsNotInSalesOrders = salesPersonIssueItems.filter(issueItem => {
                      return !salesOrderItems.some(orderItem =>
                          orderItem.item_code === issueItem.item_code &&
                          orderItem.qty === issueItem.gross_weight_gram &&
                          orderItem.custom_bch_no===issueItem.batch
                      );
                  });

                  console.log('Items not in Sales Orders:', itemsNotInSalesOrders);
                  console.log('Sales order items:', salesOrderItems);

                  frm.clear_table('items');
                  itemsNotInSalesOrders.forEach(item => {
                      let newRow = frm.add_child('items');
                      newRow.item_code = item.item_code;
                      newRow.gross_weight_gram = item.gross_weight_gram;
                      newRow.weightgramct = item.weightgramct;
                      newRow.uom = item.uom;
                      newRow.purity = item.purity;
                      newRow.pcs = item.pcs;
                      newRow.linked_packet = item.linked_packet;
                      newRow.rate = item.rate;
                      newRow.amount = item.amount;
                      newRow.batch_no=item.batch;
                  });
                  frm.refresh_field('items');
              } else {
                  // No Sales Orders found, bring items from Sales Person Issue
                  console.log('No Sales Orders found, bringing items from Sales Person Issue');
                  frm.clear_table('items');
                  spiResponse.message.items.forEach(item => {
                      let newRow = frm.add_child('items');
                      newRow.item_code = item.item_code;
                      newRow.gross_weight_gram = item.gross_weight_gram;
                      newRow.weightgramct = item.weightgramct;
                      newRow.uom = item.uom;
                      newRow.purity = item.purity;
                      newRow.pcs = item.pcs;
                      newRow.linked_packet = item.linked_packet;
                      newRow.rate = item.rate;
                      newRow.amount = item.amount;
                      newRow.batch_no = item.batch_no;
                  });
                  frm.refresh_field('items');
              }
          } catch (error) {
              console.error(error);
          }
      }
      }
  },

/// Sales Person Return Sort Items Table
  before_save: function(frm) {
    var sortedEntries = frm.doc.items.sort(function (a, b) {
        var itemA = a.item_code.split('-')[1];
        var itemB = b.item_code.split('-')[1];
        return itemA.localeCompare(itemB);
    });
    
    console.log(sortedEntries);
    console.log(frm.doc.items);
    frm.set_value('items', sortedEntries);
    frm.refresh_field('items');
},

//// SP Item Return Table Pagination
refresh(frm) {
  frm.get_field('packets_issued').grid.grid_pagination.page_length = 6;
      frm.get_field('packets_issued').grid.reset_grid();
      cur_frm.set_df_property("packets_issued", "read_only", 1);
      frm.get_field('packets_returned').grid.grid_pagination.page_length = 5;
      frm.get_field('packets_returned').grid.reset_grid();
      cur_frm.set_df_property("packets_returned", "read_only", 1);

      //// Direct Transfer Button Individual Packets
      frm.add_custom_button('Direct Transfer', () => {
        let dialog_data = [];
        for(const packet of frm.doc.packets_returned){
            dialog_data.push({packet: packet.packet_master});
        }
        let direct_transfer = new frappe.ui.Dialog({
            title: __("Direct Transfer"),
            fields: [
                {
                    fieldname: "sales_person",
                    fieldtype: "Link",
                    label: __("Sales Person"),
                    options: "Sales Person",
                    reqd: 1,
                    change: function() {
                        let sales_person = direct_transfer.get_value('sales_person');
                        let issue_packets = direct_transfer.fields_dict.issue_packets.grid.grid_rows;
                        issue_packets.forEach(row => {
                            row.doc.sales_person = sales_person;
                            row.refresh_field('sales_person');
                        });
                    }
                },
                {
                    fieldname: "issue_packets",
                    fieldtype: "Table",
                    label: __("Issue Packets"),
                    in_place_edit: true,
                    cannot_add_rows: true,
                    cannot_delete_rows: true,
                    data: dialog_data,
                    fields: [
                        {
                            fieldname: "packet",
                            label: __("Returned Packet"),
                            fieldtype: "Link",
                            options: "Packet Master",
                            in_list_view: 1,
                            read_only: 1,
                            reqd: 1,
                        },
                        {
                            fieldname: "sales_person",
                            label: __("Sales Person"),
                            fieldtype: "Link",
                            options: "Sales Person",
                            in_list_view: 1,
                            reqd: 1,
                        }
                    ],
                },
            ],
            size: 'large', // small, large, extra-large 
            primary_action_label: 'Transfer',
            primary_action(values) {
                for(const issue_packet of values.issue_packets){
                    if(issue_packet.sales_person == undefined){
                        frappe.throw("Enter a Sales Person for each Packet");
                    }
                }
                direct_transfer.hide();
                var salesman_packet_list = {};
                for(const {packet, idx, name, sales_person} of values.issue_packets){
                    console.log(packet, sales_person);
                    if(salesman_packet_list[sales_person] == undefined){
                        salesman_packet_list[sales_person] = [packet];
                    }
                    else{
                        salesman_packet_list[sales_person].push(packet);
                    }
                }
                console.log(salesman_packet_list);
                console.log(values);
                
                for(const [sales_person, packets] of Object.entries(salesman_packet_list)){
                    var packets_to_issue = []
                    for(const packet of packets){
                        packets_to_issue.push({packet_master: packet});
                    }
                    var items_to_issue = frm.doc.items.filter((item) => packets.includes(item.linked_packet));
                    // Insert a new Sales Person Issue
                    frappe.db.insert({
                        doctype: 'Sales Person Issue',
                        sales_person: sales_person,
                        received_by: sales_person,
                        packet_master: packets_to_issue,
                        items: items_to_issue,
                        issued_by: frappe.user.full_name()
                    }).then(doc => {
                        // Update the is_packet_transfered field in Sales Person Items Return
                        // frappe.db.set_value('Sales Person Items Return', frm.doc.name, 'is_packet_transfered', 1). -- To disable Direct Transfer once it's done
                        // .then(() => {
                            // Display success message
                            frappe.msgprint({
                                title: 'Success',
                                indicator: 'green',
                                message: 'Packets issued to ' + doc.sales_person + ' successfully'
                            });
                            frm.reload_doc(); // Reload the document to reflect the changes
                        // });
                    });
                }
            }
        });
        direct_transfer.show();
    });
},
/// QR Scan for Sales Person Return
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
          
          frappe.db.get_value('Batch',batch_no,'item')
              .then(response => {
                  if (response.message) {
                      var item_code = response.message.item;
          
          // Fetch the Packet document
          frappe.db.get_doc('Packet Master', packet_no)
              .then(packet_doc => {
                  if (!packet_doc) {
                      frappe.throw(__('Packet {0} does not exist.', [packet_no]));
                      frm.set_value('qr_scan', null); // Clear qr_scan field after packet not found
                      return;
                  }

                  // Check if the item with the same item_code and batch_no is already in the Packet's child table
                  var item_exists_in_packet = packet_doc.items.some(item => item.item_code === item_code && item.batch_no === batch_no);

                  if (!item_exists_in_packet) {
                      frappe.throw(__('Item with code {0} and batch number {1} does not exist in the packet {2}.', [item_code, batch_no, packet_no]));
                      frm.set_value('qr_scan', null); // Clear qr_scan field after item not found
                      return;
                  }

                  // Fetch the purity percentage from 'Purity Master'
                  frappe.db.get_value('Purity Master', purity, 'purity_percentage')
                      .then(response => {
                          var purity_percentage = response.message.purity_percentage;

                          if (!purity_percentage) {
                              frappe.throw(__('Purity percentage not found for {0}', [purity]));
                              frm.set_value('qr_scan', null); // Clear qr_scan field after purity not found
                              return;
                          }

                          // Fetch rate from 'Daily Rate Master'
                          frappe.db.get_value('Daily Rate Master', {'active': 1}, 'rate_per_gram')
                              .then(response => {
                                  var ratePerGram = response.message.rate_per_gram;

                                  if (ratePerGram) {
                                      frappe.db.get_value('Item', item_code, 'custom_external_code').then(response => {
                                          if (response.message) {
                                  
                                              var external_code = response.message.custom_external_code;
                                                                                          // Populate child table fields
                                              frm.add_child('items', {
                                                  'item_code': item_code,
                                                  'external_item_code': external_code,
                                                  'gross_weight_gram': gross_weight,
                                                  'weightgramct': net_weight,
                                                  'uom': 'Gram',
                                                  'rate': ratePerGram * (purity_percentage / 100),
                                                  'amount': net_weight * (ratePerGram * (purity_percentage / 100)),
                                                  'pcs': pcs,
                                                  'purity': purity,
                                                  'linked_packet': packet_no,
                                                  'batch_no': batch_no,
                                              });
                                              frm.refresh_field('items');
  
                                              var packet_exists = frm.doc.packets_issued.some(packet => packet.packet_master === packet_no);
                                              if (!packet_exists) {
                                                  frm.add_child('packets_issued', {
                                                      'packet_master': packet_no,
                                                  });
                                                  frm.refresh_field('packets_issued');
                                              }
  
                                              frm.set_value('qr_scan', null); // Clear qr_scan field after successful scan
                                          }
                                      });
                                  }
                              });
                      })
                      .catch(error => {
                          console.error('Error fetching purity percentage:', error);
                          frm.set_value('qr_scan', null); // Clear qr_scan field after error
                      });
              })
              .catch(error => {
                  console.error('Error fetching packet:', error);
                  frm.set_value('qr_scan', null); // Clear qr_scan field after error
              });
              
          }});
      } else {
          frappe.throw(__('QR code data is not in the expected format.'));
          frm.set_value('qr_scan', null); // Clear qr_scan field after wrong format
      }
  }
},
});
