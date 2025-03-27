frappe.ui.form.on('Item Group', {
  is_group:function(frm){
      if(frm.doc.is_group===1){
          frm.set_df_property('custom_from', 'hidden', 1);
          frm.set_df_property('custom_to_range', 'hidden', 1);
         frm.set_df_property('custom_from', 'reqd', 0);
         frm.set_df_property('custom_to_range', 'reqd', 0);
         frm.set_df_property('custom_item_parent_code','hidden',1);
         frm.set_df_property('parent_item_group','hidden',1);
         frm.set_df_property('parent_item_group','reqd',0);
      }
      else{
          frm.set_df_property('custom_from', 'hidden', 0);
          frm.set_df_property('custom_to_range', 'hidden', 0);
          frm.set_df_property('custom_from', 'reqd', 1);
          frm.set_df_property('custom_to_range', 'reqd', 1);
          frm.set_df_property('custom_item_parent_code','hidden',0);
          frm.set_df_property('parent_item_group','hidden',0);
          frm.set_df_property('parent_item_group','reqd',1);
      }
  },
  after_save:function(frm){
      if(frm.doc.is_group===1){
          frm.set_df_property('custom_from', 'hidden', 1);
          frm.set_df_property('custom_to_range', 'hidden', 1);
         frm.set_df_property('custom_from', 'reqd', 0);
         frm.set_df_property('custom_to_range', 'reqd', 0);
         frm.set_df_property('custom_item_parent_code','hidden',1);
         frm.set_df_property('parent_item_group','hidden',1);
         frm.set_df_property('parent_item_group','reqd',0);
      }
      else{
          frm.set_df_property('custom_from', 'hidden', 0);
          frm.set_df_property('custom_to_range', 'hidden', 0);
          frm.set_df_property('custom_from', 'reqd', 1);
          frm.set_df_property('custom_to_range', 'reqd', 1);
          frm.set_df_property('custom_item_parent_code','hidden',0);
           frm.set_df_property('parent_item_group','hidden',0);
          frm.set_df_property('parent_item_group','reqd',1);
      }
      
  },
  refresh:function(frm){
      if(frm.doc.is_group===1){
          frm.set_df_property('custom_from', 'hidden', 1);
          frm.set_df_property('custom_to_range', 'hidden', 1);
         frm.set_df_property('custom_from', 'reqd', 0);
         frm.set_df_property('custom_to_range', 'reqd', 0);
         frm.set_df_property('custom_item_parent_code','hidden',1);
         frm.set_df_property('parent_item_group','hidden',1);
         frm.set_df_property('parent_item_group','reqd',0);
      }
      else{
          frm.set_df_property('custom_from', 'hidden', 0);
          frm.set_df_property('custom_to_range', 'hidden', 0);
          frm.set_df_property('custom_from', 'reqd', 1);
          frm.set_df_property('custom_to_range', 'reqd', 1);
          frm.set_df_property('custom_item_parent_code','hidden',0);
          frm.set_df_property('parent_item_group','hidden',0);
          frm.set_df_property('parent_item_group','reqd',1);
      }
  }
});