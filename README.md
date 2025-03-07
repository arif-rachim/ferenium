# Ferenium

Ferenium is a rapid application development (RAD) framework designed to accelerate the creation of business applications, particularly ERP (Enterprise Resource Planning) systems. Built on React, it provides a visual drag-and-drop interface for designing application interfaces, along with a powerful signal-based system for connecting components and data.

## Key Features

*   **Visual Drag-and-Drop Interface:** Design application UIs intuitively using a drag-and-drop approach with built-in components.
*   **Component-Based Architecture:** Build applications using reusable UI components, with the flexibility to create custom components.
*   **Signal-Based Logic:** Connect components and data using signals and effects for reactive programming.
*   **JSON-Based Application Definition:** Outputs a JSON file that captures the application structure, including UI elements, data connections, and configurations.
*   **Ferenium Viewer:** Run and interact with your applications by loading the generated JSON file in the Ferenium Viewer.
*   **Focus on Productivity:** Designed to simplify the development process and boost productivity for enterprise application development.
*   **Database Integration:** Support for SQLite database integration, allowing direct manipulation and querying of data within applications.

## Getting Started

To get started with Ferenium, you'll need to:

1.  **Clone the Repository:** Clone the Ferenium repository from GitHub to your local machine.
2.  **Install Dependencies:** Navigate to the project directory and run `npm install` to install all required dependencies.
3.  **Start the Development Server:** Run `npm run dev` to start the development server.
4.  **Explore the Application:** Open your browser and visit the provided URL to access the Ferenium.

## How It Works

Ferenium provides two modes: Designer and Viewer:

*   **Designer Mode:**
    *   Use a drag-and-drop interface to construct UI layouts.
    *   Configure data connections, properties, and events for each component.
    *   Define variables (state, computed, and effects), queries, fetchers, and callables.
    *   Create reusable components by adding a custom element from default components.
    *   Set styles using property editor and configure layout behaviors.
    *   Use Monaco code editor to define and modify the application's logic, schema, and data flow.

*   **Viewer Mode:**
    *   View and interact with the designed application by loading the generated JSON file.
    *   This mode interprets the JSON and dynamically renders the UI and applies the defined logic.
    *   Use the navigation function to switch between pages.
    *   Interact with different form elements such as text, number, radio buttons and checkboxes.

The development process in Ferenium generally involves:

1.  **Designing the UI:** Using the Designer mode to drag and drop components, customize their properties and styles, and build the desired user interface.

2.  **Defining Logic:** Using the Monaco editor to define signal based logics for variables (state, computed and effects), fetchers, and callables that respond to events and user interactions. You'll also define the schema for those to be used by component's data and callbacks.

3.  **Integrating Data:** Using Database Panel to integrate SQLite database, create and manipulate data and make query by using Query Panel, using fetcher panel to pull external API data.

4.  **Exporting Application:** Saving the application as a JSON file.

5.  **Viewing Application:** Loading the JSON file in the Viewer mode to test and use the developed application.

## Technologies Used

*   **React:** For building the user interface and components.
*   **TypeScript:** For type-safe development.
*   **React-Hook-Signal:** For managing application state and reactive behavior.
*   **Zod:** For data validation.
*   **Monaco Editor:** For code editing within the interface.
*   **Sql.js:** For SQLite database functionalities.

## Contributing

Contributions are welcome! Please feel free to fork the repository, create a branch for your feature, and submit a pull request.

## License
MIT License
