import frappe

def before_save(doc, method):
  total_calcualtion(doc,method)


def total_calcualtion(doc,method):
  total_weight = 0
  total_amount = 0
  rounded_amount = 0
  total_net_weight=0

  for item in doc.items:
      total_weight = total_weight + item.gross_weight_gram
      total_amount = total_amount + item.amount
      total_net_weight=total_net_weight+item.weightgramct

  doc.total_weights = total_weight
  doc.total_amount = total_amount
  doc.total_net_weight_grams=total_net_weight
  doc.rounded_amount = round(total_amount)
    