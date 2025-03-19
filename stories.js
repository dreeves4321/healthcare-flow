// Function to load stories from JSON file
async function loadStories() {
    try {
        const response = await fetch('data/stories.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.stories;
    } catch (error) {
        console.error('Error loading stories:', error);
        return [];
    }
}

// Function to create tab selector
function createTabSelector(stories) {
    const selector = d3.select('#stories-selector');
    
    // Create tabs container
    const tabsContainer = selector.append('div')
        .attr('class', 'tabs-container');
    
    // Create tabs
    const tabs = tabsContainer.selectAll('button')
        .data(stories)
        .enter()
        .append('button')
        .attr('class', 'tab-button')
        .text(d => d.title)
        .on('click', function(event, d) {
            // Remove active class from all tabs
            tabsContainer.selectAll('.tab-button')
                .classed('active', false);
            
            // Add active class to clicked tab
            d3.select(this)
                .classed('active', true);
            
            // Update details
            updateDetails(d);
            
            // Update Sankey diagram
            updateSankeyHighlight(d.nodes);
        });
    
    // Set first tab as active by default
    tabsContainer.select('.tab-button')
        .classed('active', true);
}

// Function to update details container
function updateDetails(story) {
    const detailsContainer = d3.select('#story-container');
    
    // Clear existing content
    detailsContainer.html('');
    
    // Add title and description
    detailsContainer.append('div')
        .html(`
            <h2>${story.title}</h2>
            <p>${story.description}</p>
        `);
    
    // Add charts if they exist
    if (story.barCharts && story.barCharts.length > 0) {
        updateStoryCharts(story);
    }
}

// Function to update Sankey diagram highlighting
function updateSankeyHighlight(nodeIndices) {
    // Convert 1-based indices to 0-based for the Sankey diagram
    const zeroBasedIndices = nodeIndices.map(i => i - 1);
    
    // Use the highlightNodes function from sankey.js
    highlightNodes(zeroBasedIndices);
}

// Initialize stories functionality
async function initializeStories() {
    const stories = await loadStories();
    if (stories.length > 0) {
        createTabSelector(stories);
        // Set initial state
        updateDetails(stories[0]);
        updateSankeyHighlight(stories[0].nodes);
    }
}

// Remove the event listener since it's now handled in index.html 