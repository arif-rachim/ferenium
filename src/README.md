# Architecture 

Here's a breakdown of its directory structure and key areas:

*   **`src/`**: Contains all the application source code.
    *   **`core/`**: Includes core framework components and utilities.
        *   `components/`: Reusable UI building blocks like labels, icons, and modals.
        *   `utils/`: General utility functions and helpers, including utilities for loading, data manipulation, and error handling.
        *   `hooks/`: Custom hooks for shared logic, especially for modal management and application state updates.
        *   `modal/`: Modal component and context.
        *   `style/`: Global styles, shared UI elements, and a consistent theme.
    *   **`app/`**: Contains the main application setup, designers, and viewers.
        *   `viewer/`: Components for viewing the application, including context setup and rendering.
        *    `viewer/context/`: Contains contexts used for application viewing.
        *   `designer/`: Components for designing and building the application.
            *   `builder/`: Core design components like container swapping and addition.
            *   `panels/`: Various configuration panels.
                *   `database/`: Panels for database interactions and table management.
                *   `design/`: Panels for design and layout settings, including drop zones.
                *   `elements/`: Panels for available UI elements.
                *   `errors/`: Panels for displaying application errors.
                *   `fetchers/`: Panels for configuring API fetchers.
                *   `queries/`: Panels for constructing database queries.
                *   `pages/`: Panels for managing application pages.
                *   `package/`: Panels for exporting and importing the whole project.
                *   `properties/`: Panels for managing component properties.
                *   `style/`: Panels for UI style configurations.
                *   `variables/`: Panels for setting up variables.
                *   `callable/`: Panels for managing application callables.
            *   `components/`: Components specific to the designer interface.
            *   `components/empty-component`: Empty component for placeholder.
            *   `hooks/`: Hooks specific to designer functionalities.
            *   `editor/`: Editor functionalities.
            *   `variable-initialization/`: Logic for initializing and managing application variables.
        *   `data/`: Data display and handling components, like tables and page selectors.
        *   `form/`: Reusable form components.
            *  `input/`: Generic and specific input components
                * `date/`: Date and time related inputs.
                * `checkbox/`: Checkbox input component
                * `radio/`: Radio button input component
                * `select/`: Select dropdown input component.
                * `text/`: Text input component
            *   `container/`: Layout components for forms.
        *   `button/`: Button components.
    *   **`editor/`**: Includes code for the Monaco Editor integration and related files.
        * `zod-definition.txt`: Typescript definitions for Zod
        * `signal-definition.txt`: Typescript definitions for Signals
        * `InitEditor.ts`: Contains configurations for monaco editor.
    *   **`main.tsx`**: Entry point of the application.
