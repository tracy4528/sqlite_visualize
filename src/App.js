import React, { useState, useEffect } from "react";
import "./styles.css";
import initSqlJs from "sql.js";
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";

export default function App() {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("SELECT * FROM Album;");

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
      } catch (err) {
        setError(err);
      }
    };

    loadDatabase();
  }, []);

  if (error) return <pre>{error.toString()}</pre>;
  else if (!db) return <pre>Loading...</pre>;
  else return <SQLRepl db={db} query={query} setQuery={setQuery} />;
}

function SQLRepl({ db, query, setQuery }) {
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

  function handleSearchChange(event) {
    const keyword = event.target.value;
    if (keyword) {
      setQuery(`SELECT * FROM Album WHERE Title LIKE '%${keyword}%';`);
    } else {
      setQuery("SELECT * FROM Album;");
    }
  }

  return (
    <div className="App">
      <h1>SQLite visualize</h1>
      <input
        type="text"
        placeholder="Search by title"
        onChange={handleSearchChange}
      />


      <pre className="error">{(error || "").toString()}</pre>

      <pre>
        {results.map(({ columns, values }, i) => (
          <ResultsTable key={i} columns={columns} values={values} />
        ))}
      </pre>
    </div>
  );
}

function ResultsTable({ columns, values }) {
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
    <table>
      <thead>
        <tr>
          {columns.map((columnName, i) => (
            <th key={i} onClick={() => requestSort(i)}>
              {columnName}
              {sortConfig.key === i ? (sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽') : null}
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
  );
}
