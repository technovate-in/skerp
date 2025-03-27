frappe.ui.form.on('QR Bulk Print', {
	refresh: function(frm) {
	    frm.add_custom_button(__("Print"), function() {frm.print_doc()});
	    
	    // If Route Options have Packet then set Packets
	    if(frappe.has_route_options() && frappe.route_options.packets){
	        console.log(frappe.route_options);
	        
	        // Clear Tables
	        frm.clear_table('packets');
	        frm.clear_table('items');
	        frm.refresh_field('packets');
	        frm.refresh_field('items');
	        
	        // Add Packets From Route
	        $.each(frappe.route_options.packets, function(key, packet) {
	            frm.add_child('packets').packet_master = packet.name;
	        });
	        
	        frm.refresh_field('packets');
	        frappe.route_options = {};
	    }
	}
});