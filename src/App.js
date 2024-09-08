import React, { useState, useEffect, useRef } from 'react';
import "./styles.css";
import initSqlJs from "sql.js";
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";

export default function App() {
  const [db, setDb] = useState(null);
  const [SQL, setSQL] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [tables, setTables] = useState([]);
  const [searchTerms, setSearchTerms] = useState({});
  const [currentFileName, setCurrentFileName] = useState("");
  const [selectedTable, setSelectedTable] = useState("");

  useEffect(() => {
    initSqlJs({ locateFile: () => sqlWasm })
      .then(SQL => {
        setSQL(SQL);
        setDb(new SQL.Database());
      })
      .catch(err => setError(err));
  }, []);

  const loadDatabase = async (arrayBuffer, fileName) => {
    if (!SQL) {
      setError(new Error("SQL.js is not initialized"));
      return;
    }

    try {
      const newDb = new SQL.Database(new Uint8Array(arrayBuffer));
      setDb(newDb);
      setCurrentFileName(fileName);
      fetchTables(newDb);
      setSelectedTable("");
      setSearchTerms({});
    } catch (err) {
      setError(err);
    }
  };

  const fetchTables = (dbInstance) => {
    try {
      const res = dbInstance.exec("SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view');");
      if (res[0] && res[0].values) {
        setTables(res[0].values.map(row => ({ name: row[0], type: row[1] })));
      } else {
        setTables([]);
      }
    } catch (err) {
      setError(err);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => loadDatabase(e.target.result, file.name);
      reader.onerror = (e) => setError(e.target.error);
      reader.readAsArrayBuffer(file);
    }
  };

  const exportDatabase = () => {
    if (db) {
      try {
        const data = db.export();
        const blob = new Blob([data], { type: "application/x-sqlite3" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = currentFileName || "database.sqlite";
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err);
      }
    }
  };

  if (error) return <pre>{error.toString()}</pre>;
  if (!SQL || !db) return <pre>Loading...</pre>;

  return (
    <div className="App">
      <h1>SQLite visualize</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <input type="file" onChange={handleFileUpload} accept=".sqlite,.db,.sqlite3" />
          <button onClick={exportDatabase}>Export Database</button>
        </div>
        <div>
          <strong>Current File: </strong>{currentFileName || "No file loaded"}
        </div>
      </div>
      <SQLRepl 
        db={db} 
        query={query} 
        setQuery={setQuery} 
        tables={tables} 
        searchTerms={searchTerms} 
        setSearchTerms={setSearchTerms}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
      />
    </div>
  );
}


function SQLRepl({ db, query, setQuery, tables, searchTerms, setSearchTerms, selectedTable, setSelectedTable }) {
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (selectedTable) {
      exec(`SELECT * FROM ${selectedTable};`);
    }
  }, [selectedTable]);

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
    const newSelectedTable = event.target.value;
    setSelectedTable(newSelectedTable);
    setSearchTerms({});
  }

  function handleSearchChange(column, event) {
    const newSearchTerms = { ...searchTerms, [column]: event.target.value };
    setSearchTerms(newSearchTerms);
    const searchConditions = Object.entries(newSearchTerms)
      .filter(([, value]) => value)
      .map(([col, val]) => `${col} LIKE '%${val}%'`)
      .join(" AND ");
    const newQuery = `SELECT * FROM ${selectedTable}${searchConditions ? ` WHERE ${searchConditions}` : ''};`;
    setQuery(newQuery);
    exec(newQuery);
  }

  function clearSearch() {
    setSearchTerms({});
    const newQuery = `SELECT * FROM ${selectedTable};`;
    setQuery(newQuery);
    exec(newQuery);
  }

  return (
    <div>
      <select onChange={handleTableChange} value={selectedTable}>
        <option value="">Select a table or view</option>
        {tables.map((table, i) => (
          <option key={i} value={table.name}>
            {table.name} ({table.type})
          </option>
        ))}
      </select>

      {selectedTable && <button onClick={clearSearch}>Clear Search</button>}

      <pre className="error">{(error || "").toString()}</pre>

      {results.map(({ columns, values }, i) => (
        <ResultsTable 
          key={i} 
          columns={columns} 
          values={values} 
          searchTerms={searchTerms} 
          handleSearchChange={handleSearchChange} 
        />
      ))}
    </div>
  );
}

function ResultsTable({ columns, values, searchTerms, handleSearchChange }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [columnWidths, setColumnWidths] = useState({});
  const [resizing, setResizing] = useState(null);
  const tableRef = useRef(null);

  useEffect(() => {
    const initialWidths = {};
    columns.forEach((col, index) => {
      initialWidths[index] = 150; // 設置初始寬度為150px
    });
    setColumnWidths(initialWidths);
  }, [columns]);

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

  const handleMouseDown = (index, e) => {
    setResizing(index);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (resizing !== null) {
      const newWidth = e.clientX - tableRef.current.getBoundingClientRect().left;
      setColumnWidths(prev => ({
        ...prev,
        [resizing]: Math.max(50, newWidth) 
      }));
    }
  };

  const handleMouseUp = () => {
    setResizing(null);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table ref={tableRef} style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            {columns.map((columnName, i) => (
              <th key={i} style={{ position: 'relative', width: columnWidths[i] }}>
                <div onClick={() => requestSort(i)}>
                  {columnName}
                  {sortConfig.key === i ? (sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽') : null}
                </div>
                <input
                  type="text"
                  value={searchTerms[columnName] || ''}
                  onChange={(event) => handleSearchChange(columnName, event)}
                  placeholder={`Search ${columnName}`}
                  style={{ width: '100%' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '5px',
                    cursor: 'col-resize'
                  }}
                  onMouseDown={(e) => handleMouseDown(i, e)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedValues.map((row, i) => (
            <tr key={i}>
              {row.map((value, j) => (
                <td key={j} style={{ width: columnWidths[j], maxWidth: columnWidths[j], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

