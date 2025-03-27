frappe.ui.form.on('BOM', {
/// Bom Item Rate 
  after_submit(frm) {
      frm.doc.items.forEach(item => {
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
                                  frappe.model.set_value(item.doctype, item.name, "rate", rate);
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
      });
  },

//// Bom Estimated Weight
  item: function(frm) {
    if (!frm.doc.item) {
        return;
    }
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Item',
            name: frm.doc.item
        },
        callback: function(response) {
            if (!response.exc && response.message) {
                var item = response.message;
                if (item.custom_design_weight_range && item.custom_design_weight_range.includes('-')) {
                    var range_split = item.custom_design_weight_range.split('-');
                    if (range_split.length === 2 && !isNaN(range_split[0]) && !isNaN(range_split[1])) {
                        var avg_weight =  parseFloat(range_split[1]);
                        console.log(avg_weight);
                        frm.set_value('quantity', avg_weight);
                        // Refresh the field to show the new value
                        frm.refresh_field('quantity');
                    }
                }
            }
        }
    });
}
});

frappe.ui.form.on('BOM Item', {
/// Bom Item Rate 
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
