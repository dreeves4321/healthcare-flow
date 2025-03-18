// Function to create stacked bar chart for a story
function createStoryBarChart(container, story, data) {
    // Clear any existing charts
    container.selectAll("*").remove();

    // Create a container for each chart
    story.barCharts.forEach((chart, index) => {
        // Create a container for this specific chart
        const chartContainer = container.append("div")
            .attr("class", "chart-container")
            .style("margin-bottom", "2rem");

        // Get the container dimensions
        const containerWidth = chartContainer.node().getBoundingClientRect().width;
        const margin = { top: 40, right: 0, bottom: 40, left: 0 };
        const width = containerWidth - margin.left - margin.right;
        const height = 100;
        const barHeight = 20;
        const gap = 2;

        // Create SVG
        const svg = chartContainer.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Process data for this chart
        const chartData = chart.sections.map(section => {
            // Get all nodes in this section
            const sectionNodes = section.nodes.map(i => data.nodes[i - 1]);
            
            // Calculate total flow based on direction
            let totalFlow = 0;
            if (chart.direction === "in") {
                const incomingLinks = data.links.filter(link => 
                    sectionNodes.some(node => link.target === node.id)
                );
                totalFlow = d3.sum(incomingLinks, link => link.value);
            } else {
                const outgoingLinks = data.links.filter(link => 
                    sectionNodes.some(node => link.source === node.id)
                );
                totalFlow = d3.sum(outgoingLinks, link => link.value);
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
            .attr("y", height/2 - barHeight/2)
            .attr("width", d => xscale(d.value) - gap)
            .attr("height", barHeight);

        // Add labels below each section
        bars.append("text")
            .attr("class", "section-label")
            .attr("x", d => xscale(d.cumulative) + 5)
            .attr("y", height/2 + barHeight/2 + 20)
            .attr("text-anchor", "start")
            .text(d => `${d.percent.toFixed(1)}% - ${d.label}`);
        
        // Add a line dropping down to each label
        const connectorLines = bars.append("rect")
            .attr("class", (d, i) => `bar-section section-${i % 3}`)
            .attr("x", d => xscale(d.cumulative))
            .attr("y", height/2 - barHeight/2)
            .attr("width", 1)
            .attr("height", barHeight + 24)
            .attr("fill", "black");

        // Walk backward through labels and check for overlap. if they overlap, move the label down
        // Get all text elements and convert to array
        const labels = bars.selectAll("text").nodes();
        
        // Walk backwards through labels starting from second-to-last
        for (let i = labels.length - 2; i >= 0; i--) {
            const currentLabel = labels[i];
            const nextLabel = labels[i + 1];
            
            // Get bounding boxes
            const currentBox = currentLabel.getBBox();
            const nextBox = nextLabel.getBBox();
            
            // Check if current label's right edge overlaps next label's left edge
            if ((currentBox.x + currentBox.width) > nextBox.x) {
                // Move current label down by 15px
                const currentY = parseFloat(d3.select(currentLabel).attr("y"));
                d3.select(currentLabel).attr("y", currentY + 15);

                // Move the connector line down by 15px
                const connectorLine = connectorLines.nodes()[i];
                d3.select(connectorLine)
                    .attr("height", currentY - barHeight);
            }

       
        }
        
       
    
        

    });
}

// Function to update the story charts when a story is selected
function updateStoryCharts(story) {
    const container = d3.select('.details-container')
        .append('div')
        .attr('class', 'story-charts');
    
    if (story.barCharts && story.barCharts.length > 0) {
        createStoryBarChart(container, story, window.healthcareData);
    }
}

// Export functions for use in other files
window.updateStoryCharts = updateStoryCharts; 