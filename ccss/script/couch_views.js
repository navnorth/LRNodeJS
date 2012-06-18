// TODO turn this into a script that creates the views

// format: db -> ddoc -> view

// categories -> categories -> categories
//map
function(doc) {
  emit(doc.category, doc.standard);
}

//reduce
function(keys, values, rereduce) {    
  return values;
}

// standards -> nodes -> standards
//map
function(doc) {   
  emit(doc.standard, 1);
}

//reduce
function(keys, values, rereduce) {   
  return sum(values);
}

// standards -> nodes -> standard-parent
//map
function(doc) {   
  emit([doc.standard, doc.parent], doc);
}

