frappe.ui.form.on('Purchase Order', {
  supplier: function(frm) {
      // Check if supplier is set
      if (frm.doc.supplier) {
          // Fetch the 'gstin' field value from the Supplier document
          frappe.db.get_value('Supplier', frm.doc.supplier, 'gstin', (r) => {
              if (r && r.gstin) {
                  // If 'gstin' is present, you might want to do something here
                  console.log('Supplier GSTIN:', r.gstin);
                  frm.set_df_property('taxes_and_charges', 'read_only', 1);
                  frm.set_df_property('tax_category', 'read_only', 1);
              } else if (r.gstin==null) {
                  // If 'gstin' is not set, show an alert or take some action
                  frappe.msgprint(`The selected supplier ${frm.doc.supplier} does not have a GSTIN set.`);
                  frm.set_df_property('taxes_and_charges', 'read_only', 0);
                  frm.set_df_property('tax_category', 'read_only', 0);
              }
          });
      }
  },

///// Purchase Order  Item code filter based on supplier
  refresh: function(frm) {
		frm.set_query('item_code', 'items', () => {
		    
		    // Case 1 No supplier set
		    if(frm.doc.custom_supplier_code === undefined){
		        return { filters: {} }
		    }
		    
		    return {
                filters: {
                    name: ['like', '%'+frm.doc.custom_supplier_code+'%']
                }
            }
		})
	},

/// Estimated Weight and Total Net Weight  
  before_save(frm) {
		total_net_weight(frm);
	}
});


/// Estimated Weight and Total Net Weight

frappe.ui.form.on('Purchase Order Item', {
  items_remove: function(frm, cdt, cdn) {
      total_net_weight(frm);
  },
  
  item_code: function(frm, cdt, cdn) {
      var child = locals[cdt][cdn];
      frappe.db.get_value("Daily Rate Master", { "active": 1 }, "rate_per_gram", function(response) {
          if (response && response.rate_per_gram) {
              var ratePerGram = response.rate_per_gram;
              frappe.model.set_value(cdt, cdn, "rate", ratePerGram).then(() => {
                  // console.log('rate updated!')
                  
                  frm.refresh_field("items"); // Refresh the items table to reflect the updated rate
              });
          }
      });
      var current_row = locals[cdt][cdn];
      
      if (current_row.item_code) {
          frappe.call({
              method: 'frappe.client.get',
              args: {
                  doctype: 'Item',
                  name: current_row.item_code
              },
              callback: function(response) {
                  if (!response.exc && response.message) {
                      var item = response.message;
                      if (item.custom_design_weight_range && item.custom_design_weight_range.includes('-')) {
                          var range_split = item.custom_design_weight_range.split('-');
                          if (range_split.length === 2 && !isNaN(range_split[0]) && !isNaN(range_split[1])) {
                              var avg_weight = (parseFloat(range_split[0]) + parseFloat(range_split[1])) / 2;
                              console.log('Average weight for item', current_row.item_code, ':', avg_weight);
                              // Update the qty for the current row
                              frappe.model.set_value(cdt, cdn, 'qty', avg_weight);
                              // Setting 'qty' for the first time quantity * avg_weight 
                              // if(current_row.custom_quantity){
                              //     frappe.model.set_value(cdt, cdn, 'qty', current_row.custom_avg_weight_item * current_row.custom_quantity);
                              // }
                          } else {
                              frappe.msgprint(`Invalid weight range format for item ${current_row.item_code}.`);
                          }
                      } else {
                          frappe.msgprint(`No weight range set for item ${current_row.item_code}.`);
                      }
                  }
              }
          });
      }
  },
  
  qty: function(frm, cdt, cdn) {
      var child = locals[cdt][cdn];
      frappe.db.get_value("Daily Rate Master", { "active": 1 }, "rate_per_gram", function(response) {
          if (response && response.rate_per_gram) {
              var ratePerGram = response.rate_per_gram;
              frappe.model.set_value(cdt, cdn, "rate", ratePerGram).then(() => {
                  // console.log('rate updated!')
                  // frm.refresh_field("items"); // Refresh the items table to reflect the updated rate
              });
          }
      });
      
      total_net_weight(frm);
  },
  custom_quantity:function(frm,cdt,cdn){
      var child=locals[cdt][cdn];
      var updated_qty=child.qty*child.custom_quantity;
      console.log(updated_qty)
       frappe.model.set_value(cdt, cdn, "qty", updated_qty);
  },
  
//     custom_quantity: function(frm,cdt,cdn){
//         var current_row = locals[cdt][cdn];
//         if(current_row.custom_quantity){
//             frappe.model.set_value(cdt, cdn, 'qty', current_row.custom_avg_weight_item * current_row.custom_quantity);
//         }
//         else{
//             frappe.throw('Please Enter Quantity (>0)')
//         }
//     }
});

function total_net_weight(frm) {
  var total_net_weight = 0;
  var total_quantity = 0;
  for (const item of frm.doc.items){
      total_net_weight += item.qty;
      total_quantity += item.custom_quantity;
  }
  frm.set_value('custom_total_quantity_', total_quantity);
  frm.set_value('custom_total_net_weighttt', total_net_weight);
}

