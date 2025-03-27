frappe.ui.form.on('Image Upload', {
	refresh: function(frm) {
		if (!frm.is_new() && frm.doc.docstatus == 0) {
		    frm.set_intro('');
            frm.set_intro('Submit this document to Upload the Images', 'red');
        }
	},
	
	upload_type: function(frm){
	    frm.set_value('upload_images', [])
	    set_link_type(frm);
	}
})

frappe.ui.form.on('Image Upload Item', {
	upload_images_add(frm) {
		set_link_type(frm);
	}
})


function set_link_type(frm){
    for(var row of frm.doc.upload_images){
        frappe.model.set_value(row.doctype, row.name, 'doctype_link', frm.doc.upload_type);
    }
}