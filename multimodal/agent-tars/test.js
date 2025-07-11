const factors = [1000, 1000]

function parseAction(actionString) {
    // Extract operation type and parameter string
    const actionTypeMatch = actionString.match(/^(\w+)\(/);
    const action_type = actionTypeMatch ? actionTypeMatch[1] : '';

    const action_inputs = {};

    // Handle coordinate points
    const pointMatch = actionString.match(/point='<point>([\d\s]+)<\/point>'/);
    if (pointMatch) {
        const [x, y] = pointMatch[1].split(' ').map(Number);
        action_inputs.start_box = `[${x / factors[0]},${y / factors[1]}]`;
    }

    // Handle start and end coordinates (for drag operations)
    const startPointMatch = actionString.match(/start_point='<point>([\d\s]+)<\/point>'/);
    if (startPointMatch) {
        const [x, y] = startPointMatch[1].split(' ').map(Number);
        action_inputs.start_box = `[${x / factors[0]},${y / factors[1]}]`;
    }

    const endPointMatch = actionString.match(/end_point='<point>([\d\s]+)<\/point>'/);
    if (endPointMatch) {
        const [x, y] = endPointMatch[1].split(' ').map(Number);
        action_inputs.end_box = `[${x / factors[0]},${y / factors[1]}]`;
    }

    // Handle content parameter (for type and finished operations)
    const contentMatch = actionString.match(/content='([^']*(?:\\.[^']*)*)'/);
    if (contentMatch) {
        // Process escape characters
        action_inputs.content = contentMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"');
    }

    // Handle keys and hotkeys
    const keyMatch = actionString.match(/key='([^']*)'/);
    if (keyMatch) {
        action_inputs.key = keyMatch[1];
    }

    // Handle scroll direction
    const directionMatch = actionString.match(/direction='([^']*)'/);
    if (directionMatch) {
        action_inputs.direction = directionMatch[1];
    }

    return {
        action_type,
        action_inputs,
    };
}

// const res = parseAction("click(point='<point>450 565</point>");
const res = parseAction("click(point='<point>892 351</point>')");

["click(point='<point>892 351</point>')", "click(point='<point>150 315</point>", "click(point='<point>150 315</point>)"].forEach(str => {
    const parsed = parseAction(str);
    console.log('parsed: ', parsed)
})
