frappe.ui.form.on("Stock Entry", {
    /// Stock Entry
    refresh(frm) {
        if (frm.doc.stock_entry_type == "Send to Subcontractor") {
            console.log(frm.doc.custom_touch);
            frm.doc.items.forEach(function (row) {
                row.custom_touch = frm.doc.custom_touch;
                //  console.log(row.custom_weight);
            });
        }
        if (frm.doc.stock_entry_type == "Material Receipt") {
            frm.set_df_property("custom_is_subcontracted", "hidden", 0);
        } else {
            frm.set_df_property("custom_is_subcontracted", "hidden", 1);
        }

        if (frm.doc.custom_is_subcontracted == 1) {
            frm.set_df_property("subcontracting_order", "hidden", 0);
        } else {
            frm.set_df_property("custom_supplier_subcontracted", "hidden", 1);
        }
    },
    stock_entry_type(frm) {
        if (frm.doc.stock_entry_type == "Material Receipt") {
            frm.set_df_property("custom_is_subcontracted", "hidden", 0);
        } else {
            frm.set_df_property("custom_is_subcontracted", "hidden", 1);
        }
    },
    custom_is_subcontracted(frm) {
        if (frm.doc.custom_is_subcontracted == 1) {
            frm.set_df_property("custom_supplier_subcontracted", "hidden", 0);
        } else if (frm.doc.custom_is_subcontracted == 0) {
            frm.set_df_property("custom_supplier_subcontracted", "hidden", 1);
        }
    },
    custom_supplier_subcontracted(frm) {
        frm.doc.items.forEach(function (row) {
            row.custom_touch = frm.doc.custom_subcontracted_touch;
        });
        frm.refresh_field("items");
    },
    /// Set Rate for the work order
    after_submit(frm) {
        if (
            frm.doc.stock_entry_type == "Manufacture" ||
            frm.doc.stock_entry_type == "Material Transfer for Manufacture"
        ) {
            frm.doc.items.forEach((item) => {
                // Get purity percentage from Purity Master
                frappe.db
                    .get_value("Purity Master", item.custom_purity, "purity_percentage")
                    .then((response) => {
                        let purity_percentage = response.message.purity_percentage;
                        console.log(purity_percentage);

                        if (purity_percentage) {
                            if (purity_percentage == "99.999") {
                                purity_percentage = 100.0;
                            }

                            // Get rate_per_gram from Daily Rate Master
                            frappe.db
                                .get_value("Daily Rate Master", { active: 1 }, "rate_per_gram")
                                .then((rate_response) => {
                                    let rate_per_gram = rate_response.message.rate_per_gram;
                                    console.log(rate_per_gram);

                                    if (rate_per_gram) {
                                        let rate = rate_per_gram * (purity_percentage / 100);
                                        console.log(rate);
                                        frappe.model.set_value(
                                            item.doctype,
                                            item.name,
                                            "basic_rate",
                                            rate
                                        );
                                    }
                                })
                                .catch((error) => {
                                    console.error("Error getting rate_per_gram:", error);
                                });
                        }
                    })
                    .catch((error) => {
                        console.error("Error getting purity_percentage:", error);
                    });
            });
        }
    },
    //// Fetch Non Stock Item from WO
    onload: async function (frm) {
        // Fetch Table from WO
        if (frm.is_new() && frm.doc.docstatus == 0 && frm.doc.work_order) {
            frappe.model.with_doc("Stock Entry", frm.doc.name, function () {
                var tabletransfer = frappe.model.get_doc(
                    "Work Order",
                    frm.doc.work_order
                );

                $.each(
                    tabletransfer.custom_non_stock_item_in_wo,
                    function (index, row) {
                        console.log(frm);
                        var d = frm.add_child("custom_non_stock_item_in_wo");
                        d.item = row.item;
                        d.rate = row.rate;
                        if (frm.doc.stock_entry_type == "Manufacture") {
                            d.net_weight = row.transferred_qty;
                            d.transferred_qty = row.transferred_qty;
                        } else {
                            d.net_weight = row.net_weight;
                        }
                        frm.refresh_field("custom_non_stock_item_in_wo");
                    }
                );
            });
        }

        // Work Order Set Raw Material Weight
        if (frm.is_new()) {
            if (
                frm.doc.stock_entry_type == "Manufacture" ||
                frm.doc.stock_entry_type == "Material Transfer for Manufacture"
            ) {
                if (frm.doc.work_order) {
                    const work_order = await frappe.db.get_doc(
                        "Work Order",
                        frm.doc.work_order
                    );
                    for (var se_item of frm.doc.items) {
                        for (var wo_item of work_order.required_items) {
                            if (se_item.item_code == wo_item.item_code) {
                                se_item.qty = wo_item.required_qty;
                                se_item.custom_net_weight = wo_item.custom_gross_weight;
                                se_item.basic_rate = wo_item.rate;
                                se_item.use_serial_batch_fields = 1;
                                se_item.batch_no = wo_item.custom_bch_no;
                                se_item.custom_purity = wo_item.custom_purity;
                                //  console.log('Item ' + se_item.item_code + ' set to ' + wo_item.required_qty)
                            }
                        }
                    }

                    //  frappe.db.get_value('Work Order', frm.doc.work_order, 'custom_jadtar_selection_')
                    //         .then(r => {
                    //             console.log(r.message.custom_jadtar_selection_);
                    //             if(r.message.custom_jadtar_selection_ == 'In-house Jadtar Process'){
                    //                 for(const item of frm.doc.items){
                    //                     if(item.item_code == 'Jadtar Finishing Gold'){
                    //                         frappe.db.get_value('Work Order', frm.doc.work_order, 'custom_jadtar_finishing_gold_adjustment')
                    //                         .then(r => {
                    //                             frappe.model.set_value(item.doctype, item.name, 'qty', r.message.custom_jadtar_finishing_gold_adjustment);
                    //                         });
                    //                     }
                    //                 }
                    //             }
                    //         });
                }
            }
        }
        if (
            frm.doc.stock_entry_type == "Manufacture" ||
            frm.doc.stock_entry_type == "Material Transfer for Manufacture"
        ) {
            frm.set_df_property("custom_non_stock_item_in_wo", "hidden", 0);
        }
    },
    //// Jadtar Process Confirmation if below 60%
    before_submit: async function (frm) {
        if (frm.doc.stock_entry_type == "Manufacture") {
            if (frm.doc.custom_difference <= 60) {
                // Wrap frappe.warn in a Promise to handle async properly
                const proceed = await new Promise((resolve) => {
                    frappe.warn(
                        "Difference is below 60%",
                        "Are you sure you want to continue?",
                        () => resolve(true), // Resolve with `true` if the user confirms
                        "Continue",
                        false,
                        () => resolve(false) // Resolve with `false` if the user cancels
                    );
                });

                // if (!proceed) {
                //     // User clicked "Cancel"
                //     frappe.throw('Submission Cancelled');
                // }
            }
            // else {
            //     frappe.throw('The custom difference exceeds the acceptable limit.');
            // }
        }
    },

    //// Search With Packet Number
    custom_packet_number_: function (frm) {
        if (frm.doc.custom_packet_number_) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Packet Master",
                    name: frm.doc.custom_packet_number_,
                },
                callback: function (r) {
                    if (r.message && r.message.items) {
                        // console.log("Fetched items:", r.message.items);

                        let index = 0;

                        function setNextQR() {
                            if (index < r.message.items.length) {
                                let qr_value = r.message.items[index].custom_qr_input;

                                frm.set_value("custom_qr_scan", qr_value);
                                index++;

                                // Wait for a short delay before setting the next value
                                setTimeout(setNextQR, 500); // Adjust timing as needed
                            }
                        }

                        setNextQR();
                        frm.set_value("custom_packet_number_", "");
                    }
                },
            });
        }
    },

    /// QR Scan for Stock Entry
    custom_qr_scan: function (frm) {
        // Check if qr_scan field has value
        if (frm.doc.custom_qr_scan) {
            var qr_data = frm.doc.custom_qr_scan.split("||");

            if (qr_data.length >= 8) {
                var packet_no = qr_data[0].trim();
                var external_item_code = qr_data[1].trim();
                var gross_weight = parseFloat(qr_data[2].trim()); // nt_weight, g_weight exchanged
                var net_weight = parseFloat(qr_data[3].trim());
                var pcs = parseInt(qr_data[4].trim());
                var purity = qr_data[5].trim();
                var batch_no = qr_data[7].trim();

                // Fetch rate from 'Daily Rate Master'
                frappe.db
                    .get_value("Daily Rate Master", { active: 1 }, "rate_per_gram")
                    .then((response) => {
                        if (response.message) {
                            var ratePerGram = response.message.rate_per_gram;

                            frappe.db
                                .get_value("Batch", batch_no, "item")
                                .then((response) => {
                                    if (response.message) {
                                        var item_code = response.message.item;

                                        // Check if the first row is empty and remove it
                                        if (
                                            frm.doc.items &&
                                            frm.doc.items[0] &&
                                            !frm.doc.items[0].item_code
                                        ) {
                                            frm.doc.items = [];
                                        }

                                        // Populating Child table fields
                                        frm.add_child("items", {
                                            item_code: item_code,
                                            item_name: item_code,
                                            custom_packet_number: packet_no,
                                            custom_external_item_code: external_item_code,
                                            qty: net_weight,
                                            custom_net_weight: gross_weight,
                                            uom: "Gram",
                                            stock_uom: "Gram", //
                                            conversion_factor: 1, //
                                            transfer_qty: net_weight, //
                                            basic_rate: ratePerGram,
                                            amount: gross_weight * ratePerGram,
                                            custom_pcs: pcs,
                                            custom_purity: purity,
                                            use_serial_batch_fields: 1,
                                            batch_no: batch_no,
                                        });
                                        frm.refresh_field("items");
                                    }
                                });
                        }
                    });
                frm.set_value("custom_qr_scan", null); // Clearing qr_scan field after successful scan
            } else {
                // Handle error or unexpected format
                frappe.msgprint(__("QR code data is not in the expected format."));
                frm.set_value("custom_qr_scan", null); // Clearing qr_scan field after wrong format
            }
        }
    },

    after_save: async function (frm) {
        // Work Order Set Raw Material Weight
        if (
            frm.doc.stock_entry_type == "Manufacture" ||
            frm.doc.stock_entry_type == "Material Transfer for Manufacture"
        ) {
            if (frm.doc.work_order) {
                const work_order = await frappe.db.get_doc(
                    "Work Order",
                    frm.doc.work_order
                );
                for (var se_item of frm.doc.items) {
                    for (var wo_item of work_order.required_items) {
                        if (se_item.item_code == wo_item.item_code) {
                            se_item.basic_rate = wo_item.rate;
                        }
                    }
                }
            }
        }
    },
});

frappe.ui.form.on("Stock Entry Detail", {
    custom_weight(frm) {
        frm.doc.items.forEach(function (row) {
            var final_weight = row.custom_weight * (row.custom_touch / 100.0);
            row.qty = final_weight;
            row.uom = "Gram";
        });
        frm.refresh_field("items");
    },

    //// Set Rate for the work order
    custom_purity: function (frm, cdt, cdn) {
        if (
            frm.doc.stock_entry_type == "Manufacture" ||
            frm.doc.stock_entry_type == "Material Transfer for Manufacture"
        ) {
            let item = locals[cdt][cdn];

            // Get purity percentage from Purity Master
            frappe.db
                .get_value("Purity Master", item.custom_purity, "purity_percentage")
                .then((response) => {
                    let purity_percentage = response.message.purity_percentage;
                    console.log(purity_percentage);

                    if (purity_percentage) {
                        if (purity_percentage == "99.999") {
                            purity_percentage = 100.0;
                        }

                        // Get rate_per_gram from Daily Rate Master
                        frappe.db
                            .get_value("Daily Rate Master", { active: 1 }, "rate_per_gram")
                            .then((rate_response) => {
                                let rate_per_gram = rate_response.message.rate_per_gram;
                                console.log(rate_per_gram);

                                if (rate_per_gram) {
                                    let rate = rate_per_gram * (purity_percentage / 100);
                                    console.log(rate);
                                    frappe.model.set_value(cdt, cdn, "basic_rate", rate);
                                }
                            })
                            .catch((error) => {
                                console.error("Error getting rate_per_gram:", error);
                            });
                    }
                })
                .catch((error) => {
                    console.error("Error getting purity_percentage:", error);
                });
        }
    },
});
