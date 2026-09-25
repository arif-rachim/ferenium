# Ferenium

Ferenium is a browser-based rapid application development (RAD) tool for building business applications, particularly the form- and grid-heavy screens of ERP systems, with little hand-written code. It has two modes in one app: a Designer where you drag built-in components (containers, forms, inputs, date pickers, selects, buttons, query grids and more) onto pages, set their properties and styles, and wire them together with reactive signals (state, computed values and effects) written in an embedded Monaco TypeScript editor; and a Viewer that interprets the resulting JSON application definition and renders it live. Data comes from a SQLite database that runs in the browser through sql.js and is stored in the Origin Private File System, from saved SQL queries, and from "fetchers" that call external HTTP APIs. It is written in React 18 and TypeScript with Zod schemas and the react-hook-signal library, is built with Vite, and can run inside an Electron shell that provides file storage. It is an early-stage personal project (package version 0.0.0) last worked on in March 2025.

> Status: early development, not actively maintained since March 2025.

## Key Features

*   **Visual drag-and-drop interface:** design application UIs by dragging built-in components onto a page and rearranging them in a layout tree.
*   **Built-in components:** container, title box, form, input (text, number, password, textarea), checkbox, radio, select, date, date-time, time, date range, icon, button, title, query grid (paged data table) and fault-status icon.
*   **Reusable components:** any page can be embedded in another page as a "Component" element, with its state variables exposed as properties.
*   **Signal-based logic:** connect components and data with state, computed and effect variables for reactive programming; property values and callbacks are formulas written in TypeScript.
*   **Typed schemas:** variables, queries, fetchers and callables declare Zod schemas, which also drive type checking and autocompletion in the Monaco editor.
*   **Database integration:** SQLite through sql.js. Import a `.db` or `.sqlite` file, view and edit tables, write parameterised queries, and bind query results to grids.
*   **External APIs:** fetchers call HTTP endpoints with configurable method, headers and body.
*   **JSON application definition:** the whole application (pages, components, variables, queries, fetchers, callables, tables) is one JSON object that can be exported as a ZIP and imported again.
*   **Error panel:** validation and runtime errors from formulas are collected in one place.

## Tech stack

React 18 · TypeScript · Vite 5 · react-hook-signal · Zod · Monaco Editor · sql.js (SQLite in WebAssembly) · dnd-kit · JSZip · framer-motion

## Getting started

Prerequisites: Node.js and npm, and a browser with Origin Private File System support (current Chrome, Edge, Firefox or Safari).

```bash
git clone https://github.com/arif-rachim/ferenium.git
cd ferenium
npm install
npm run dev        # Vite dev server
npm run build      # type-check with tsc, then build to dist/
npm run lint       # ESLint
npm run preview    # serve the production build
```

The app opens in Viewer mode. Press **F10** to switch between Viewer and Designer, **F5** to reload, and **F12** to open developer tools when running inside the Electron shell.

## How it works

Ferenium has two modes, Designer and Viewer:

*   **Designer mode** (dashboard of panels: Pages, Components, Layout Tree, Properties, Styles, Variables, Callables, Fetchers, Queries, Database, Errors, Package):
    *   Use a drag-and-drop interface to construct UI layouts.
    *   Configure data connections, properties, and events for each component.
    *   Define variables (state, computed, and effects), queries, fetchers, and callables.
    *   Create reusable components by embedding one page inside another.
    *   Set styles with the style editor and configure layout behaviour.
    *   Use the Monaco code editor to define the application's logic, schemas and data flow.

*   **Viewer mode:**
    *   Renders the current application definition and applies its logic.
    *   Use the navigation function to switch between pages.
    *   Interact with form elements such as text, number, date, select, radio buttons and checkboxes.

The development process generally involves:

1.  **Designing the UI:** use the Designer to drag and drop components, customise their properties and styles, and build the user interface.
2.  **Defining logic:** use the Monaco editor to write signal-based logic for variables (state, computed and effects), fetchers and callables that respond to events and user interactions, and define the schemas used by component data and callbacks.
3.  **Integrating data:** use the Database panel to load or create a SQLite database, the Queries panel to write queries against it, and the Fetchers panel to pull data from external APIs.
4.  **Saving and sharing:** the definition is saved automatically; the Package panel exports it as `app-builder.zip` (containing `data.json`) and imports it again.
5.  **Running:** switch back to Viewer mode (F10) to test and use the application.

### Storage

- The application definition is stored in `localStorage` under the `application` key.
- The SQLite database is stored as `database.db` in the browser's Origin Private File System.
- When the page runs inside an Electron shell that exposes `window.electronAPI` (`saveToFile`, `loadFromFile`, `deleteFile`, `openDevTools`), both are also written to files (`app-storage.json`, `database.db`) through that API. The Electron shell itself is not part of this repository.

## Project structure

```text
src/
  App.tsx          switches between AppDesigner and AppViewer (F10), loads the saved application
  app/designer/    Designer: panels, drag-and-drop builder, variable initialisation, default elements
  app/viewer/      Viewer: renders pages from the JSON definition
  app/data/        query grid, page selector and other data components
  app/form/        form and input components
  core/            shared components, hooks, modal system, styles and utilities
  editor/          Monaco setup and type definitions for signals and Zod
public/            sql.js WebAssembly build (sql-wasm.js, sql-wasm.wasm)
```

A more detailed directory breakdown is in [src/README.md](src/README.md).

## Contributing

Contributions are welcome! Please feel free to fork the repository, create a branch for your feature, and submit a pull request.

## License

MIT License. See [LICENSE](LICENSE).
