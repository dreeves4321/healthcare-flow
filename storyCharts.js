// Function to create stacked bar chart for a story
function createStoryBarChart(container, story, data) {
    // Clear any existing charts
    container.selectAll("*").remove();

    // Use the correct data structure
    const nodes = data.originalNodes;
    const links = data.originalLinks;

    // Initialize variables at the top
    const rightPadding = 0;

    // Create a container for each chart
    story.barCharts.forEach((chart, index) => {
        // Create a container for this specific chart
        const chartContainer = container.append("div")
            .attr("class", "chart-container")
            
        // Get the container dimensions
        const containerWidth = chartContainer.node().getBoundingClientRect().width;
        const margin = { top: 10, right: rightPadding, bottom: 10, left: 0 };
        const width = containerWidth - margin.left - margin.right;
        const height = 100;
        const barHeight = 15;
        const gap = 2;
        const vgap = 5;

        // Create SVG
        const svg = chartContainer.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Process data for this chart
        const chartData = chart.sections.map(section => {
            
            // Calculate total flow based on direction
            let totalFlow = 0;
            if (chart.direction === "in") {
                // Get all nodes in this section
                const sectionNodes = section.nodes.map(i => nodes[i]);
                const incomingLinks = links.filter(link => 
                    sectionNodes.some(node => link.target === node.id)
                );
                totalFlow = d3.sum(incomingLinks, link => link.value);
            } else if (chart.direction === "out") {
                // Get all nodes in this section
                const sectionNodes = section.nodes.map(i => nodes[i]);
                const outgoingLinks = links.filter(link => 
                    sectionNodes.some(node => link.source === node.id)
                );
                totalFlow = d3.sum(outgoingLinks, link => link.value);
            } else if (chart.direction === "flow") {
                // section.nodes contains link indices, not node indices
                const sectionLinks = section.nodes.map(i => links[i]);
                totalFlow = d3.sum(sectionLinks, link => link.value);
            }

            return {
                label: section.label,
                value: totalFlow
            };
        });

        // Calculate total for percentages
        const total = d3.sum(chartData, d => d.value);

        // Format data for stacked bar
        let cumulative = 0;
        const formattedData = chartData.map(d => {
            const percent = (d.value / total) * 100;
            const result = {
                value: d.value,
                cumulative: cumulative,
                label: d.label,
                percent: percent
            };
            cumulative += d.value;
            return result;
        });

        // Create scales
        const xscale = d3.scaleLinear()
            .domain([0, total])
            .range([0, width]);

        // Add bars
        const bars = svg.selectAll("g")
            .data(formattedData)
            .join("g")
            .attr("class", "bar-group");

        // Add rectangles
        bars.append("rect")
            .attr("class", (d, i) => `bar-section section-${i % 3}`)
            .attr("x", d => xscale(d.cumulative))
            .attr("y", margin.top)
            .attr("width", d => xscale(d.value) - gap)
            .attr("height", barHeight);

        // Add labels below each section
        const textHeight = 18;
        bars.append("text")
            .attr("class", "section-label")
            .attr("x", d => xscale(d.cumulative) + vgap)
            .attr("y", margin.top + barHeight + textHeight + vgap) //set baseline of text
            .attr("text-anchor", "start")
            .text(d => `${d.percent.toFixed(1)}% - ${d.label}`);
        
        // Add a line dropping down to each label
        const connectorLines = bars.append("rect")
            .attr("class", (d, i) => `bar-section section-${i % 3}`)
            .attr("x", d => xscale(d.cumulative))
            .attr("y", margin.top)
            .attr("width", 1)
            .attr("height", barHeight + vgap + textHeight + 2)
            .attr("fill", "black");

        // Walk backward through labels and check for overlap and hanging off end. if they overlap, move the label down
        // Get all text elements and convert to array
        const labels = bars.selectAll("text").nodes();
        
        // Walk backwards through labels starting from second-to-last
        for (let i = labels.length - 2; i >= 0; i--) {
            const currentLabel = labels[i];
            const nextLabel = labels[i + 1];
   
            // Get bounding boxes
            const currentBox = currentLabel.getBBox();
            let nextBox = nextLabel.getBBox();
            
            //check if the label is hanging off the end of the chart
            const overlap = nextBox.x + nextBox.width - width;
            if (overlap > 0) {
                // Move current label down by 15px
                const currentY = parseFloat(d3.select(nextLabel).attr("y"));
                d3.select(nextLabel).attr("y", currentY + textHeight + vgap);
                // move the next label left so it doesn't hang off the end of the chart
                d3.select(nextLabel).attr("x", nextBox.x - overlap);
                nextBox = nextLabel.getBBox();
            }
            
            
            
            // Check if current label's right edge overlaps next label's left edge
            if ((currentBox.x + currentBox.width) > nextBox.x) {
                // Move current label down by 15px
                const currentY = parseFloat(d3.select(currentLabel).attr("y"));
                const nextY = parseFloat(d3.select(nextLabel).attr("y"));
                d3.select(currentLabel).attr("y", nextY + textHeight + vgap);

                // Move the connector line down by the same amount
                const connectorLine = connectorLines.nodes()[i];
                d3.select(connectorLine)
                    .attr("height", nextY + textHeight + vgap + 2 - margin.top);              
            }
        }
        // Set SVG to encompass contents
        const bbox = svg.node().getBBox();
        const newHeight = bbox.height + margin.top + margin.bottom;
        // Update the SVG height
        svg.node().parentNode.setAttribute("height", newHeight);    
    
    });

    // Set SVG to encompass contents
}

// Function to update the story charts when a story is selected
function updateStoryCharts(story) {
    const container = d3.select('#story-container')
        .append('div')
        .attr('class', 'story-charts');
    
    if (story.barCharts && story.barCharts.length > 0) {
        createStoryBarChart(container, story, window.healthcareData);
    }
}

// Export functions for use in other files
window.updateStoryCharts = updateStoryCharts; 