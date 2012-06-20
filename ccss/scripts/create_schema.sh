#!/bin/sh

# ------ 20 Jun 2012 ------ #
# Create Database
# Categories - Stores info about categories
curl -X PUT http://localhost:5984/categories
# Standards - stores hierarchical education data for imported standards
curl -X PUT http://localhost:5984/standards

# Create views
# Create category views
curl -X PUT http://localhost:5984/categories/_design/categories --data '
{
  "_id":"_design/categories",
  "language": "javascript",
  "views":
  {
    "categories": {
	"map": "function(doc) { emit(doc.category, doc.standard); }",
	"reduce": "function(keys, values, rereduce) { return values; }"
    }
  }
}'

# Create views for standards
# TODO standard-grade-parent's map fn -> multiline format for readibility
curl -X PUT http://localhost:5984/standards/_design/nodes --data '
{
  "_id":"_design/nodes",
  "language": "javascript",
  "views":
  {
    "standard-grade-parent": {
	"map": "function(doc) { var gradeInfo, grade; for (gradeInfo = 0; gradeInfo < doc.dcterms_educationLevel.length; gradeInfo++) { grade = doc.dcterms_educationLevel[gradeInfo].prefLabel; emit([doc.standard, grade, doc.parent], doc); }}"
    },
    "standards": {
	"map": "function(doc) { emit(doc.standard, 1); }",
	"reduce": "function(keys, values, rereduce) { return sum(values); }"
    }
  }
}'
