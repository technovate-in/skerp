frappe.ui.form.on('Purchase Receipt', {

  /// Purchase Receipt
  before_save(frm){
      if(frm.doc.custom_to_karigar==1){
          
      if(frm.doc.custom_payment_of_labour=="--Select--"){
          frappe.throw('Please select the payment type of labour');
      }
  }
    /// Purchase Receipt Total Net Weight, Fine Weight
      total_net_weight(frm);
      fine_weight(frm);
  },



//// Weight Scale - Purchase Reciept
 onload(frm) {
    check_connect(frm)
      frm.add_custom_button(__('Connect Port'), function(){ new_connect(frm); });
 },


//// Purchase Receipt  Item code filter based on supplier 
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
   
  ////Purchase Receipt Items row based on Quantity in PO  
    if (frm.doc.__islocal) {
      frm.doc.items.forEach(item => {
          if (item.custom_quantity && item.custom_quantity > 1) {
              let original_qty = item.qty; // Store the original qty
              let divided_qty = original_qty / item.custom_quantity; // Calculate qty for each item

              // Update the original item's quantity
              item.qty = divided_qty;

              // Add new rows based on custom_quantity
              for (let i = 1; i < item.custom_quantity; i++) {
                  let newItem = frappe.model.add_child(frm.doc, 'Purchase Receipt Item', 'items');
                  newItem.item_code = item.item_code;
                  newItem.item_name = item.item_name; // Ensure this is set correctly
                  newItem.uom = item.uom;
                  newItem.qty = divided_qty;  // Set qty as original_qty / custom_quantity
                  newItem.custom_purity_master = item.custom_purity_master;
                  newItem.custom_quantity = 1;  // Ensure custom_quantity is set to 1 for new items
              }

              // Reset custom_quantity to 1 for the original item
              item.custom_quantity = 1;
          }
      });
      
      frm.refresh_field('items');
//         }
//     }
// });

       if (frm.doc.supplier) {
   
      var today = frappe.datetime.now_datetime();
      // Fetch Supplier document
      frappe.call({
          method: 'frappe.client.get',
          args: {
              doctype: 'Supplier',
              name: frm.doc.supplier,
          },
          callback: function(response) {
              var supplier_doc = response.message;
              var custom_touch_data = supplier_doc.custom_supplier_touch || [];
              var touchPercentage = null;
              
              // Find touch percentage for the current date
              for (var i = 0; i < custom_touch_data.length; i++) {
                  var row = custom_touch_data[i];
                  var from_date = row.from_date;
                  var to_date = row.to_date;
                  var touch = row.touch;
                  // console.log(to_date);
                  if (from_date && to_date && touch) {
                      if (today >= from_date && today <= to_date) {
                          touchPercentage = touch;
                          break;
                      }
                  }
              }
              console.log( touchPercentage);
              frm.doc.items.forEach(function(item) {
              frappe.model.set_value(item.doctype, item.name, "custom_labour_touch", touchPercentage);
          });
          
          frm.refresh_field("items");
          }
      });
  }
    }
  },
  
////Purchase Receipt Touch 
  tax_category: function(frm, cdt, cdn) {
    if (frm.doc.tax_category === "In-State") {
        frm.set_value("taxes_and_charges", "Input GST In-state - SK");
    }
   }
  
});

//// Purchase Receipt Total Net Weight, Fine Weight
frappe.ui.form.on('Purchase Receipt Item', {
	items_remove: function(frm, cdt, cdn) {
	    total_net_weight(frm);
	    fine_weight(frm);
	}, 
	
	qty: function(frm, cdt, cdn) {
	    total_net_weight(frm);
	    fine_weight(frm);
	},
	
	custom_labour_: function(frm, cdt, cdn) {
	    total_net_weight(frm);
	    fine_weight(frm);
	},
	
	custom_purity: function(frm, cdt, cdn) {
	    total_net_weight(frm);
	    fine_weight(frm);
	},
	
	custom_net_weight: function(frm, cdt, cdn) {
	    total_net_weight(frm);
	    fine_weight(frm);
	},

//// Purchase Receipt Fetch Avg Weight
  item_code: function(frm, cdt, cdn) {
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
                            // console.log('Average weight for item', current_row.item_code, ':', avg_weight);
                            // Update the qty for the current row
                            frappe.model.set_value(cdt, cdn, 'custom_avg_weight_item', avg_weight);
                            // Setting 'qty' for the first time i.e., quantity * avg_weight 
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

   /// Labour Rate
  custom_labour_rate: function(frm, cdt, cdn) {
    let item = locals[cdt][cdn];
    console.log(item.custom_labour_rate * item.custom_item_weight_999)
    frappe.model.set_value(cdt, cdn, 'custom_labour_amount', item.custom_labour_rate * item.custom_item_weight_999);
   },


   /// Purchase Receipt Touch 
   custom_labour_touch:function(frm,cdt,cdn){
    let item = locals[cdt][cdn];

        // Get purity percentage from Purity Master
        frappe.db.get_value('Purity Master', item.custom_purity_master, 'purity_percentage')
            .then(response => {
                let purity_percentage = response.message.purity_percentage;

                if (purity_percentage) {
                    if (purity_percentage=="99.999"){
                                                purity_percentage=100.0;
                                            }
                    
                    // Get rate_per_gram from Daily Rate Master
                    frappe.db.get_value('Daily Rate Master', { 'active': 1 }, 'rate_per_gram')
                        .then(rate_response => {
                            let rate_per_gram = rate_response.message.rate_per_gram;

                            if (rate_per_gram) {
                                // console.log("Rate per gram:", rate_per_gram);

                                let touch = item.qty * (purity_percentage / 100);
                                let labour_touch = (item.qty * (item.custom_labour_touch / 100))-touch;
                                let total_labour = touch + labour_touch;
                                let rate=rate_per_gram*(purity_percentage / 100);
                                

                                // console.log("Touch:", touch);
                                // console.log("Labour Touch:", labour_touch);
                                // console.log("Total Labour:", total_labour);
                                // console.log("rate",rate_per_gram);

                                frappe.model.set_value(cdt, cdn, "uom", "Gram");
                                frappe.model.set_value(cdt, cdn, "custom_item_weight_999", touch);
                                frappe.model.set_value(cdt, cdn, "custom_labour_weight_999", labour_touch);
                                frappe.model.set_value(cdt, cdn, "custom_labour_", total_labour);
                                frappe.model.set_value(cdt,cdn,"rate",rate);
                                  
                            } else {
                                console.log('Rate per gram is null');
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching rate per gram:', error);
                        });

                } else {
                    console.log('Purity percentage is null');
                }
            })
            .catch(error => {
                console.error('Error fetching purity percentage:', error);
            });
    
   },
    qty: function(frm, cdt, cdn) {
      
        let item = locals[cdt][cdn];

        // Get purity percentage from Purity Master
        frappe.db.get_value('Purity Master', item.custom_purity_master, 'purity_percentage')
            .then(response => {
                let purity_percentage = response.message.purity_percentage;

                if (purity_percentage) {
                    if (purity_percentage=="99.999"){
                                                purity_percentage=100.0;
                                            }
                    
                    // Get rate_per_gram from Daily Rate Master
                    frappe.db.get_value('Daily Rate Master', { 'active': 1 }, 'rate_per_gram')
                        .then(rate_response => {
                            let rate_per_gram = rate_response.message.rate_per_gram;

                            if (rate_per_gram) {
                                // console.log("Rate per gram:", rate_per_gram);

                                let touch = item.qty * (purity_percentage / 100);
                                let labour_touch = (item.qty * (item.custom_labour_touch / 100))-touch;
                                let total_labour = touch + labour_touch;
                                let rate=rate_per_gram*(purity_percentage / 100);
                                

                                // console.log("Touch:", touch);
                                // console.log("Labour Touch:", labour_touch);
                                // console.log("Total Labour:", total_labour);
                                // console.log("rate",rate_per_gram);

                                frappe.model.set_value(cdt, cdn, "uom", "Gram");
                                frappe.model.set_value(cdt, cdn, "custom_item_weight_999", touch);
                                frappe.model.set_value(cdt, cdn, "custom_labour_weight_999", labour_touch);
                                frappe.model.set_value(cdt, cdn, "custom_labour_", total_labour);
                                frappe.model.set_value(cdt,cdn,"rate",rate);
                                  
                            } else {
                                console.log('Rate per gram is null');
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching rate per gram:', error);
                        });

                } else {
                    console.log('Purity percentage is null');
                }
            })
            .catch(error => {
                console.error('Error fetching purity percentage:', error);
            });
   },
	  item_code:function(frm,cdt,cdn){
	    frm.doc.items.forEach(function(item){
	        var date=frappe.datetime.get_today();
	        frappe.model.set_value(cdt,cdn,"schedule_date",date);
	    });
	    
	    var child = locals[cdt][cdn];
      
        if (frm.doc.supplier) {
	       
            var today = frappe.datetime.now_datetime();
            // Fetch Supplier document
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Supplier',
                    name: frm.doc.supplier,
                },
                callback: function(response) {
                    var supplier_doc = response.message;
                    var custom_touch_data = supplier_doc.custom_supplier_touch || [];
                    var touchPercentage = null;
                    
                    // Find touch percentage for the current date
                    for (var i = 0; i < custom_touch_data.length; i++) {
                        var row = custom_touch_data[i];
                        var from_date = row.from_date;
                        var to_date = row.to_date;
                        var touch = row.touch;
                        // console.log(to_date);
                        if (from_date && to_date && touch) {
                            if (today >= from_date && today <= to_date) {
                                touchPercentage = touch;
                                break;
                            }
                        }
                    }
                    console.log( touchPercentage);
                    frm.doc.items.forEach(function(item) {
                    frappe.model.set_value(item.doctype, item.name, "custom_labour_touch", touchPercentage);
                });
                
                frm.refresh_field("items");
                }
            });
        }
        
        let item = locals[cdt][cdn];

        // Get purity percentage from Purity Master
        frappe.db.get_value('Purity Master', item.custom_purity_master, 'purity_percentage')
            .then(response => {
                let purity_percentage = response.message.purity_percentage;
                console.log(item)

                if (purity_percentage) {
                    if (purity_percentage=="99.999"){
                                                purity_percentage=100.0;
                                            }
                    
                    // Get rate_per_gram from Daily Rate Master
                    frappe.db.get_value('Daily Rate Master', { 'active': 1 }, 'rate_per_gram')
                        .then(rate_response => {
                            let rate_per_gram = rate_response.message.rate_per_gram;

                            if (rate_per_gram) {
                                // console.log("Rate per gram:", rate_per_gram);

                                let touch = item.qty * (purity_percentage / 100);
                                let labour_touch = (item.qty * (item.custom_labour_touch / 100))-touch;
                                let total_labour = touch + labour_touch;
                                let rate=rate_per_gram*(purity_percentage / 100);
                                

                                // console.log("Touch:", touch);
                                // console.log("Labour Touch:", labour_touch);
                                // console.log("Total Labour:", total_labour);
                                // console.log("rate",rate_per_gram);

                                frappe.model.set_value(cdt, cdn, "uom", "Gram");
                                frappe.model.set_value(cdt, cdn, "custom_item_weight_999", touch);
                                frappe.model.set_value(cdt, cdn, "custom_labour_weight_999", labour_touch);
                                frappe.model.set_value(cdt, cdn, "custom_labour_", total_labour);
                                frappe.model.set_value(cdt,cdn,"rate",rate);
                                  
                            } else {
                                console.log('Rate per gram is null');
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching rate per gram:', error);
                        });

                } else {
                    console.log('Purity percentage is null');
                }
            })
            .catch(error => {
                console.error('Error fetching purity percentage:', error);
            });
        
        
	 },

  ////Purchase Receipt Gross and Net Weight Same 
   custom_net_weight(frm, cdt, cdn) {
		// Get the specific child table row
		let row = locals[cdt][cdn];

		// Get the qty value from the row
		let qty = row.custom_net_weight;

		// Set the custom_net_weight field in the same row to the qty value
		frappe.model.set_value(cdt, cdn, "qty", qty);
	}
	    

});

///// Purchase Receipt Total Net Weight, Fine Weight
function total_net_weight(frm){
  var total = 0;
  for (const item of frm.doc.items){
      total += item.custom_net_weight;
  }

  var length=frm.doc.items.length;
  frm.set_value('custom_total_quantity',length);
  frm.set_value('custom_total_net_weighttt', total);
}

function fine_weight(frm) {
  var fine_weight = 0;
  for (const item of frm.doc.items){
      // fine_weight += (item.qty*item.custom_purity_percentage/100) + item.custom_labour_
      fine_weight += (item.qty*item.custom_purity_percentage/100)
  }
  frm.set_value('custom_fine_weight', fine_weight);
}

///// Weight Scale - Purchase Reciept
async function check_connect(frm) {
  const ports = await navigator.serial.getPorts();
  const port = (ports.length > 0) ? ports[0] : await navigator.serial.requestPort();

  connect(frm, port);
}

async function new_connect(frm){
  const port = await navigator.serial.requestPort();
  
  connect(frm, port);
}

async function connect(frm, port) {
// Request a port and open a connection.
try {
  await port.open({ baudRate: 9600, dataBits: 8, parity: 'none', stopBits: 1 });
  console.log(port)
  
  // window.addEventListener('beforeunload', async (event) => {
  //   if (port && port.readable) {
  //     await port.close();
  //     console.log('Closed')
  //   }
  // });
} catch (error) {
  console.error('Failed to open port:', error);
  return;
}

// Set up the reader and start reading.
while (port.readable) {
  const reader = port.readable.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // The stream was canceled or closed.
        break;
      }
      console.log(value);

      // Check if the current page is the Purchase Order page.
      const route = frappe.get_route();
      if (route[0] === 'Form' && route[1] === 'Purchase Receipt') {
          if(value[0]==2){
              var string = new TextDecoder().decode(value.slice(1));
              frappe.msgprint(string);
          }
          else{
              var string = new TextDecoder().decode(value);
              frappe.msgprint(string);
          }
          
          frm.doc.items[0].custom_net_weight = string;  // custom_net_weight field is Gross Weight 
          frm.refresh_field('items');
      }
    }
  } catch (error) {
    // Handle non-fatal read error.
    console.log(error);
  } finally {
    // Close the reader when it's no longer needed.
    reader.cancel();
    port.close();
    console.log('Closed');
  
    // Store the port info in local storage
  //   const info = port.getInfo();
  //   localStorage.setItem('serialPort', false);
  }
}
}