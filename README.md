

# SQLite Visualizer

SQLite Visualizer is a React-based web application that allows users to upload, view, and manipulate SQLite database files. This tool provides an intuitive interface for exploring database structures, executing SQL queries, and visualizing results.
[demo](https://tracy4528.github.io/sqlite_visualize/)


## Features
- Simple drag-and-drop interface for uploading SQLite database files (.sqlite, .db, or .sqlite3)
- Quick browsing of tables and views within the database
- User-friendly data filtering without SQL knowledge


## Installation

Ensure you have Node.js and npm installed. Then, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/your-username/sqlite-visualizer.git
   cd sqlite-visualizer
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Development

To run the application in development mode:

```
npm start
```

This will start the development server at http://localhost:3000.

## Building

To deploy the application to GitHub Pages:

```
npm run deploy
```

This command will build the application and deploy it to the 'gh-pages' branch of your GitHub repository, making it accessible via GitHub Pages.

## Usage

1. After launching the app, click the "Choose File" button to upload a SQLite database file (.sqlite, .db, or .sqlite3).
2. Use the dropdown menu to select a table or view to inspect.
3. Use the search boxes to filter data in specific columns.
4. Click on column headers to sort.
5. Drag column borders to adjust column widths.
6. Use the "Export Database" button to export the modified database.

## Tech Stack

- React
- SQL.js (for handling SQLite databases in the browser)
- The only differences with a traditional create-react-app application are :
 - The usage of [craco](https://github.com/gsoft-inc/craco) to allow providing a custom [webpack](https://webpack.js.org/) configuration
 - a small custom webpack configuration in [`craco.config.js`](./craco.config.js) to copy the wasm module from sql.js to the distributed assets

 Note that you should make sure your server serves `.wasm` files with the right mimetype, that is: `application/wasm`. Otherwise, you'll see the following error: `TypeError: Response has unsupported MIME type`