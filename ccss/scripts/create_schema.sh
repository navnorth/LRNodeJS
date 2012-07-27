#!/bin/sh

#   Copyright 2012 Navigation North Learning Solutions LLC
#   Licensed under the Apache License, Version 2.0 (the "License");

# ------ 20 Jun 2012 ------ #
# Create Database
# Standards - stores hierarchical education data for imported standards
curl -X PUT http://localhost:5984/standards

# Create views
# TODO standard-grade-parent's map fn -> multiline format for readibility
curl -X PUT http://localhost:5984/standards/_design/nodes --data '
{
  "_id":"_design/nodes",
  "language": "javascript",
  "views":
  {
    "categories": {
	"map": "function(doc) { if (doc.standard === true) emit(doc.categoryName, doc.id); }",
	"reduce": "function(keys, values, rereduce) { return values; }"
    },
    "standards": {
	"map": "function(doc) { if (doc.standard === true) emit([doc.categoryName, doc.id], doc._id); }"
    },
    "parent-grade": {
	"map": "function(doc) { var gradeInfo, grade; if(doc.standard === true || doc.category === true) return; for (gradeInfo = 0; gradeInfo < doc.dcterms_educationLevel.length; gradeInfo++) { grade = doc.dcterms_educationLevel[gradeInfo].prefLabel; emit([doc.parent, grade], doc); }}"
    }
  }
}'
