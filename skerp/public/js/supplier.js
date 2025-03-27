/// Supplier Re-order
class SupplierTransactionHandler {
  constructor(frm) {
      this.frm = frm;
      this.currentDate = new Date();
      this.firstDayOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
      this.lastDayOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
      this.startDate = frappe.datetime.str_to_user(this.firstDayOfMonth.toISOString().split('T')[0]);
      this.endDate = frappe.datetime.str_to_user(this.lastDayOfMonth.toISOString().split('T')[0]);
      this.receiptsByDate = {};
      this.reorderDataCache = new Map(); // Cache reorder data to prevent redundant API calls
  }

  async setReorderItemsForSupplier() {
  const supplier_items = await this.fetchItemsBasedOnSupplier();
  let total_order_value = 0; // Initialize total order value

  if (supplier_items && supplier_items.length > 0) {
      const item_codes = supplier_items.map(item => item.item_code);
      const stock_data_array = await this.getItemStocks(item_codes);

      // Convert stock_data_array into a dictionary for easier access by item_code
      const stock_data = {};
      stock_data_array.forEach(stock => {
          stock_data[stock.item] = stock.batch_count;
      });

      for (const item of supplier_items) {
          const reorder_data = await this.getItemReorderData(item.item_code);
          const stock_qty = stock_data[item.item_code] || 0;

          // Calculate average weight from estimated_weight range
          const estimated_weight = item.custom_design_weight_range;
          let avg_weight = 0;
          if (estimated_weight) {
              const [minWeight, maxWeight] = estimated_weight.split('-').map(Number);
              avg_weight = (minWeight + maxWeight) / 2;
          }

          if (reorder_data && stock_qty <= reorder_data.warehouse_reorder_level) {
              const receipts = await this.getPurchaseReceipts(item.item_code);
              const transactionHistory = this.processReceipts(receipts);
              const get_sub_group = await this.getSubGroup(item.item_code);

              if (get_sub_group) {
                  // Check if subgroup already exists in the table
                  const existing_row = this.frm.doc.custom_sub_group_vise__reorder_total.find(row => row.sub_group === get_sub_group);

                  // Calculate subgroup order value for the current item
                  const subgroup_order_value = avg_weight * reorder_data.warehouse_reorder_qty;

                  if (!existing_row) {
                      // Add new row if the subgroup does not exist
                      const row = this.frm.add_child('custom_sub_group_vise__reorder_total');
                      row.sub_group = get_sub_group;
                      row.total = subgroup_order_value; // Set the total for this subgroup
                  } else {
                      // If the subgroup exists, accumulate the total order value
                      existing_row.total += subgroup_order_value; // Add to existing total
                  }
              }
              
              this.frm.refresh_field('custom_sub_group_vise__reorder_total');

              // Pass total_order_value to be accumulated in addItemToReorderTable
              total_order_value += this.addItemToReorderTable(item.item_code, stock_qty, reorder_data, transactionHistory, avg_weight);
          }
      }

      // Set the total order value to the field custom_total_order_grams on the form
      this.frm.set_value('custom_total_order_grams', total_order_value);
      this.frm.refresh_field('custom_total_order_grams');
      this.frm.refresh_field('custom_items_to_be_reorder');
  }
}

 
  async getSubGroup(item_code){
       const response = await frappe.db.get_value('Item', item_code, 'custom_sub_group');
       return response.message.custom_sub_group;
  }

  async fetchItemsBasedOnSupplier() {
      return (await frappe.call({
          method: 'frappe.client.get_list',
          args: {
              doctype: 'Item',
              filters: [['item_name', 'like', `%${this.frm.doc.custom_supplier_code}%`]],
              fields: ['item_code', 'item_name','custom_design_weight_range'],
              limit_page_length: 0
          }
      })).message;
  }

  async fetchItemsBasedOnSubGroup() {
      return (await frappe.call({
          method: 'frappe.client.get_list',
          args: {
              doctype: 'Item',
              filters: [
                  ['custom_sub_group', '=', this.frm.doc.custom_sub_group],
                  ['item_name', 'like', `%${this.frm.doc.custom_supplier_code}%`]
              ],
              fields: ['item_code', 'item_name','custom_design_weight_range'],
              limit_page_length: 0
          }
      })).message;
  }

  async getItemStocks(item_codes) {
      const response = await frappe.call({
          method: 'skerp.suvarnakala.api.non_item_batches.non_empty_item_batch_count_execute',
          args: { items: item_codes }
      });
      // console.log(response.message);
      return response.message || {};
  }

  async getItemReorderData(item_code) {
      if (!this.reorderDataCache.has(item_code)) {
          const response = await frappe.call({
              method: 'frappe.client.get_list',
              args: {
                  doctype: 'Item Reorder',
                  parent: 'Item',
                  filters: { parent: item_code },
                  fields: ['warehouse', 'warehouse_reorder_qty', 'warehouse_reorder_level'],
                  limit_page_length: 0
              }
          });
          this.reorderDataCache.set(item_code, response.message && response.message.length > 0 ? response.message[0] : null);
      }
      return this.reorderDataCache.get(item_code);
  }

  async getPurchaseReceipts(item_code) {
      return (await frappe.call({
          method: 'frappe.client.get_list',
          args: {
              doctype: 'Purchase Receipt Item',
              parent: 'Purchase Receipt',
              filters: {
                  item_code,
                  'creation': ['between', [this.startDate, this.endDate]]
              },
              fields: ['parent', 'creation'],
              order_by: 'creation desc',
              limit_page_length: 0
          }
      })).message;
  }

  processReceipts(receipts) {
      this.receiptsByDate = {};

      receipts.forEach(receipt => {
          const formattedDate = frappe.datetime.str_to_user(receipt.creation.split(' ')[0]);
          this.receiptsByDate[formattedDate] = (this.receiptsByDate[formattedDate] || 0) + 1;
      });

      return Object.keys(this.receiptsByDate)
          .map(date => `${date} - ${this.receiptsByDate[date]}`)
          .join('\n');
  }

  addItemToReorderTable(item_code, stock_qty, reorder_data, transactionHistory, avg_weight) {
  const row = this.frm.add_child('custom_items_to_be_reorder');
  row.item_code = item_code;
  row.current_stock_in_inventory = stock_qty;
  // row.reorder_level = reorder_data.warehouse_reorder_level;
  row.no_of_pcs_to_reorder = reorder_data.warehouse_reorder_qty;
  row.current_month_transaction_history = transactionHistory;
  
  // Calculate the estimated total weight for this row
  const item_order_value = avg_weight * reorder_data.warehouse_reorder_qty;
  row.estimated_weight = item_order_value;

  // Return the item order value to accumulate it in total_order_value
  return item_order_value;
}


  async processItemsForReorderTable() {
      const items = await this.fetchItemsBasedOnSubGroup();
      let total_order_value=0;
      if (items && items.length > 0) {
          const item_codes = items.map(item => item.item_code);
          const stock_data_array = await this.getItemStocks(item_codes);
          const stock_data = {};
          stock_data_array.forEach(stock => {
                  stock_data[stock.item] = stock.batch_count;
          });
          
          
          for (const item of items) {
              const reorder_data = await this.getItemReorderData(item.item_code);
              const stock_qty = stock_data[item.item_code] || 0;
              const receipts = await this.getPurchaseReceipts(item.item_code);
              const transactionHistory = this.processReceipts(receipts);
              const estimated_weight = item.custom_design_weight_range;
              let avg_weight = 0;
              if (estimated_weight) {
                  const [minWeight, maxWeight] = estimated_weight.split('-').map(Number);
                  avg_weight = (minWeight + maxWeight) / 2;
              }
              
             
              if (reorder_data && !this.frm.doc.custom_tems__in_reorder.find(row => row.item_code === item.item_code)) {
                  const row = this.frm.add_child('custom_tems__in_reorder');
                  row.item_code = item.item_code;
                  // row.item_name = item.item_name;
                  row.no_of_pcs_to_reorder = reorder_data.warehouse_reorder_qty;
                  row.current_stock_in_inventory = stock_qty;
                  row.current_month_transaction_history = transactionHistory;
                  row.estimated_weight=avg_weight*reorder_data.warehouse_reorder_qty;
                  total_order_value=total_order_value+(avg_weight*reorder_data.warehouse_reorder_qty);
                  // console.log(total_order_value)
              }
          }
          this.frm.refresh_field('custom_tems__in_reorder');
          
          // this.frm.set_value('custom_total_order_grams',total_order_value);
          this.frm.refresh_field('custom_total_order_grams');
      }
  }

  createPurchaseOrder(frm) {

  let selected_items = frm.get_selected();
  let customItemsInReorder = selected_items['custom_items_to_be_reorder'];
  console.log(selected_items);
  let items=[];



  if (customItemsInReorder === undefined) {
  frappe.msgprint(__('No items selected to create a Purchase Order.'));
  return;
  }
  selected_items.custom_items_to_be_reorder.forEach(function(item, index, array) { 
    console.log(item);
    let row = locals["Items To Be Re-Order"][item];
    console.log(row);
    items.push(row);
     
  });

  // Create an array to hold purchase order items with ranges
  let po_items = [];
  let warehouse; // Initialize warehouse variable

  const fetchDesignDetails = async (item_code) => {
      const response = await frappe.call({
          method: 'frappe.client.get_value',
          args: {
              doctype: 'Item',
              filters: { item_code: item_code },
              fieldname: 'custom_design'
          }
      });
      return response.message ? response.message.custom_design : null;
  };

  const fetchDesignRange = async (design) => {
      const response = await frappe.call({
          method: 'frappe.client.get_value',
          args: {
              doctype: 'Design',
              filters: { name: design },
              fieldname: ['from_range', 'to_range']
          }
      });
      return response.message ? response.message : null;
  };

  const fetchWarehouse = async (item_code) => {
      const response = await frappe.call({
          method: 'frappe.client.get_list',
          args: {
              doctype: 'Item Reorder',
              parent: 'Item',
              filters: { parent: item_code },
              fields: ['warehouse'] // Fetch the warehouse field
          }
      });
      return response.message.length > 0 ? response.message[0].warehouse : null;
  };

  const processItem = async (item) => {
      const design = await fetchDesignDetails(item.item_code);
      if (!warehouse) { // Fetch warehouse only once
          warehouse = await fetchWarehouse(item.item_code); // Fetch warehouse for the item
      }

      if (design) {
          const range = await fetchDesignRange(design);
          if (range) {
              po_items.push({
                  item_code: item.item_code,
                  custom_quantity: item.no_of_pcs_reorder,
                  schedule_date: frappe.datetime.now_date(),
                  qty: (range.from_range + range.to_range) / 2
              });
          }
      }
  };
  console.log(customItemsInReorder);
  // Process all items from selected_items (either custom_items__in_reorder or custom_items_in_stock)
  Promise.all(items.map(item => processItem(item)))
      .then(() => {
          // Once all items have been processed, make the API call to create the Purchase Order
          frappe.call({
              method: 'frappe.client.insert',
              args: {
                  doc: {
                      doctype: 'Purchase Order',
                      supplier: frm.doc.name, // Assuming 'supplier' field exists
                      schedule_date: frappe.datetime.now_date(),
                      items: po_items,
                      set_warehouse: warehouse // Set warehouse here
                  }
              },
              callback: function(response) {
                  if (response.message) {
                      frappe.msgprint(__('Purchase Order {0} created', [response.message.name]));
                  }
              }
          });
      })
      .catch(error => {
          console.error(error);
          frappe.msgprint(__('Error occurred while processing items.'));
      });
}
}

frappe.ui.form.on('Supplier', {
  
///Supplier Touch  
  before_save: function(frm) {
      var overlap = checkDateOverlap(frm);
      if (overlap) {
          frappe.msgprint("Dates overlap in the Touch table. Please correct it.");
          frappe.validated = false; // Prevent saving
      }
  },
///Supplier Re-order
  custom_sub_group(frm) {
    if (frm.doc.custom_sub_group) {
        frm.clear_table('custom_items_in_stock');
        frm.clear_table('custom_items_to_be_reorder');

        const handler = new SupplierTransactionHandler(frm);
        handler.processItemsForReorderTable();
    }
},
 onload(frm) {
  frm.clear_table('custom_items_in_stock');
  frm.clear_table('custom_items_to_be_reorder');
  frm.clear_table('custom_items_to_be_reorder');
  frm.set_value('custom_sub_group', null);
  frm.refresh_field('custom_sub_group');

  const handler = new SupplierTransactionHandler(frm);
  handler.setReorderItemsForSupplier();
 },
 refresh(frm) {
  frm.add_custom_button(__('Create PO'), function() {
      // Save the form first
      // frm.save().then(() => {
          // Once saved, initialize SupplierTransactionHandler and call createPurchaseOrder
          const handler = new SupplierTransactionHandler(frm);
          handler.createPurchaseOrder(frm);
      // });
  });
}


});

function checkDateOverlap(frm) {
  var overlaps = false;
  var dates = [];
  frm.doc.custom_supplier_touch.forEach(function(row) {
      dates.push([row.from_date, row.to_date]);
  });

  for (var i = 0; i < dates.length; i++) {
      for (var j = i + 1; j < dates.length; j++) {
          if (datesOverlap(dates[i][0], dates[i][1], dates[j][0], dates[j][1])) {
              overlaps = true;
              break;
          }
      }
      if (overlaps) {
          break;
      }
  }
  return overlaps;
}

function datesOverlap(start1, end1, start2, end2) {
  return !(end1 < start2 || start1 > end2);
}


frappe.ui.form.on('Supplier Touch', {
from_date(frm){
   // console.log("Hello");
}
});