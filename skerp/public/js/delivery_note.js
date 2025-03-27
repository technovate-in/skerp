frappe.ui.form.on('Delivery Note', {
//Delivery Note : Setting Batch No.	
  refresh(frm) {
		frm.doc.items.forEach(item => {
            if (item.custom_bch_no) {
                item.use_serial_batch_fields = 1;
                item.batch_no = item.custom_bch_no;
            }
        });
        frm.refresh_field('items');
	},

  ////Delivery Note Total Net weight, total quantity 
  before_save(frm) {
    total_net_weight(frm);
    fine_weight(frm);
}


});

///Delivery Note Total Net weight, total quantity 
frappe.ui.form.on('Delivery Note Item', {
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
      fine_weight += (item.qty*item.custom_purity_percentage/100) + item.custom_labour_grams;
  }
  // frm.set_value('custom_fine_weight', fine_weight);
}
