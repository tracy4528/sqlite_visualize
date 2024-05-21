
This is a template repository demonstrating the use of sql.js and react.

The only differences with a traditional create-react-app application are :
 - The usage of [craco](https://github.com/gsoft-inc/craco) to allow providing a custom [webpack](https://webpack.js.org/) configuration
 - a small custom webpack configuration in [`craco.config.js`](./craco.config.js) to copy the wasm module from sql.js to the distributed assets

 Note that you should make sure your server serves `.wasm` files with the right mimetype, that is: `application/wasm`. Otherwise, you'll see the following error: `TypeError: Response has unsupported MIME type`
 

 [demo](https://tracy4528.github.io/sqlite_visualize/)

