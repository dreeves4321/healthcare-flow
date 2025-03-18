// Function to handle window resize
function handleResize() {
    // Update Sankey diagram if it exists
    if (window.updateSankey) {
        window.updateSankey();
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