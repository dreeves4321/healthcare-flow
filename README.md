# Healthcare Money Flow Visualization

This project provides an interactive visualization of how money flows through the American healthcare system using a Sankey diagram. The visualization helps users understand the complex relationships between different healthcare sectors and their financial interactions.

## Features

- Interactive Sankey diagram showing money flow between healthcare sectors
- Hover effects to display detailed information about each flow
- Responsive design that works on different screen sizes
- Clean, modern user interface
- Story-based navigation to explore different aspects of healthcare spending
- Interactive bar charts for detailed analysis
- Bibliography section with references and notes

## Technologies Used

- HTML5
- CSS3
- JavaScript
- D3.js (v7)
- D3-Sankey (v0.12.3)

## Project Structure

```
healthcare-flow/
├── data/
│   ├── nodes.json      # Node data for the Sankey diagram
│   ├── links.json      # Link data for the Sankey diagram
│   ├── groups.json     # Group definitions for nodes
│   ├── stories.json    # Story definitions and navigation
│   └── bibliography.json # Bibliography data
├── index.html          # Main HTML file
├── styles.css         # CSS styles
├── data.js           # Data loading and processing
├── sankey.js         # Sankey diagram visualization
├── stories.js        # Story navigation and display
├── storyCharts.js    # Bar chart visualization
└── resize.js         # Window resize handling
```

## Local Development

1. Clone this repository:
   ```bash
   git clone https://github.com/[username]/healthcare-flow.git
   cd healthcare-flow
   ```

2. Run a local server (required for loading JSON files):
   ```bash
   # Using Python 3
   python3 -m http.server
   
   # Or using Node.js
   npx serve
   ```

3. Open your browser and navigate to:
   - Python: `http://localhost:8000`
   - Node.js: `http://localhost:3000`

## Deployment to GitHub Pages

1. Push your code to a GitHub repository

2. Enable GitHub Pages:
   - Go to repository Settings
   - Scroll to "GitHub Pages" section
   - Select source branch (main or gh-pages)
   - Click Save

3. Your site will be available at:
   `https://[username].github.io/healthcare-flow`

## Data Structure

The visualization uses several JSON files:
- `nodes.json`: Represents different healthcare sectors
- `links.json`: Represents the money flow between sectors
- `groups.json`: Defines node groupings for hierarchical view
- `stories.json`: Contains story definitions and navigation
- `bibliography.json`: Contains references and notes

## Customization

To modify the visualization:
1. Edit the data in the JSON files in the `data/` directory
2. Adjust styling in `styles.css`
3. Modify the visualization logic in `sankey.js`
4. Update stories in `stories.json`
5. Add or modify references in `bibliography.json`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for your own purposes. 