frappe.ui.form.on('Item', {
/// ITem  
  refresh(frm) {
      if(frm.doc.has_variants==1){
          frm.set_df_property('custom_sub_group', 'hidden', 1);
          frm.set_df_property('custom_sub_group', 'reqd', 0);
          frm.set_df_property('custom_design', 'hidden', 1);
          frm.set_df_property('custom_design', 'reqd', 0);
          // frm.set_df_property('custom_design_weight_range', 'hidden', 1);
      }
      if(frm.doc.has_variants==0){
          frm.set_df_property('custom_sub_group', 'hidden', 0);
          frm.set_df_property('custom_sub_group', 'reqd', 1);
          frm.set_df_property('custom_design', 'hidden', 0);
          frm.set_df_property('custom_design', 'reqd', 1);
          // frm.set_df_property('custom_design_weight_range', 'hidden', 0);
      }
      frm.fields_dict['custom_sub_group'].get_query = function(doc) {
          return {
              filters: [
                  ['Item Group', 'parent_item_group', '=', frm.doc.item_group] // Filter to get only Item Groups where is_group is checked
              ]
          };
      };
      
       frm.fields_dict['custom_design'].get_query = function(doc) {
          return {
              filters: [
                  ['Design', 'item_sub_group', '=', frm.doc.custom_sub_group] // Filter to get only Item Groups where is_group is checked
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
  

  has_variants:function(frm){
      if(frm.doc.has_variants==1){
          frm.set_df_property('custom_sub_group', 'hidden', 1);
          frm.set_df_property('custom_sub_group', 'reqd', 0);
          frm.set_df_property('custom_design', 'hidden', 1);
          frm.set_df_property('custom_design', 'reqd', 0);
          // frm.set_df_property('custom_design_weight_range', 'hidden', 1);
        
      }
      if(frm.doc.has_variants==0){
          frm.set_df_property('custom_sub_group', 'hidden', 0);
          frm.set_df_property('custom_sub_group', 'reqd', 1);
          frm.set_df_property('custom_design', 'hidden', 0);
          frm.set_df_property('custom_design', 'reqd', 1);
          // frm.set_df_property('custom_design_weight_range', 'hidden', 0);
          
      }
     
  },
  
  custom_design:function(frm){
          frappe.call({
              method: 'frappe.client.get_list',
              args: {
                  doctype: 'Design',
                  fields: ['from_range', 'to_range'],
                  filters: {
                      name: frm.doc.custom_design
                  }
              },
              callback: function(response) {
                  if (response.message && response.message.length > 0) {
                      console.log(response.message);
                      var from_range=response.message[0].from_range;
                      var to_range=response.message[0].to_range;
                      
                      var weight_range=from_range+'-'+to_range;
                      frm.set_value("custom_design_weight_range",weight_range);
                  }}});
  },
});

frappe.listview_settings['Item'] = {
  hide_name_column: true, 

  onload: function(listview) {
      // Your custom logic here
  }
};



       
     
      
      
  
  
