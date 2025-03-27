frappe.ui.form.on('Stock Audit Reconciliation', {
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

              frappe.db.get_value('Batch', batch_no, 'item')
                  .then(response => {
                      if (response.message) {
                          var item_code = response.message.item;

                          // Check if the batch is in the current warehouse
                          frappe.call({
                              method: 'erpnext.stock.doctype.batch.batch.get_batch_qty',
                              args: {
                                  'batch_no': batch_no,
                                  'item_code': item_code
                              },
                              callback: function(r) {
                                  if (!r.exc) {
                                      let batch_in_warehouse = false;
                                      for (const info of r.message) {
                                          if (info.warehouse === frm.doc.warehouse) {
                                              batch_in_warehouse = true;

                                              // Add child table entry
                                              frm.add_child('items_scanned', {
                                                  'item_code': item_code,
                                                  'net_weight': net_weight,
                                                  'batch_no': batch_no,
                                              });
                                              frm.refresh_field('items_scanned');
                                              break;
                                          }
                                      }

                                      if (!batch_in_warehouse) {
                                          frappe.throw(__('Batch {0} is not present in the warehouse {1}.', [batch_no, frm.doc.warehouse]));
                                      }

                                      // Clear QR scan field
                                      frm.set_value('qr_scan', null);
                                  }
                              }
                          });
                      }
                  });
          } else {
              frappe.throw(__('QR code data is not in the expected format.'));
              frm.set_value('qr_scan', null); // Clear the QR scan field
          }
      }
  },
  refresh(frm) {
      // Your code here
  }
});