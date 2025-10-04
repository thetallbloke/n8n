# mssql-insert-mapper

Custom [n8n](https://n8n.io) community node for inserting rows into **SQL Server** with user-defined column mappings.

I wanted a way to insert data into a table using values from previous nodes, with the ability to define which columns to insert and their data types dynamically.

---

## Features

- Insert into any SQL Server table (schema-qualified if needed).
- Define **columns dynamically**:
  - Column name
  - SQL data type (with length/precision/scale where applicable)
  - Value (supports n8n expressions like `={{$json.firstName}}`)
- Safe, parameterized queries with the `mssql` driver.
- Optional transaction mode (all-or-nothing).
- Reuses built-in **Microsoft SQL** credentials in n8n.
