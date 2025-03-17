function stackedBar (data, {
  height = 200,
  barHeight = 110,
  halfBarHeight = barHeight / 2,
  f = d3.format('.1f'),
  margin = {top: 20, right: 10, bottom: 20, left: 10},
  w = width - margin.left - margin.right,
  h = height * 0.66,
  colors = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33"]
} = {}) {

  // Have a total of values for reference from the data:
  const total = d3.sum(data, d => d.value);
  console.info('total', total);

  // Format the data (instead of using d3.stack()) and filter out 0 values:
  function groupDataFunc(data) {
    // use a scale to get percentage values
    const percent = d3.scaleLinear()
      .domain([0, total])
      .range([0, 100])
    // filter out data that has zero values
    // also get mapping for next placement
    // (save having to format data for d3 stack)
    let cumulative = 0
    const _data = data.map(d => {
      cumulative += d.value
      return {
        value: d.value,
        // want the cumulative to prior value (start of rect)
        cumulative: cumulative - d.value,
        label: d.label,
        percent: percent(d.value)
      }
    }).filter(d => d.value > 0)
    return _data
  };

  const groupData = groupDataFunc(data);
  console.info('groupData', groupData);

  const svg = DOM.svg(width, height);
  const sel = d3.select(svg);
  
  // set up scales for horizontal placement
  const xScale = d3.scaleLinear()
    .domain([0, total])
    .range([0, w]);

  const join = sel.selectAll('g')
    .data(groupData)
    .join('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // stack rect for each data value
  join.append('rect')
    .attr('class', 'rect-stacked')
    .attr('x', d => xScale(d.cumulative))
    .attr('y', h / 2 - halfBarHeight)
    .attr('height', barHeight)
    .attr('width', d => xScale(d.value))
    .style('fill', (d, i) => colors[i]);

  // add values on bar
  join.append('text')
    .attr('class', 'text-value')
    .attr('text-anchor', 'middle')
    .attr('x', d => xScale(d.cumulative) + (xScale(d.value) / 2))
    .attr('y', (h / 2) + 5)
    .text(d => d.value);

  // add some labels for percentages
  join.append('text')
    .attr('class', 'text-percent')
    .attr('text-anchor', 'middle')
    .attr('x', d => xScale(d.cumulative) + (xScale(d.value) / 2))
    .attr('y', (h / 2) - (halfBarHeight * 1.1))
    .text(d => f(d.percent) + ' %');

  // add the labels
  join.append('text')
    .attr('class', 'text-label')
    .attr('text-anchor', 'middle')
    .attr('x', d => xScale(d.cumulative) + (xScale(d.value) / 2))
    .attr('y', (h / 2) + (halfBarHeight * 1.1) + 20)
    .style('fill', (d, i) => colors[i])
    .text(d => d.label);
  
  return svg;
}