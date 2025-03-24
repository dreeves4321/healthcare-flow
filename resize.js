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

    // Update story charts if they exist and a story is selected
    if (window.selectStory && window.selectedStory) {
        // Then update with new charts
        window.selectStory(window.selectedStory);
    }
}

// Add resize listener with debounce
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 250);
}); 