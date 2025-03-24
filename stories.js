// Global variable to track selected story
window.selectedStory = null;


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
        .text(d => d.label)
        .on('click', function(event, d) {
            // Remove active class from all tabs
            tabsContainer.selectAll('.tab-button')
                .classed('active', false);
            
            // Add active class to clicked tab
            d3.select(this)
                .classed('active', true);
            
            // Update selected story
            selectStory(d);
        });
    
    // Set first tab as active by default
    tabsContainer.select('.tab-button')
        .classed('active', true);
}

// funciton to select a story
function selectStory(story) {
    window.selectedStory = story;
    updateDetails(story);
    updateSankeyHighlight(story.nodes);
}
// Export functions for use in other files
window.selectStory = selectStory;


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
    // Use the highlightNodes function from sankey.js
    highlightNodes(nodeIndices);
}

// Initialize stories functionality
async function initializeStories() {
    const stories = await loadStories();
    
    if (stories.length > 0) {
        createTabSelector(stories);
        // Set initial state
        selectStory(stories[0]);
    }
}


// Function to update story charts
function updateStoryCharts(story) {
    const chartsContainer = d3.select('#story-charts');    
        
    // Clear existing charts
    chartsContainer.html('');
    
    // Create new charts
    story.barCharts.forEach(chart => {
        const chartContainer = chartsContainer.append('div')
            .attr('class', 'chart-container');
        
        // Create chart title
        chartContainer.append('h3')
            .text(chart.title);
        
        // Create chart sections
        chart.sections.forEach(section => {
            const sectionContainer = chartContainer.append('div')
                .attr('class', 'section-container');
            
            // Create section title
            sectionContainer.append('h4')
                .text(section.title);
            
            // Create section bars
            sectionContainer.selectAll('.bar')
                .data(section.nodes)
                .enter()
                .append('div')
                .attr('class', 'bar')
                .attr('style', d => `width: ${d.value * 100}%`);
            
            // Create section nodes
            sectionContainer.selectAll('.node')
                .data(section.nodes)
                .enter()
                .append('div')
                .attr('class', 'node')
                .text(d => d.label);
        });
    });

    // Update story charts
    story.barCharts.forEach(chart => {
        chart.sections.forEach(section => {
            section.nodes = section.nodes;  
        });
    });
} 