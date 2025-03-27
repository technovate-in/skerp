frappe.ui.form.on('Design', {
  refresh(frm) {
      frm.fields_dict['item_sub_group'].get_query = function(doc) {
          return {
              filters: [
                   ['Item Group', 'parent_item_group', '=', frm.doc.item_group] // Filter to get only Item Groups where is_group is checked
              ]
          };
      };
      frm.fields_dict['item_group'].get_query = function(doc) {
          return {
              filters: [
                  ['Item Group', 'is_group', '=', 1] // Filter to get only Item Groups where is_group is checked
              ]
          };
      };
  },
  after_save:function(frm){
      frm.set_df_property('range_assigned','read_only',1);
  },
  item_sub_group:function(frm){
     frappe.call({
              method: 'frappe.client.get_list',
              args: {
                  doctype: 'Item Group',
                  fields: ['custom_from', 'custom_to_range'],
                  filters: {
                      name: frm.doc.item_sub_group
                  }
              },
              callback: function(response) {
                  if (response.message && response.message.length > 0) {
                      var from_range=response.message[0].custom_from;
                      var to_range=response.message[0].custom_to_range;
                      
                      var sub_group_range=from_range+'-'+to_range;
                      frm.set_value('sub_group_range',sub_group_range);
                       frappe.call({
                          method: 'frappe.client.get_list',
                          args: {
                              doctype: 'Design',
                              filters: {
                                  'item_sub_group': frm.doc.item_sub_group
                              },
                              fields: ['range_assigned'],
                              order_by: 'range_assigned desc',
                              limit: 1
                          },
                          callback: function(response){
                              //  var lastRangeAssigned = response.message[0].range_assigned;
                               
                              //  frm.set_value('range_assigned',lastRangeAssigned+1);
                          }});
                  }}});
  }
});