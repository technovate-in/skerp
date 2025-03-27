frappe.ui.form.on('Daily Rate Master', {
	refresh(frm) {
			frm.set_value('date', frappe.datetime.now_datetime());
	},
// 	after_save(frm){
// 	    frm.set_value('active',1);
// 	}
});

frappe.listview_settings['Daily Rate Master'] = {
  hide_name_column: true, 
 };
