frappe.ui.form.on('Sales Invoice', {
//// Sales Invoice Total Net Weight, Fine Weight	
  before_save(frm) {
	    total_net_weight(frm);
	    fine_weight(frm);
	    calculate_rate(frm);
	}
})

frappe.ui.form.on('Sales Invoice Item', {
    items_remove: function(frm, cdt, cdn) {
	    total_net_weight(frm);
	    fine_weight(frm);
	}, 
	
	qty: function(frm, cdt, cdn) {
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
	}
})

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
        // fine_weight += (item.qty*item.custom_purity_percentage/100) + item.custom_labour_grams
        fine_weight += (item.qty*item.custom_purity_percentage/100)
    }
    frm.set_value('custom_fine_weight', fine_weight);
}

function calculate_rate(frm) {
    for (const item of frm.doc.items) {
        let purity = item.custom_purity;  // Assuming 'custom_purity' is the field in your items table
        
        frappe.db.get_value('Purity Master', purity, 'purity_percentage')
            .then(response => {
                var purity_percentage = response.message.purity_percentage;
                console.log(purity_percentage)
                frappe.db.get_value('Daily Rate Master', {'active': 1}, 'rate_per_gram')
                    .then(response => {
                        if (response.message) {
                            var ratePerGram = response.message.rate_per_gram;
                            console.log(ratePerGram)
                            // Perform calculations and set values
                            var calculated_rate = ratePerGram * (purity_percentage / 100);
                            item.rate = calculated_rate;
                            item.amount = item.qty * calculated_rate;
                            // Refresh the fields to show updated values
                            frm.refresh_field('items');
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching rate per gram:', error);
                    });
            })
            .catch(error => {
                console.error('Error fetching purity percentage:', error);
            });
    }
}
