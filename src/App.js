import React, { useState, useEffect } from "react";
import "./styles.css";
import initSqlJs from "sql.js";
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";

export default function App() {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("SELECT * FROM Album;");
  const [tables, setTables] = useState([]);
  const [searchTerms, setSearchTerms] = useState({});

  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const wasmFileLocation = () => sqlWasm;
        const SQL = await initSqlJs({ locateFile: wasmFileLocation });

        const response = await fetch(`${process.env.PUBLIC_URL}/Chinook_Sqlite_rev.sqlite`);
        if (!response.ok) throw new Error("Network response was not ok");

        const buffer = await response.arrayBuffer();
        const dbInstance = new SQL.Database(new Uint8Array(buffer));

        setDb(dbInstance);
        fetchTables(dbInstance);
      } catch (err) {
        setError(err);
      }
    };

    loadDatabase();
  }, []);

  const fetchTables = (dbInstance) => {
    const res = dbInstance.exec("SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view');");
    setTables(res[0].values.map(row => ({ name: row[0], type: row[1] })));
  };

  if (error) return <pre>{error.toString()}</pre>;
  else if (!db) return <pre>Loading...</pre>;
  else return <SQLRepl db={db} query={query} setQuery={setQuery} tables={tables} searchTerms={searchTerms} setSearchTerms={setSearchTerms} />;
}

function SQLRepl({ db, query, setQuery, tables, searchTerms, setSearchTerms }) {
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    exec(query);
  }, [query]);

  function exec(sql) {
    try {
      setResults(db.exec(sql));
      setError(null);
    } catch (err) {
      setError(err);
      setResults([]);
    }
  }

  function handleTableChange(event) {
    const selectedTable = event.target.value;
    if (selectedTable) {
      setQuery(`SELECT * FROM ${selectedTable};`);
      setSearchTerms({});
    }
  }

  function handleSearchChange(column, event) {
    const newSearchTerms = { ...searchTerms, [column]: event.target.value };
    setSearchTerms(newSearchTerms);
    const searchConditions = Object.entries(newSearchTerms)
      .filter(([, value]) => value)
      .map(([col, val]) => `${col} LIKE '%${val}%'`)
      .join(" AND ");
    setQuery(`SELECT * FROM Album${searchConditions ? ` WHERE ${searchConditions}` : ''};`);
  }

  return (
    <div className="App">
      <h1>SQLite visualize</h1>

      <select onChange={handleTableChange}>
        <option value="">Select a table or view</option>
        {tables.map((table, i) => (
          <option key={i} value={table.name}>
            {table.name} ({table.type})
          </option>
        ))}
      </select>

      <pre className="error">{(error || "").toString()}</pre>

      <pre>
        {results.map(({ columns, values }, i) => (
          <ResultsTable key={i} columns={columns} values={values} searchTerms={searchTerms} handleSearchChange={handleSearchChange} />
        ))}
      </pre>
    </div>
  );
}

function ResultsTable({ columns, values, searchTerms, handleSearchChange }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const sortedValues = React.useMemo(() => {
    let sortableValues = [...values];
    if (sortConfig.key !== null) {
      sortableValues.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableValues;
  }, [values, sortConfig]);

  const requestSort = key => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div>
      <table>
        <thead>
          <tr>
            {columns.map((columnName, i) => (
              <th key={i} onClick={() => requestSort(i)}>
                {columnName}
                {sortConfig.key === i ? (sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽') : null}
                <input
                  type="text"
                  value={searchTerms[columnName] || ''}
                  onChange={(event) => handleSearchChange(columnName, event)}
                  placeholder={`Search ${columnName}`}
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedValues.map((row, i) => (
            <tr key={i}>
              {row.map((value, i) => (
                <td key={i}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
