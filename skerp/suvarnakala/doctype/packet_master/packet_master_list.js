frappe.listview_settings["Packet Master"] = {
    onload(listview) {
        listview.page.add_action_item("Bulk Print", function () {
            selected_packets = listview.get_checked_items();
            bulk_print(selected_packets);
        });
    },
};

function bulk_print(packets) {
    console.log(packets);
    let route_options = { packets: [] };

    $.each(packets, function (key, packet) {
        route_options.packets.push(packet);
    });

    frappe.route_options = route_options;
    frappe.set_route("FORM", "QR Bulk Print");
}
