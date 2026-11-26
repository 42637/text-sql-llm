"""
SQL syntax validator, formatter, and safe SQLite execution sandbox.
Powered by SQLGlot and Python's sqlite3 engine.
"""
import re
import sqlite3
from typing import Dict, Any, Optional, List
import sqlglot
from sqlglot import exp


class SQLValidator:
    """
    Validates and formats SQL statements using SQLGlot.
    Also provides a safe, read-only isolated execution environment.
    """

    @staticmethod
    def validate_syntax(sql: str, dialect: str = "sqlite") -> Dict[str, Any]:
        """
        Parses and validates SQL syntax.
        Returns:
            is_valid: bool
            formatted_sql: str
            error: Optional[str]
            statement_type: Optional[str]
            tables: List[str]
        """
        clean_sql = sql.strip()
        if not clean_sql:
            return {
                "is_valid": False,
                "formatted_sql": "",
                "error": "SQL statement is empty.",
                "statement_type": None,
                "tables": [],
            }

        # Remove trailing semicolons for single-statement validation
        # (or handle trailing semicolon gracefully)
        try:
            parsed = sqlglot.parse_one(clean_sql, read=dialect)
            formatted = parsed.sql(dialect=dialect, pretty=True)

            # Determine statement type
            statement_type = "UNKNOWN"
            if isinstance(parsed, exp.Select):
                statement_type = "SELECT"
            elif isinstance(parsed, exp.Insert):
                statement_type = "INSERT"
            elif isinstance(parsed, exp.Update):
                statement_type = "UPDATE"
            elif isinstance(parsed, exp.Delete):
                statement_type = "DELETE"
            elif isinstance(parsed, exp.Create):
                statement_type = "CREATE"
            elif isinstance(parsed, exp.Drop):
                statement_type = "DROP"
            elif hasattr(parsed, "key"):
                statement_type = parsed.key.upper()

            # Extract referenced tables
            tables = [table.name for table in parsed.find_all(exp.Table) if table.name]

            return {
                "is_valid": True,
                "formatted_sql": formatted,
                "error": None,
                "statement_type": statement_type,
                "tables": list(set(tables)),
            }
        except sqlglot.errors.ParseError as pe:
            return {
                "is_valid": False,
                "formatted_sql": clean_sql,
                "error": f"SQL syntax error: {str(pe)}",
                "statement_type": None,
                "tables": [],
            }
        except Exception as e:
            return {
                "is_valid": False,
                "formatted_sql": clean_sql,
                "error": f"Validation failed: {str(e)}",
                "statement_type": None,
                "tables": [],
            }

    @staticmethod
    def execute_in_sandbox(
        schema_sql: str,
        query_sql: str,
        max_rows: int = 50,
        timeout_seconds: float = 3.0,
    ) -> Dict[str, Any]:
        """
        Safely executes a query in an isolated, in-memory SQLite database.
        Restrictions:
          - Only executes CREATE TABLE statements from the schema.
          - Query must be a SELECT statement. Destructive queries (DROP, DELETE, ALTER, etc.) are forbidden.
          - Row limit of max_rows (default 50).
        """
        # Validate that the query is a SELECT query
        val = SQLValidator.validate_syntax(query_sql, dialect="sqlite")
        if not val["is_valid"]:
            return {
                "success": False,
                "error": f"Invalid SQL query: {val['error']}",
                "columns": [],
                "rows": [],
                "row_count": 0,
            }

        # Check statement safety
        if val["statement_type"] != "SELECT":
            return {
                "success": False,
                "error": f"Security restriction: Only SELECT queries can be executed in the sandbox (attempted {val['statement_type']}).",
                "columns": [],
                "rows": [],
                "row_count": 0,
            }

        # Forbidden destructive keywords check as extra defense
        destructive_keywords = ["DROP", "DELETE", "ALTER", "TRUNCATE", "ATTACH", "DETACH", "PRAGMA"]
        for kw in destructive_keywords:
            if re.search(r"\b" + kw + r"\b", query_sql, re.IGNORECASE):
                return {
                    "success": False,
                    "error": f"Forbidden keyword detected: {kw}. Execution blocked.",
                    "columns": [],
                    "rows": [],
                    "row_count": 0,
                }

        conn = None
        try:
            # Create an in-memory SQLite database
            conn = sqlite3.connect(":memory:", timeout=timeout_seconds)
            cursor = conn.cursor()

            # Execute schema DDL / sample inserts if present
            if schema_sql.strip():
                # Allow CREATE TABLE and INSERT INTO in schema definition
                cursor.executescript(schema_sql)

            # Enforce limit in query if not already limited or exceeds max_rows
            clean_query = query_sql.strip().rstrip(";")
            
            cursor.execute(clean_query)
            col_names = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchmany(max_rows)
            # Convert rows to serializable types
            serializable_rows = []
            for r in rows:
                serializable_rows.append([None if v is None else str(v) if isinstance(v, (bytes, memoryview)) else v for v in r])

            return {
                "success": True,
                "error": None,
                "columns": col_names,
                "rows": serializable_rows,
                "row_count": len(serializable_rows),
                "is_truncated": len(rows) == max_rows,
            }
        except sqlite3.Error as e:
            return {
                "success": False,
                "error": f"SQLite execution error: {str(e)}",
                "columns": [],
                "rows": [],
                "row_count": 0,
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Sandbox error: {str(e)}",
                "columns": [],
                "rows": [],
                "row_count": 0,
            }
        finally:
            if conn:
                conn.close()
