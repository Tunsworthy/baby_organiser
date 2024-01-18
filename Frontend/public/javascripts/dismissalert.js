
// Dismiss Alert Function
function dismissAlert(alertId) {
    console.log("called")
    fetch('alerts/dismiss-alert/' + alertId, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // Remove the alert from the DOM or update its status visually
        var alertElement = document.getElementById('alert-' + alertId);
        if (alertElement) {
            alertElement.remove(); // or hide it
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

