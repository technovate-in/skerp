frappe.ui.form.on('HUID Processing', {
	refresh: function(frm) {
        frm.add_custom_button('Enter HUID Data', () => {
            let dialog_data = [];
            for(const item of frm.doc.items.filter(item => item.huid == null)){
                dialog_data.push({item_code: item.item_code, custom_net_weight: item.custom_net_weight, batch_no: item.batch_no});
            }
            if(dialog_data.length < 1){
                frappe.throw("HUID Already entered for all items")
            }
            let add_huid = new frappe.ui.Dialog({
                title: __("Enter HUID Data"),
                fields: [
                    {
                        fieldname: "huid_data",
                        fieldtype: "Table",
                        label: __("Enter HUID"),
                        in_place_edit: true,
                        cannot_add_rows: true,
                        cannot_delete_rows: true,
                        data: dialog_data,
                        fields: [
                            {
                                fieldname: "item_code",
                                label: __("Item Code"),
                                fieldtype: "Link",
                                options: "Item",
                                in_list_view: 1,
                                read_only: 1,
                                reqd: 1,
                            },
                            {
                                fieldname: "custom_net_weight",
                                label: __("Net Weight"),
                                fieldtype: "Float",
                                in_list_view: 1,
                                read_only: 1,
                                reqd: 1,
                            },
                            {
                                fieldname: "batch_no",
                                label: __("Batch No"),
                                fieldtype: "Link",
                                options: "Batch",
                                in_list_view: 1,
                                read_only: 1,
                                reqd: 1,
                            },
                            {
                                fieldname: "huid",
                                label: __("HUID"),
                                fieldtype: "Data",
                                in_list_view: 1,
                                reqd: 0,
                            }
                        ],
                    },
                ],
                size: 'large', // small, large, extra-large 
                primary_action_label: 'Complete',
                primary_action(values) {
                    add_huid.hide();
                    console.log(values.huid_data);
                    for(const huid_row of values.huid_data){
                        for(const item of frm.doc.items){
                            if(huid_row.item_code == item.item_code && huid_row.batch_no == item.batch_no){
                                item.huid = huid_row.huid;
                            }
                        }
                    }
                    frm.dirty();
                    frm.set_value('end_date', frappe.datetime.get_today());
                    frm.save();
                }
            });
            add_huid.show();
        });
	}
})