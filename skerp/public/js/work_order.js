frappe.ui.form.on('Work Order', {
  refresh(frm) {
      // your code here
  },

/// Work Order Non Stock Items
  bom_no: function(frm) {
    if (frm.doc.bom_no) {
        frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'BOM',
                name: frm.doc.bom_no
            },
            callback: function(r) {
                if (r.message) {
                    let bom = r.message;
                    
                    // Clear existing items
                    frm.clear_table('custom_non_stock_item_in_wo');
                    
                    // Filter and add items from BOM
                    let promises = bom.items.map(item => {
                        return new Promise((resolve) => {
                            frappe.db.get_value('Item', item.item_code, 'is_stock_item', (r) => {
                                if (r && r.is_stock_item === 0) {
                                    // Check if item already exists in the table
                                    let existingItem = frm.doc.custom_non_stock_item_in_wo.find(
                                        row => row.item === item.item_code
                                    );
                                    
                                    if (existingItem) {
                                        // If item exists, update the net_weight
                                        existingItem.net_weight += item.qty;
                                        existingItem.rate = item.rate
                                    } else {
                                        // If item doesn't exist, add a new row
                                        let row = frm.add_child('custom_non_stock_item_in_wo');
                                        row.item = item.item_code;
                                        row.net_weight = item.qty;
                                        row.rate = item.rate;
                                    }
                                }
                                resolve();
                            });
                        });
                    });
                    
                    Promise.all(promises).then(() => {
                        frm.refresh_field('custom_non_stock_item_in_wo');
                    });
                }
            }
        });
    }
},


/// Fetch From Packet
custom_jadtar_selection: function(frm) {
  frm.set_value('custom_packet', '')
},
//// Fetch From Packet
custom_packet: async function(frm) {
  if (frm.doc.custom_packet) {
      
      // First, fetch the last active 'Daily Rate Master'
      // let response = await frappe.call({
      //     method: 'frappe.client.get_list',
      //     args: {
      //         doctype: 'Daily Rate Master',
      //         filters: {'active': 1},
      //         fields: ['name', 'rate_per_gram'],
      //         order_by: 'creation desc',
      //         limit_page_length: 1
      //     }
      // });

      // var lastActiveRate = response.message[0].rate_per_gram;

      // Then, fetch the 'Packet Master' items
      let packet_doc = await frappe.db.get_doc('Packet Master', frm.doc.custom_packet);
      let item = packet_doc.items[0];
      
      await frm.set_value('production_item', item.item_code);
      let bom = await frappe.db.get_list('BOM', {
      filters: {
          item: item.item_code,
          docstatus: 1,
          custom_jadtar_process: frm.doc.custom_jadtar_selection,
          is_active: 1
      },
      fields: ['name'],
      order_by: 'creation desc', // or 'modified desc' if you want to sort by the last modified time
      limit: 1
      });
      console.log(bom);
      if((typeof bom === 'undefined' || bom.length <= 0)){
          frappe.throw("BOM For <strong>"+  item.item_code + "</strong> Jadtar Process <strong>" + frm.doc.custom_jadtar_selection + "</strong> not found");
          frm.set_value('bom_no', '');
      }
      await frm.set_value('bom_no', bom[0].name);
      console.log(frm.doc.bom_no);
      let qty = await frappe.db.get_value('BOM', frm.doc.bom_no, 'quantity');
      console.log(qty);
      await frm.set_value('qty', qty.message.quantity);
      
      if(!(frm.doc.required_items.some((req_item) => req_item.item_code == item.item_code))){
          console.log('Item Added');
          let row = frm.add_child('required_items', {
              item_code: item.item_code,
              custom_purity: item.custom_item_purity,
              required_qty: item.net_weight,
              custom_gross_weight: item.gross_weight,
              custom_bch_no: item.batch_no,
              amount: item.amount,
              rate: item.rate
          });
          
          let itemDetails = await frappe.call({
              method: "erpnext.stock.doctype.item.item.get_item_details",
              args: {
                  item_code: row.item_code,
                  company: frm.doc.company,
              }
          });
          // console.log(itemDetails);

          if (itemDetails.message) {
              frappe.model.set_value(row.doctype, row.name, {
                  required_qty: row.required_qty || 1,
                  item_name: itemDetails.message.item_name,
                  description: itemDetails.message.description,
                  source_warehouse: itemDetails.message.default_warehouse,
                  allow_alternative_item: itemDetails.message.allow_alternative_item,
                  include_item_in_manufacturing: itemDetails.message.include_item_in_manufacturing,
              });
          }
          
          frm.refresh_field('required_items');
      }
  }
}
});

frappe.ui.form.on('Work Order Item', {

/// Work Order Rate Set
  custom_purity: function(frm, cdt, cdn) {
      let item = locals[cdt][cdn];

      // Get purity percentage from Purity Master
      frappe.db.get_value('Purity Master', item.custom_purity, 'purity_percentage')
          .then(response => {
              let purity_percentage = response.message.purity_percentage;

              if (purity_percentage) {
                  if (purity_percentage == "99.999") {
                      purity_percentage = 100.0;
                  }

                  // Get rate_per_gram from Daily Rate Master
                  frappe.db.get_value('Daily Rate Master', { 'active': 1 }, 'rate_per_gram')
                      .then(rate_response => {
                          let rate_per_gram = rate_response.message.rate_per_gram;

                          if (rate_per_gram) {
                              let rate = rate_per_gram * (purity_percentage / 100);
                              frappe.model.set_value(cdt, cdn, "rate", rate);
                          }
                      })
                      .catch(error => {
                          console.error("Error getting rate_per_gram:", error);
                      });
              }
          })
          .catch(error => {
              console.error("Error getting purity_percentage:", error);
          });
  }
});
