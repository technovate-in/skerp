app_name = "skerp"
app_title = "SUVARNAKALA"
app_publisher = "Technovate Solutions"
app_description = "Custom Jewellery ERP"
app_email = "support@technovate.in"
app_license = "mit"

# Apps
# ------------------

required_apps = ["frappe/erpnext"]

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "skerp",
# 		"logo": "/assets/skerp/logo.png",
# 		"title": "SUVARNAKALA",
# 		"route": "/skerp",
# 		"has_permission": "skerp.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/skerp/css/skerp.css"
# app_include_js = "/assets/skerp/js/packet_master.js"

# include js, css files in header of web template
# web_include_css = "/assets/skerp/css/skerp.css"
# web_include_js = "/assets/skerp/js/skerp.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "skerp/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {"Purchase Receipt": "public/js/purchase_receipt.js",
              "Purchase Order": "public/js/purchase_order.js",
              "Sales Order": "public/js/sales_order.js",
              "Sales Invoice": "public/js/sales_invoice.js",
              "Stock Entry": "public/js/stock_entry.js",
              "Work Order": "public/js/work_order.js",
              "Supplier": "public/js/supplier.js",
              "Item": "public/js/item.js",
              "Delivery Note": "public/js/delivery_note.js",
              "BOM": "public/js/bom.js",
              "Item Group": "public/js/item_group.js", }
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "skerp/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "skerp.utils.jinja_methods",
# 	"filters": "skerp.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "skerp.install.before_install"
# after_install = "skerp.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "skerp.uninstall.before_uninstall"
# after_uninstall = "skerp.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "skerp.utils.before_app_install"
# after_app_install = "skerp.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "skerp.utils.before_app_uninstall"
# after_app_uninstall = "skerp.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "skerp.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events
# skerp.suvarnakala.doc_events/purchase_receipt/pr_after_submit.py

# after_save and after_submit not there use on_update and on_submit

doc_events = {
    "Purchase Receipt": {
        "before_save": "skerp.suvarnakala.doc_events.purchase_receipt.purchase_receipt_before_save.before_save",
        "before_insert": "skerp.suvarnakala.doc_events.purchase_receipt.purchase_receipt_before_insert.before_insert",
        "on_submit": "skerp.suvarnakala.doc_events.purchase_receipt.pr_after_submit.after_submit",
    },
    "Packet Master": {
        "before_save": "skerp.suvarnakala.doc_events.packet_master.pm_before_save.before_save",
        "on_update": "skerp.suvarnakala.doc_events.packet_master.pm_after_save.after_save",
        "after_insert": "skerp.suvarnakala.doc_events.packet_master.pm_after_insert.after_insert"
    },
    "Sales Person Issue": {
        "before_save": "skerp.suvarnakala.doc_events.sales_person.sp_before_save.before_save",
        "after_insert": "skerp.suvarnakala.doc_events.sales_person.sp_after_insert.after_insert",
        "before_insert": "skerp.suvarnakala.doc_events.sales_person.sp_before_insert.before_insert"
    },
    "Sales Person Items Return": {
        "before_save": "skerp.suvarnakala.doc_events.sales_person_items_return.spr_before_save.before_save",
        "before_insert": "skerp.suvarnakala.doc_events.sales_person_items_return.spr_before_insert.before_save",
        "after_insert": "skerp.suvarnakala.doc_events.sales_person_items_return.spr_after_insert.after_insert"
    },
    "Stock Entry": {
        "before_save": "skerp.suvarnakala.doc_events.stock_entry.se_before_save.before_save",
        "on_submit": "skerp.suvarnakala.doc_events.stock_entry.se_after_submit.after_submit",
        "before_validate": "skerp.suvarnakala.doc_events.stock_entry.se_before_validate.before_validate"
    },
    "Sales Order": {
        "before_save": "skerp.suvarnakala.doc_events.estimate_oder.eo_before_save.before_save",
        "on_submit": "skerp.suvarnakala.doc_events.estimate_oder.eo_after_submit.after_submit",
        "before_update_after_submit": "skerp.suvarnakala.doc_events.estimate_oder.eo_after_save_submited_doc.after_save_submited_doc"
    },
    "Manufacturer": {
        "after_insert": "skerp.suvarnakala.doc_events.manufacturer.manufacturer_after_insert.after_insert",
        "before_save": "skerp.suvarnakala.doc_events.manufacturer.manufacturer_before_save.before_save"
    },
    "Item": {
        "before_save": "skerp.suvarnakala.doc_events.items.items_before_save.before_save",
        "after_insert": "skerp.suvarnakala.doc_events.items.items_after_insert.after_insert",
        "on_update": "skerp.suvarnakala.doc_events.items.items_after_save.after_save",
        "after_rename": "skerp.suvarnakala.doc_events.items.items_after_rename.after_rename"
    },
    "Purchase Order": {
        "before_save": "skerp.suvarnakala.doc_events.purchase_order.po_before_save.before_save"
    },
    "Image Upload": {
        "before_save": "skerp.suvarnakala.doc_events.image_upload.image_save_before_save.before_save",
        "on_submit": "skerp.suvarnakala.doc_events.image_upload.image_upload_after_submit.after_submit"
    },
    "Supplier": {
        "after_insert": "skerp.suvarnakala.doc_events.supplier.supplier_after_insert.after_insert"
    },
    "QR Bulk Print": {
        "before_save": "skerp.suvarnakala.doc_events.qr_bulk_print.qr_bulk_print_before_save.before_save"
    },
    "Daily Rate Master": {
        "after_insert": "skerp.suvarnakala.doc_events.daily_rate_master.drm_after_insert.after_insert"
    },
    "Design": {
        "before_save": "skerp.suvarnakala.doc_events.design.design_before_save.before_save",
        "after_insert": "skerp.suvarnakala.doc_events.design.design_after_insert.after_insert",
        "before_insert": "skerp.suvarnakala.doc_events.design.design_before_insert.before_insert"
    },
    "HUID Processing": {
        "on_update": "skerp.suvarnakala.doc_events.huid_processing.huid_after_save.after_save",
        "before_save": "skerp.suvarnakala.doc_events.huid_processing.huid_before_save.before_save"
    },
    "Customer": {
        "after_insert": "skerp.suvarnakala.doc_events.customer.customer_after_insert.after_insert"
    },
    "Work Order": {
        "before_save": "skerp.suvarnakala.doc_events.work_order.wo_before_save.before_save"
    },
    "Item Group": {
        "before_save": "skerp.suvarnakala.doc_events.item_group.item_group_before_save.before_save"
    },
    "Delivery Note": {
        "on_submit": "skerp.suvarnakala.doc_events.delivery_note.dn_after_submit.after_submit"
    },
    "BOM": {
        "on_update": "skerp.suvarnakala.doc_events.bom.bom_after_save.after_save"
    },
    "Stock Audit Reconciliation": {
        "before_save": "skerp.suvarnakala.doc_events.stock_audit_reconciliation.sar_before_save.before_save"
    }
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"skerp.tasks.all"
# 	],
# 	"daily": [
# 		"skerp.tasks.daily"
# 	],
# 	"hourly": [
# 		"skerp.tasks.hourly"
# 	],
# 	"weekly": [
# 		"skerp.tasks.weekly"
# 	],
# 	"monthly": [
# 		"skerp.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "skerp.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "skerp.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "skerp.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["skerp.utils.before_request"]
# after_request = ["skerp.utils.after_request"]

# Job Events
# ----------
# before_job = ["skerp.utils.before_job"]
# after_job = ["skerp.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"skerp.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }
