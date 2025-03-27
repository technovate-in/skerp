frappe.ui.form.on('QR Information', {
  refresh: function(frm) {
    frm.disable_save();  
  },
  
  sales_person_issue: function(frm) {
      if (frm.doc.sales_person_issue != null && frm.doc.estimate_order == null) {
          frm.set_value('status', "Issued");
      }
  },
  
  estimate_order: function(frm) {
      if (frm.doc.estimate_order != null) {
          frm.set_value('status', "Sold");
      }
  },
  
  qr_scan: function(frm) {
      if (frm.doc.qr_scan) {
          frm.set_value('item', null);
          frm.set_value('gross_weight', null);
          frm.set_value('net_weight', null);
          frm.set_value('uom', null);
          frm.set_value('rate', null);
          frm.set_value('amount', null);
          frm.set_value('pcs', null);
          frm.set_value('purity', null);
          frm.set_value('packet', null);
          frm.set_value('batch_no', null);
          frm.set_value('current_warehouse', null);
          frm.set_value('status', null);
          frm.set_value('sales_person_issue', null);
          frm.set_value('estimate_order', null);
          frm.set_value('issued_to', null);
          frm.set_value('sold_on', null);
          frm.set_value('customer', null);
          
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
                      return frappe.db.get_value('Daily Rate Master', {'active': 1}, 'rate_per_gram');
                  })
                  .then(response => {
                      if (response && response.message) {
                          var rate_per_gram = response.message.rate_per_gram;

                          // Fetch purity percentage from 'Purity Master'
                          return frappe.db.get_value('Purity Master', purity, 'purity_percentage')
                              .then(response => {
                                  if (response && response.message) {
                                      var purity_percentage = response.message.purity_percentage;
                                      
                                      // Set the form values
                                      frm.set_value('item', item_code);
                                      frm.set_value('gross_weight', gross_weight);
                                      frm.set_value('net_weight', net_weight);
                                      frm.set_value('uom', 'Gram');
                                      frm.set_value('rate', rate_per_gram * (purity_percentage / 100));
                                      frm.set_value('amount', net_weight * rate_per_gram * (purity_percentage / 100));
                                      frm.set_value('pcs', pcs);
                                      frm.set_value('purity', purity);
                                      frm.set_value('packet', packet_no);
                                      frm.set_value('batch_no', batch_no);
                                      
                                      frappe.call({
                                          method: 'erpnext.stock.doctype.batch.batch.get_batch_qty',
                                          args: {
                                              'batch_no': batch_no,
                                              'item_code': item_code
                                          },
                                          callback: function(r) {
                                              console.log(r);
                                              if (!r.exc) {
                                                  for(const info of r.message){
                                                      // console.log(info.qty)
                                                      // console.log(net_weight)
                                                      if(info.qty == net_weight){
                                                          // console.log('info == net')
                                                          frm.set_value('current_warehouse', info.warehouse);
                                                      }
                                                  }
                                              }
                                          }
                                      });
                                      
                                      frappe.call({
                                          method: 'get_spi_from_batch',
                                          args: {
                                              'batch_no': batch_no,
                                          },
                                          callback: function(r) {
                                              console.log(r);
                                              if (!r.exc) {
                                                  console.log(r);
                                                  for(const info of r.message){
                                                      frm.set_value('sales_person_issue', info.parent);
                                                  }
                                              }
                                          }
                                      });
                                      
                                      frappe.call({
                                          method: 'get_sales_order_from_batch',
                                          args: {
                                              'batch_no': batch_no,
                                          },
                                          callback: function(r) {
                                              console.log(r);
                                              if (!r.exc) {
                                                  console.log(r);
                                                  for(const info of r.message){
                                                      frm.set_value('estimate_order', info.parent);
                                                  }
                                              }
                                          }
                                      });
                                  }
                              });
                      }
                  })
                  .catch(error => {
                      frappe.throw(__('Error processing QR scan: {0}', [error.message]));
                      frm.set_value('qr_scan', null); // Clearing qr_scan field after error
                  });
              
                  }}); // closing bracket for batch get_value
              
              frm.set_value('qr_scan', null); // Clearing qr_scan field after successful scan
          } else {
              frappe.throw(__('QR code data is not in the expected format.'));
              frm.set_value('qr_scan', null); // Clearing qr_scan field after wrong format
          }
      }
  }
});
