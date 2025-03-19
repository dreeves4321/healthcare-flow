// Function to handle window resize
function handleResize() {
    // Update Sankey diagram if it exists
    if (window.updateSankey && window.healthcareData) {
        const data = window.healthcareData;
        const nodes = data.isGrouped 
            ? [...data.originalNodes, ...data.groupNodes]
            : data.originalNodes;
        
        const links = data.isGrouped
            ? data.groupLinks
            : data.originalLinks;

        // Filter nodes if grouped
        const visibleNodes = data.isGrouped
            ? nodes.filter(d => d.isGroup || !data.groups.some(g => g.nodes.includes(d.index + 1)))
            : nodes;

        window.updateSankey({
            nodes: visibleNodes,
            links: links
        });
    }

    // Update story charts if they exist
    if (window.updateStoryCharts) {
        const currentStory = d3.select('.tab-button.active').datum();
        if (currentStory) {
            // Clear existing charts first
            d3.select('.story-charts').remove();
            // Then update with new charts
            window.updateStoryCharts(currentStory);
        }
    }
}

// Add resize listener with debounce
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 250);
}); 